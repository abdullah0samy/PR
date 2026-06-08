import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api";
import { Plus, Pencil, Save, X, Trash2 } from "lucide-react";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nameEnglish: "", nameArabic: "" });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleAdd = async () => {
    try {
      await createCategory(form);
      setShowAdd(false);
      setForm({ nameEnglish: "", nameArabic: "" });
      getCategories().then(setCategories);
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateCategory(id, form);
      setEditingId(null);
      getCategories().then(setCategories);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف الفئة؟")) return;
    try {
      await deleteCategory(id);
      getCategories().then(setCategories);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الفئات</h1>
        <button
          onClick={() => { setShowAdd(true); setForm({ nameEnglish: "", nameArabic: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus size={20} /> إضافة فئة
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">الاسم (إنجليزي)</label>
              <input type="text" value={form.nameEnglish}
                onChange={(e) => setForm({ ...form, nameEnglish: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">الاسم (عربي)</label>
              <input type="text" value={form.nameArabic}
                onChange={(e) => setForm({ ...form, nameArabic: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-right py-3 px-4 font-medium text-gray-600">#</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">الإنجليزية</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">العربية</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                {editingId === c.id ? (
                  <>
                    <td className="py-2 px-4">{c.id}</td>
                    <td className="py-2 px-4">
                      <input type="text" value={form.nameEnglish}
                        onChange={(e) => setForm({ ...form, nameEnglish: e.target.value })}
                        className="w-full px-2 py-1 border rounded outline-none" />
                    </td>
                    <td className="py-2 px-4">
                      <input type="text" value={form.nameArabic}
                        onChange={(e) => setForm({ ...form, nameArabic: e.target.value })}
                        className="w-full px-2 py-1 border rounded outline-none" />
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleUpdate(c.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><X size={16} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 text-gray-500">{c.id}</td>
                    <td className="py-3 px-4">{c.nameEnglish}</td>
                    <td className="py-3 px-4">{c.nameArabic}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingId(c.id); setForm({ nameEnglish: c.nameEnglish, nameArabic: c.nameArabic }); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
