import { useState, useEffect } from "react";
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, getCategories } from "../api";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

export default function QuestionManagement() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ text: "", category: "Medical", priority: 1, templateId: 1 });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    getQuestions().then(setQuestions).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleAdd = async () => {
    try {
      await createQuestion(form);
      setShowAdd(false);
      setForm({ text: "", category: "Medical", priority: 1, templateId: 1 });
      getQuestions().then(setQuestions);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateQuestion(id, form);
      setEditingId(null);
      getQuestions().then(setQuestions);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
    try {
      await deleteQuestion(id);
      getQuestions().then(setQuestions);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setForm({ text: q.text, category: q.category, priority: q.priority, templateId: q.templateId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأسئلة</h1>
        <button
          onClick={() => { setShowAdd(true); setForm({ text: "", category: "Medical", priority: 1, templateId: 1 }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus size={20} /> إضافة سؤال
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-bold mb-4">سؤال جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600 block mb-1">نص السؤال</label>
              <input
                type="text" value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">التصنيف</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Medical">طبي</option>
                <option value="Nursing">تمريض</option>
                <option value="Hospitality">ضيافة</option>
                <option value="Security">أمن</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">الأولوية</label>
              <input
                type="number" min="1" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1">
              <Save size={16} /> حفظ
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
              <X size={16} /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-right py-3 px-4 font-medium text-gray-600">#</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">السؤال</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">التصنيف</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">الأولوية</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-b hover:bg-gray-50">
                {editingId === q.id ? (
                  <>
                    <td className="py-2 px-4">{q.id}</td>
                    <td className="py-2 px-4">
                      <input
                        type="text" value={form.text}
                        onChange={(e) => setForm({ ...form, text: e.target.value })}
                        className="w-full px-2 py-1 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="px-2 py-1 border rounded bg-white outline-none"
                      >
                        <option value="Medical">طبي</option>
                        <option value="Nursing">تمريض</option>
                        <option value="Hospitality">ضيافة</option>
                        <option value="Security">أمن</option>
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="number" min="1" value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 border rounded outline-none"
                      />
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleUpdate(q.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 text-gray-500">{q.id}</td>
                    <td className="py-3 px-4 font-medium">{q.text}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {q.category === "Medical" ? "طبي" : q.category === "Nursing" ? "تمريض" : q.category === "Hospitality" ? "ضيافة" : "أمن"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{q.priority}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(q)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
