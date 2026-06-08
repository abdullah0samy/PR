import { useState, useEffect } from "react";
import { getWhatsAppLogs, simulateWebhook } from "../api";
import { MessageSquare, RefreshCw } from "lucide-react";

export default function WhatsAppLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getWhatsAppLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const statusColor = (status: string) => {
    if (status === "مرسلة") return "bg-yellow-100 text-yellow-700";
    if (status === "مستلمة") return "bg-blue-100 text-blue-700";
    if (status === "تمت القراءة") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">سجل رسائل الواتساب</h1>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">
          <RefreshCw size={18} /> تحديث
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا توجد رسائل واتساب بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right py-3 px-4 font-medium text-gray-600">المعرف</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">رقم الجوال</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الرقم الطبي</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الرسالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{log.id}</td>
                    <td className="py-3 px-4" dir="ltr">{log.phoneNumber}</td>
                    <td className="py-3 px-4">{log.medicalNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">{log.message}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(log.sentAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
