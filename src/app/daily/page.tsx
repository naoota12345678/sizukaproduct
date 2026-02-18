"use client";

import { useState } from "react";
import { getDailyProductions, aggregateByProduct, type ProductionSummary } from "@/lib/firebase";

function todayInput(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DailyPage() {
  const [date, setDate] = useState(todayInput());
  const [summary, setSummary] = useState<ProductionSummary[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const dateStr = date.replace(/-/g, "");
      const prods = await getDailyProductions(dateStr);
      const agg = aggregateByProduct(prods);
      setSummary(agg);
      setTotalQuantity(agg.reduce((sum, item) => sum + item.quantity, 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">日次表示</h1>

      {/* 日付選択 */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">日付:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "読み込み中..." : "表示"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">エラー: {error}</p>
        </div>
      )}

      {/* テーブル */}
      {searched && !loading && summary.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {date} の製造データ
            </h2>
            <span className="text-sm text-slate-500">
              {summary.length}品目 / 合計 {totalQuantity.toLocaleString()}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-sm text-slate-600">
                  <th className="px-6 py-3 font-medium">商品コード</th>
                  <th className="px-6 py-3 font-medium">商品名</th>
                  <th className="px-6 py-3 font-medium">包装タイプ</th>
                  <th className="px-6 py-3 font-medium text-right">数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {item.productCode}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">
                      {item.productName}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {item.packageType}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-mono text-slate-800">
                      {item.quantity.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-6 py-3 text-sm" colSpan={3}>
                    合計
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-mono">
                    {totalQuantity.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {searched && !loading && summary.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">{date} の製造データはありません</p>
        </div>
      )}
    </div>
  );
}
