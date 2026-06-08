import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-in-production";
const prisma = new PrismaClient();

app.use(express.json());

// ============================================================================
// AUTH MIDDLEWARE & GUARDS
// ============================================================================

interface JwtPayload { userId: number; username: string; role: string; }

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "توكن المصادقة مفقود." });
    return;
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "توكن غير صالح أو منتهي الصلاحية." });
  }
}

function requireRoles(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !allowed.includes(user.role)) {
      res.status(403).json({ error: "غير مصرح لك بالوصول لهذا المورد." });
      return;
    }
    next();
  };
}

// ============================================================================
// WHATSAPP AUTOMATION (Non-blocking async)
// ============================================================================

async function triggerWhatsAppApology(survey: {
  id: number;
  phoneNumber: string;
  medicalNumber: string;
  doctorName: string;
}) {
  const apologyText = `أهلاً بحضرتك يا فندم، نعتذر جداً لعدم رضاك الكامل عن الخدمة خلال زيارتك للمستشفى. نود إعلامك بأن شكواك قد وصلت مباشرة للإدارة العليا وتم تسجيلها برقم طبي (${survey.medicalNumber}) وتحت رعاية الطبيب المعالج (${survey.doctorName}). سيتواصل معك أحد مدراء الأقسام فوراً للاستماع لك وحل المشكلة بشكل نهائي. شكراً لمساعدتنا في تحسين خدماتنا.`;

  try {
    await prisma.whatsAppLog.create({
      data: {
        phoneNumber: survey.phoneNumber,
        message: apologyText,
        sentAt: new Date(),
        medicalNumber: survey.medicalNumber,
        doctorName: survey.doctorName,
        status: "مرسلة",
        surveyId: survey.id
      }
    });

    const gatewayUrl = process.env.EVOLUTION_API_URL || "https://api.evolution.example.com/message/sendText";
    const apiKey = process.env.EVOLUTION_API_KEY || "dummy_api_key";
    fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        number: survey.phoneNumber,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: apologyText }
      })
    }).catch(() => {});
  } catch (err) {}
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان." });
      return;
    }
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
      return;
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    const { password: _, ...publicUser } = user;
    res.json({ user: publicUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في الخادم الداخلي." });
  }
});

app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  res.json(user);
});

app.get("/api/users", authMiddleware, requireRoles("Admin", "Manager"), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب المستخدمين." });
  }
});

app.post("/api/users", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) {
      res.status(400).json({ error: "جميع الحقول مطلوبة لإنشاء مستخدم." });
      return;
    }
    if (!["Admin", "Manager", "Agent"].includes(role)) {
      res.status(400).json({ error: "دور غير صالح." });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existing) {
      res.status(400).json({ error: "اسم المستخدم هذا مسجل بالفعل." });
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, username: username.toLowerCase(), password: hash, role }
    });
    const { password: _, ...publicUser } = user;
    res.status(201).json(publicUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في إنشاء المستخدم." });
  }
});

app.put("/api/users/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, username, password, role } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (username) data.username = username.toLowerCase();
    if (password) data.password = await bcrypt.hash(password, 12);
    if (role) {
      if (!["Admin", "Manager", "Agent"].includes(role)) {
        res.status(400).json({ error: "دور غير صالح." });
        return;
      }
      data.role = role;
    }
    const user = await prisma.user.update({ where: { id }, data });
    const { password: _, ...publicUser } = user;
    res.json(publicUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في تحديث المستخدم." });
  }
});

app.delete("/api/users/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "تم حذف المستخدم بنجاح." });
  } catch (err) {
    res.status(500).json({ error: "خطأ في حذف المستخدم." });
  }
});

// ============================================================================
// TEMPLATES
// ============================================================================

app.get("/api/templates", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({ include: { questions: true } });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب القوالب." });
  }
});

// ============================================================================
// QUESTIONS (Admin/Manager only - Agent blocked)
// ============================================================================

app.get("/api/questions", authMiddleware, requireRoles("Admin", "Manager"), async (_req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({ orderBy: { id: "asc" }, include: { template: true } });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب الأسئلة." });
  }
});

app.post("/api/questions", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const { templateId, text, category, priority } = req.body;
    if (!templateId || !text || !category || priority === undefined) {
      res.status(400).json({ error: "جميع الحقول مطلوبة لإضافة سؤال." });
      return;
    }
    const question = await prisma.question.create({
      data: { templateId: parseInt(templateId), text, category, priority: parseInt(priority) }
    });
    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في إنشاء السؤال." });
  }
});

app.put("/api/questions/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { text, category, priority, templateId, isActive } = req.body;
    const data: any = {};
    if (text) data.text = text;
    if (category) data.category = category;
    if (priority !== undefined) data.priority = parseInt(priority);
    if (templateId) data.templateId = parseInt(templateId);
    if (isActive !== undefined) data.isActive = isActive;
    const question = await prisma.question.update({ where: { id }, data });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "خطأ في تحديث السؤال." });
  }
});

