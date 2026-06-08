import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

const roleLabels: Record<string, string> = {
  Admin: "مدير",
  Manager: "مشرف",
  Agent: "عضو",
};

const roleColors: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Manager: "bg-blue-100 text-blue-700",
  Agent: "bg-green-100 text-green-700",
};

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "Agent" });

  useEffect(() => { getUsers().then(setUsers).catch(() => {}); }, []);

  const handleAdd = async () => {
    try {
      await createUser(form);
      setShowAdd(false);
      setForm({ name: "", username: "", password: "", role: "Agent" });
      getUsers().then(setUsers);
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdate = async (id: number) => {
    try {
      const payload: any = { name: form.name, role: form.role };
      if (form.password) payload.password = form.password;
      await updateUser(id, payload);
      setEditingId(null);
      getUsers().then(setUsers);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف المستخدم؟")) return;
    try {
      await deleteUser(id);
      getUsers().then(setUsers);
    } catch (err: any) { alert(err.message); }
  };

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setForm({ name: u.name, username: u.username, password: "", role: u.role });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <button
          onClick={() => { setShowAdd(true); setForm({ name: "", username: "", password: "", role: "Agent" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus size={20} /> إضافة مستخدم
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-bold mb-4">مستخدم جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">الاسم</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">اسم المستخدم</label>
              <input type="text" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">كلمة المرور</label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">الدور</label>
              <select value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Admin">مدير</option>
                <option value="Manager">مشرف</option>
                <option value="Agent">عضو</option>
              </select>
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
              <th className="text-right py-3 px-4 font-medium text-gray-600">الاسم</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">اسم المستخدم</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">الدور</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                {editingId === u.id ? (
                  <>
                    <td className="py-2 px-4">{u.id}</td>
                    <td className="py-2 px-4">
                      <input type="text" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded outline-none" />
                    </td>
                    <td className="py-2 px-4 text-gray-500">{u.username}</td>
                    <td className="py-2 px-4">
                      <select value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="px-2 py-1 border rounded bg-white outline-none">
                        <option value="Admin">مدير</option>
                        <option value="Manager">مشرف</option>
                        <option value="Agent">عضو</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleUpdate(u.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><X size={16} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 text-gray-500">{u.id}</td>
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
