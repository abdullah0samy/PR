import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getTemplates, submitSurvey } from "../api";
import { CheckCircle, Send, User, Hash, Home, Phone, Stethoscope, Calendar } from "lucide-react";

const scoreEmojis = [
  { value: 1, emoji: "😡", label: "سيئ جداً", color: "bg-red-100 hover:bg-red-200 border-red-200" },
  { value: 2, emoji: "😞", label: "سيئ", color: "bg-orange-100 hover:bg-orange-200 border-orange-200" },
  { value: 3, emoji: "😐", label: "مقبول", color: "bg-yellow-100 hover:bg-yellow-200 border-yellow-200" },
  { value: 4, emoji: "😊", label: "جيد", color: "bg-lime-100 hover:bg-lime-200 border-lime-200" },
  { value: 5, emoji: "😍", label: "ممتاز", color: "bg-green-100 hover:bg-green-200 border-green-200" },
];

export default function AgentSurvey() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [patientName, setPatientName] = useState("");
  const [medicalNumber, setMedicalNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [enterDate, setEnterDate] = useState(new Date().toISOString().split("T")[0]);
  const [interviewType, setInterviewType] = useState("داخلي");
  const [clinicType, setClinicType] = useState("عامة");
  const [recommend, setRecommend] = useState("Yes");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getTemplates().then((ts) => {
      setTemplates(ts);
      if (ts.length > 0) setQuestions(ts[0].questions || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length !== questions.length) return;

    setLoading(true);
    try {
      await submitSurvey({
        agentId: user?.id,
        patientName,
        medicalNumber,
        roomNumber,
        phoneNumber,
        doctorName,
        enterDate,
        interviewType,
        clinicType,
        recommend,
        answers: Object.entries(answers).map(([qId, score]) => ({
          questionId: parseInt(qId),
          score,
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAnswers({});
        setPatientName("");
        setMedicalNumber("");
        setRoomNumber("");
        setPhoneNumber("");
        setDoctorName("");
      }, 2000);
    } catch (err) {
      alert("حدث خطأ أثناء حفظ التقييم");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم حفظ التقييم بنجاح!</h2>
          <p className="text-gray-500">سيتم إرسال التنبيهات اللازمة تلقائياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">تقييم رضا المريض</h1>
        <p className="text-gray-500 text-sm">نموذج تقييم فوري لقياس رضا الزوار والمرضى</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">بيانات المريض</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <User size={16} /> اسم المريض
              </label>
              <input
                type="text" value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Hash size={16} /> الرقم الطبي
              </label>
              <input
                type="text" value={medicalNumber}
                onChange={(e) => setMedicalNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Home size={16} /> رقم الغرفة
              </label>
              <input
                type="text" value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone size={16} /> رقم الجوال
              </label>
              <input
                type="tel" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Stethoscope size={16} /> اسم الطبيب
              </label>
              <input
                type="text" value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} /> تاريخ الدخول
              </label>
              <input
                type="date" value={enterDate}
                onChange={(e) => setEnterDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">نوع المقابلة</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="داخلي">داخلي</option>
                <option value="عيادات خارجية">عيادات خارجية</option>
                <option value="طوارئ">طوارئ</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">نوع العيادة</label>
              <select
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="عامة">عامة</option>
                <option value="باطنة">باطنة</option>
                <option value="جراحة">جراحة</option>
                <option value="أطفال">أطفال</option>
                <option value="نساء وولادة">نساء وولادة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions with Emoji Scores */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">التقييم</h2>
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="border-b pb-4 last:border-b-0">
                <p className="font-medium text-gray-800 mb-3">
                  {idx + 1}. {q.text}
                </p>
                <div className="flex gap-2 justify-center">
                  {scoreEmojis.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: s.value }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[60px] transition-all
                        ${answers[q.id] === s.value ? "ring-2 ring-blue-500 scale-110 " + s.color : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommend */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">التوصية</h2>
          <p className="text-gray-600 mb-3">هل تنصح بزيارة المستشفى للآخرين؟</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setRecommend("Yes")}
              className={`flex-1 py-4 rounded-xl text-lg font-bold border-2 transition-all
                ${recommend === "Yes" ? "bg-green-100 border-green-500 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              😊 نعم
            </button>
            <button
              type="button"
              onClick={() => setRecommend("No")}
              className={`flex-1 py-4 rounded-xl text-lg font-bold border-2 transition-all
                ${recommend === "No" ? "bg-red-100 border-red-500 text-red-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              😞 لا
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || Object.keys(answers).length !== questions.length}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
        >
          <Send size={22} />
          {loading ? "جاري الحفظ..." : "إرسال التقييم"}
        </button>
      </form>
    </div>
  );
}