app.delete("/api/questions/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "تم حذف السؤال بنجاح." });
  } catch (err) {
    res.status(500).json({ error: "خطأ في حذف السؤال." });
  }
});

// ============================================================================
// SURVEYS
// ============================================================================

function computeAutoSatisfaction(answers: { score: number }[]): boolean {
  const lowScores = answers.filter(a => a.score <= 2).length;
  return lowScores < 2;
}

app.post("/api/surveys", authMiddleware, requireRoles("Agent", "Admin"), async (req: Request, res: Response) => {
  try {
    const {
      agentId, patientName, medicalNumber, roomNumber, phoneNumber,
      doctorName, enterDate, interviewType, clinicType,
      isSatisfied, recommend, answers
    } = req.body;

    if (!patientName || !medicalNumber || !phoneNumber || !doctorName || !interviewType || !clinicType || !recommend || !answers?.length) {
      res.status(400).json({ error: "جميع البيانات الأساسية للمريض وإجابات الأسئلة مطلوبة." });
      return;
    }

    const agent = await prisma.user.findUnique({ where: { id: parseInt(agentId) } });
    if (!agent) {
      res.status(404).json({ error: "العضو غير موجود." });
      return;
    }

    // SMART LOGIC: Auto-compute satisfaction based on scores
    const computedSatisfied = computeAutoSatisfaction(answers);
    // If isSatisfied is explicitly provided as boolean, respect it; otherwise compute
    const finalSatisfied = typeof isSatisfied === "boolean" ? isSatisfied : computedSatisfied;

    const survey = await prisma.$transaction(async (tx) => {
      const created = await tx.survey.create({
        data: {
          agentId: parseInt(agentId),
          agentName: agent.name,
          patientName,
          medicalNumber,
          roomNumber: roomNumber || "غير محدد",
          phoneNumber,
          doctorName,
          enterDate: enterDate ? new Date(enterDate) : new Date(),
          interviewType,
          clinicType,
          isSatisfied: finalSatisfied,
          recommend,
          answers: {
            create: answers.map((ans: { questionId: number; score: number }) => ({
              questionId: parseInt(ans.questionId as any),
              score: parseInt(ans.score as any)
            }))
          }
        },
        include: { answers: true }
      });
      return created;
    });

    // CONDITIONAL WHATSAPP ALERT: Non-blocking, does not await
    if (!survey.isSatisfied || survey.recommend === "No") {
      triggerWhatsAppApology(survey);
    }

    res.status(201).json({
      message: "تم حفظ التقييم بنجاح وإرسال التنبيهات اللازمة.",
      survey
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في حفظ التقييم." });
  }
});

app.get("/api/surveys/archive", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clinicType, interviewType, satisfaction, search, startDate, endDate, page = "1", limit = "20" } = req.query;

    const where: any = {};

    if (clinicType && clinicType !== "جميع العيادات" && clinicType !== "الكل") {
      where.clinicType = clinicType;
    }
    if (interviewType && interviewType !== "الكل" && interviewType !== "جميع المقابلات") {
      where.interviewType = interviewType;
    }
    if (satisfaction && satisfaction !== "الكل") {
      if (satisfaction === "Satisfied" || satisfaction === "راضٍ" || satisfaction === "راضٍ جداً") {
        where.isSatisfied = true;
      } else if (satisfaction === "Unsatisfied" || satisfaction === "غير راضٍ" || satisfaction === "مستاء") {
        where.isSatisfied = false;
      }
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.toLowerCase();
      where.OR = [
        { patientName: { contains: query, mode: "insensitive" } },
        { medicalNumber: { contains: query, mode: "insensitive" } },
        { doctorName: { contains: query, mode: "insensitive" } },
        { phoneNumber: { contains: query, mode: "insensitive" } }
      ];
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
    }
    if (endDate) {
      const endBoundary = new Date(endDate as string);
      endBoundary.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: endBoundary };
    }

    const p = parseInt(page as string) || 1;
    const size = parseInt(limit as string) || 20;

    const [surveys, totalCount] = await Promise.all([
      prisma.survey.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * size,
        take: size
      }),
      prisma.survey.count({ where })
    ]);

    res.json({
      surveys,
      pagination: {
        currentPage: p,
        totalPages: Math.ceil(totalCount / size),
        totalCount,
        limit: size
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في جلب الاستبيانات." });
  }
});

app.get("/api/surveys/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        answers: {
          include: { question: true }
        }
      }
    });
    if (!survey) {
      res.status(404).json({ error: "لم يتم العثور على التقييم المطلوب." });
      return;
    }
    const detailedAnswers = survey.answers.map((ans) => ({
      id: ans.id,
      questionId: ans.questionId,
      questionText: ans.question.text,
      category: ans.question.category,
      priority: ans.question.priority,
      score: ans.score
    }));
    res.json({ survey, answers: detailedAnswers });
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب التقييم." });
  }
});

