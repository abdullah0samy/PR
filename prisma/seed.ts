import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { name: "المدير العام", username: "admin", password: hash, role: "Admin" },
  });

  await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: { name: "مدير الجودة", username: "manager", password: hash, role: "Manager" },
  });

  await prisma.user.upsert({
    where: { username: "agent1" },
    update: {},
    create: { name: "أحمد العضو", username: "agent1", password: hash, role: "Agent" },
  });

  const categories = [
    { nameEnglish: "Medical", nameArabic: "طبي" },
    { nameEnglish: "Nursing", nameArabic: "تمريض" },
    { nameEnglish: "Hospitality", nameArabic: "ضيافة" },
    { nameEnglish: "Security", nameArabic: "أمن" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { nameEnglish: c.nameEnglish },
      update: {},
      create: c,
    });
  }

  const template = await prisma.template.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "نموذج تقييم رضا المرضى الأساسي", isActive: true },
  });

  const questions = [
    { templateId: 1, text: "كيف تقيم نظافة الغرفة؟", category: "Hospitality", priority: 1 },
    { templateId: 1, text: "مستوى تعامل الطاقم الطبي؟", category: "Medical", priority: 1 },
    { templateId: 1, text: "سرعة استجابة طاقم التمريض؟", category: "Nursing", priority: 1 },
    { templateId: 1, text: "شعورك بالأمان في المستشفى؟", category: "Security", priority: 1 },
    { templateId: 1, text: "جودة الطعام المقدم؟", category: "Hospitality", priority: 2 },
    { templateId: 1, text: "وضوح شرح الطبيب للعلاج؟", category: "Medical", priority: 1 },
    { templateId: 1, text: "تعاون طاقم التمريض؟", category: "Nursing", priority: 2 },
    { templateId: 1, text: "تنظيم منطقة الانتظار؟", category: "Hospitality", priority: 2 },
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());