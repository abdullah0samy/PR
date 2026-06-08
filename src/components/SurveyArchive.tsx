import { useState, useEffect } from "react";
import { getSurveysArchive } from "../api";
import { Search, ChevronRight, ChevronLeft, Filter, Eye } from "lucide-react";

export default function SurveyArchive() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [satisfaction, setSatisfaction] = useState("الكل");
  const [clinicType, setClinicType] = useState("الكل");
  const [loading, setLoading] = useState(true);

  const fetchData = async (p: number, s: string, sat: string, clinic: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: "20" };
      if (s.trim()) params.search = s.trim();
      if (sat !== "الكل") params.satisfaction = sat;
      if (clinic !== "الكل" && clinic !== "جميع العيادات") params.clinicType = clinic;
      const result = await getSurveysArchive(params);
      setSurveys(result.surveys);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(page, search, satisfaction, clinicType), 300);
    return () => clearTimeout(timer);
  }, [page, search, satisfaction, clinicType]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">أرشيف التقييمات</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
        {/* Global Search */}
        <div className="relative">
          <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم، الرقم الطبي، الطبيب، أو رقم الجوال..."
            className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={satisfaction}
              onChange={(e) => { setSatisfaction(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="الكل">جميع التقييمات</option>
              <option value="Satisfied">راضٍ</option>
              <option value="Unsatisfied">غير راضٍ</option>
            </select>
          </div>
          <select
            value={clinicType}
            onChange={(e) => { setClinicType(e.target.value); setPage(1); }}
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
      </div>

      {/* Survey Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-20 text-gray-500">لا توجد تقييمات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right py-3 px-4 font-medium text-gray-600">المريض</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الرقم الطبي</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الطبيب</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الجوال</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">التاريخ</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">عرض</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{s.patientName}</td>
                    <td className="py-3 px-4">{s.medicalNumber}</td>
                    <td className="py-3 px-4">{s.doctorName}</td>
                    <td className="py-3 px-4" dir="ltr">{s.phoneNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.isSatisfied ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {s.isSatisfied ? "راضٍ" : "غير راضٍ"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">
            إجمالي {pagination.totalCount} تقييم - صفحة {pagination.currentPage} من {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
              {pagination.currentPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