app.put("/api/surveys/:id", authMiddleware, requireRoles("Admin", "Manager"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      res.status(404).json({ error: "الاستبيان غير موجود." });
      return;
    }
    const updated = await prisma.survey.update({
      where: { id },
      data: req.body
    });
    res.json({ message: "تم تحديث الاستبيان بنجاح.", survey: updated });
  } catch (err) {
    res.status(500).json({ error: "خطأ في تحديث الاستبيان." });
  }
});

app.delete("/api/surveys/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.answer.deleteMany({ where: { surveyId: id } });
    await prisma.survey.delete({ where: { id } });
    res.json({ message: "تم حذف الاستبيان بنجاح." });
  } catch (err) {
    res.status(500).json({ error: "خطأ في حذف الاستبيان." });
  }
});

app.post("/api/surveys/:id/followup", authMiddleware, requireRoles("Admin", "Manager"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { followupStatus, reminderText } = req.body;
    if (!followupStatus) {
      res.status(400).json({ error: "حالة المتابعة مطلوبة." });
      return;
    }
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) {
      res.status(404).json({ error: "لم يتم العثور على التقييم المطلوب لمتابعته." });
      return;
    }
    const updated = await prisma.survey.update({
      where: { id },
      data: { followupStatus, reminderText: reminderText || "" }
    });
    res.json({ message: "تمت تحديث حالة المتابعة والتذكير بنجاح.", survey: updated });
  } catch (err) {
    res.status(500).json({ error: "خطأ في تحديث المتابعة." });
  }
});

// ============================================================================
// ANALYTICS (Admin/Manager only - Agent blocked)
// ============================================================================

app.get("/api/analytics", authMiddleware, requireRoles("Admin", "Manager"), async (req: Request, res: Response) => {
  try {
    const { clinicType, startDate, endDate } = req.query;
    const where: any = {};

    if (clinicType && clinicType !== "جميع العيادات" && clinicType !== "الكل") {
      where.clinicType = clinicType;
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
    }
    if (endDate) {
      const endBoundary = new Date(endDate as string);
      endBoundary.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: endBoundary };
    }

    const surveys = await prisma.survey.findMany({ where });
    const total = surveys.length;
    const satisfiedCount = surveys.filter((s) => s.isSatisfied).length;
    const overallSatisfactionPercent = total ? Math.round((satisfiedCount / total) * 100) : 0;

    const questions = await prisma.question.findMany();
    const categories = await prisma.category.findMany();
    const allAnswers = await prisma.answer.findMany({
      where: { surveyId: { in: surveys.map((s) => s.id) } }
    });

    const departmentStats = (categories.length ? categories : [
      { id: 1, nameEnglish: "Medical", nameArabic: "طبي" },
      { id: 2, nameEnglish: "Nursing", nameArabic: "تمريض" },
      { id: 3, nameEnglish: "Hospitality", nameArabic: "ضيافة" },
      { id: 4, nameEnglish: "Security", nameArabic: "أمن" }
    ]).map((cat) => {
      const qIds = questions.filter((q) => q.category.toLowerCase() === cat.nameEnglish.toLowerCase()).map((q) => q.id);
      const relevantAnswers = allAnswers.filter((a) => qIds.includes(a.questionId));
      const count = relevantAnswers.length;
      const totalScore = relevantAnswers.reduce((sum, a) => sum + a.score, 0);
      const averageScore = count ? parseFloat((totalScore / count).toFixed(2)) : 0;
      const averagePercent = count ? Math.round((totalScore / (count * 5)) * 100) : 0;
      return {
        category: cat.nameEnglish,
        titleArabic: cat.nameArabic,
        averageScore,
        averagePercent,
        totalAnswersCount: count
      };
    });

    const criticalCases = surveys
      .filter((s) => !s.isSatisfied)
      .map((s) => ({
        id: s.id,
        medicalNumber: s.medicalNumber,
        patientName: s.patientName,
        doctorName: s.doctorName,
        enterDate: s.enterDate,
        recommend: s.recommend,
        createdAt: s.createdAt,
        followupStatus: s.followupStatus || "قيد العمل",
        reminderText: s.reminderText || ""
      }));

    res.json({
      overallSatisfactionPercent,
      satisfiedCount,
      unsatisfiedCount: total - satisfiedCount,
      totalSurveys: total,
      departmentStats,
      criticalCases
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في جلب التحليلات." });
  }
});

// ============================================================================
// CATEGORIES (Admin/Manager only)
// ============================================================================

app.get("/api/categories", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب الفئات." });
  }
});

