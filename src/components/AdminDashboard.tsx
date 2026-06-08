import { useState, useEffect } from "react";
import { getAnalytics } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";

const categoryColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [category, setCategory] = useState("الكل");
  const [loading, setLoading] = useState(true);

  const fetchData = async (cat?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (cat && cat !== "الكل" && cat !== "جميع العيادات") params.clinicType = cat;
      const result = await getAnalytics(Object.keys(params).length ? params : undefined);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(category); }, [category]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Gauge chart percentage
  const percent = data.overallSatisfactionPercent;
  const gaugeColor = percent >= 80 ? "#10B981" : percent >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><TrendingUp size={24} className="text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{data.totalSurveys}</div>
              <div className="text-sm text-gray-500">إجمالي التقييمات</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl"><ThumbsUp size={24} className="text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{data.satisfiedCount}</div>
              <div className="text-sm text-gray-500">راضٍ</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><ThumbsDown size={24} className="text-red-600" /></div>
            <div>
              <div className="text-2xl font-bold">{data.unsatisfiedCount}</div>
              <div className="text-sm text-gray-500">غير راضٍ</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle size={24} className="text-red-600" /></div>
            <div>
              <div className="text-2xl font-bold">{data.criticalCases?.length || 0}</div>
              <div className="text-sm text-gray-500">حالات حرجة</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Gauge */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">مؤشر الرضا العام</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={gaugeColor} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${percent}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: gaugeColor }}>{percent}%</span>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">راضٍ ({data.satisfiedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">غير راضٍ ({data.unsatisfiedCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart by Category with Dropdown Filter */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">تحليل الأقسام</h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="الكل">جميع العيادات</option>
              <option value="عامة">عامة</option>
              <option value="باطنة">باطنة</option>
              <option value="جراحة">جراحة</option>
              <option value="أطفال">أطفال</option>
              <option value="نساء وولادة">نساء وولادة</option>
            </select>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentStats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="titleArabic" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "نسبة الرضا"]}
                  labelFormatter={(label) => `القسم: ${label}`}
                />
                <Bar dataKey="averagePercent" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {data.departmentStats.map((_: any, idx: number) => (
                    <Cell key={idx} fill={categoryColors[idx % categoryColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.departmentStats.map((d: any, idx: number) => (
              <div key={d.category} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                <span className="text-sm font-medium">{d.titleArabic}</span>
                <span className="text-sm text-gray-500 mr-auto">{d.averagePercent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Cases */}
      {data.criticalCases?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">الحالات الحرجة (غير راضٍ)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-right py-2 px-3">المريض</th>
                  <th className="text-right py-2 px-3">الرقم الطبي</th>
                  <th className="text-right py-2 px-3">الطبيب</th>
                  <th className="text-right py-2 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.criticalCases.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{c.patientName}</td>
                    <td className="py-2 px-3">{c.medicalNumber}</td>
                    <td className="py-2 px-3">{c.doctorName}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        {c.followupStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