app.post("/api/categories", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const { nameEnglish, nameArabic } = req.body;
    if (!nameEnglish || !nameArabic) {
      res.status(400).json({ error: "اسم الفئة بالعربية والإنجليزية مطلوبان." });
      return;
    }
    const existing = await prisma.category.findUnique({ where: { nameEnglish: nameEnglish.trim() } });
    if (existing) {
      res.status(400).json({ error: "هذه الفئة مسجلة بالفعل بالاسم الإنجليزي المحدد." });
      return;
    }
    const cat = await prisma.category.create({
      data: { nameEnglish: nameEnglish.trim(), nameArabic: nameArabic.trim() }
    });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: "خطأ في إنشاء الفئة." });
  }
});

app.put("/api/categories/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nameEnglish, nameArabic } = req.body;
    const cat = await prisma.category.update({
      where: { id },
      data: { nameEnglish: nameEnglish?.trim(), nameArabic: nameArabic?.trim() }
    });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: "خطأ في تحديث الفئة." });
  }
});

app.delete("/api/categories/:id", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "تم حذف الفئة الإدارية بنجاح." });
  } catch (err) {
    res.status(500).json({ error: "خطأ في حذف الفئة." });
  }
});

// ============================================================================
// WHATSAPP LOGS
// ============================================================================

app.get("/api/whatsapp/logs", authMiddleware, requireRoles("Admin", "Manager"), async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.whatsAppLog.findMany({ orderBy: { sentAt: "desc" } });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب سجلات الواتساب." });
  }
});

app.post("/api/whatsapp/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const event = payload.event || "messages.update";
    const data = payload.data;

    let logId = "";
    let newStatus: string | undefined;

    if (data && data.key) {
      logId = data.key.id || "";
      const evolutionStatus = data.status;
      if (evolutionStatus === "READ" || evolutionStatus === "PLAYED" || evolutionStatus === 3 || evolutionStatus === 4) {
        newStatus = "تمت القراءة";
      } else if (evolutionStatus === "DELIVERY_ACK" || evolutionStatus === 2) {
        newStatus = "مستلمة";
      } else {
        newStatus = "مرسلة";
      }
    } else if (payload.logId && payload.status) {
      logId = payload.logId;
      newStatus = payload.status;
    }

    if (!logId) {
      res.status(400).json({ error: "لم يتم العثور على معرف الرسالة (id) للربط مع سجلات النظام." });
      return;
    }

    const log = await prisma.whatsAppLog.findUnique({ where: { id: logId } });
    if (!log) {
      res.status(404).json({ error: `السجل ذو المعرف (${logId}) غير موجود أو غير مسجل بالمنظومة.` });
      return;
    }

    const updated = await prisma.whatsAppLog.update({
      where: { id: logId },
      data: {
        status: newStatus || log.status,
        webhookEvent: event,
        webhookUpdatedAt: new Date(),
        webhookRawPayload: JSON.stringify(payload)
      }
    });

    res.json({
      message: "تم استقبال حدث الـ Webhook وتحديث حالة وصول الرسالة بنجاح.",
      logId,
      status: updated.status,
      updatedAt: updated.webhookUpdatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في معالجة الـ Webhook." });
  }
});

app.post("/api/whatsapp/simulate-webhook", authMiddleware, requireRoles("Admin"), async (req: Request, res: Response) => {
  try {
    const { logId, status } = req.body;
    if (!logId || !status) {
      res.status(400).json({ error: "معرف الرسالة والحالة التفصيلية مرسلة مطلوبة." });
      return;
    }

    const log = await prisma.whatsAppLog.findUnique({ where: { id: logId } });
    if (!log) {
      res.status(404).json({ error: "السجل ذو المعرف المذكور غير موجود." });
      return;
    }

    let evoStatus = "PENDING";
    if (status === "تمت القراءة") {
      evoStatus = "READ";
    } else if (status === "مستلمة") {
      evoStatus = "DELIVERY_ACK";
    } else {
      evoStatus = "SERVER_ACK";
    }

    const updated = await prisma.whatsAppLog.update({
      where: { id: logId },
      data: {
        status,
        webhookEvent: "messages.update",
        webhookUpdatedAt: new Date(),
        webhookRawPayload: JSON.stringify({
          event: "messages.update",
          instance: "Nuzul-Evolution-Instance-Main",
          data: {
            key: { id: logId, remoteJid: `${log.phoneNumber}@s.whatsapp.net`, fromMe: true },
            status: evoStatus
          }
        })
      }
    });

    res.json({
      message: `تم محاكاة حدث Webhook بنجاح (${evoStatus}) لتحديث حالة السجل ${logId}.`,
      log: updated
    });
  } catch (err) {
    res.status(500).json({ error: "خطأ في محاكاة الـ Webhook." });
  }
});

// ============================================================================
// VITE AND ASSETS SERVER SETUP
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
