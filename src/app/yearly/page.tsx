"use client";

import { useState } from "react";
import { getYearlyProductions, aggregateByMonth, type ProductionSummary } from "@/lib/firebase";

const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function YearlyPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthlyData, setMonthlyData] = useState<Map<number, ProductionSummary[]>>(new Map());
  const [productNames, setProductNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const prods = await getYearlyProductions(year);
      const byMonth = aggregateByMonth(prods);
      setMonthlyData(byMonth);

      // 全商品名を収集（商品名+包装タイプでユニーク）
      const nameSet = new Set<string>();
      for (const [, items] of byMonth) {
        for (const item of items) {
          nameSet.add(`${item.productName}|${item.packageType}|${item.productCode}`);
        }
      }
      const sorted = Array.from(nameSet).sort((a, b) => a.localeCompare(b, "ja"));
      setProductNames(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const getQuantity = (month: number, productKey: string): number => {
    const items = monthlyData.get(month);
    if (!items) return 0;
    const [name, pkg] = productKey.split("|");
    const found = items.find(
      (item) => item.productName === name && item.packageType === pkg
    );
    return found?.quantity || 0;
  };

  const getMonthTotal = (month: number): number => {
    const items = monthlyData.get(month);
    if (!items) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getProductTotal = (productKey: string): number => {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      total += getQuantity(m, productKey);
    }
    return total;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">年次表示</h1>

      {/* 年選択 */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">年:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
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

      {/* 年次テーブル（月別 x 商品の行列） */}
      {searched && !loading && productNames.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              {year}年 月別製造数推移
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-medium sticky left-0 bg-slate-50 min-w-[180px]">
                    商品名
                  </th>
                  <th className="px-2 py-3 font-medium min-w-[60px]">包装</th>
                  {MONTH_NAMES.map((name, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 font-medium text-right min-w-[70px]"
                    >
                      {name}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium text-right min-w-[80px] bg-slate-100">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productNames.map((key) => {
                  const [name, pkg, code] = key.split("|");
                  const total = getProductTotal(key);
                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800 sticky left-0 bg-white">
                        <span className="text-xs text-slate-400 mr-1">{code}</span>
                        {name}
                      </td>
                      <td className="px-2 py-2 text-slate-500 text-xs">{pkg}</td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const qty = getQuantity(m, key);
                        return (
                          <td
                            key={m}
                            className="px-3 py-2 text-right font-mono text-slate-700"
                          >
                            {qty > 0 ? qty.toLocaleString() : "-"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800 bg-slate-50">
                        {total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-semibold">
                  <td className="px-4 py-3 sticky left-0 bg-slate-100" colSpan={2}>
                    月合計
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <td key={m} className="px-3 py-3 text-right font-mono">
                      {getMonthTotal(m) > 0
                        ? getMonthTotal(m).toLocaleString()
                        : "-"}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-mono bg-slate-200">
                    {productNames
                      .reduce((sum, key) => sum + getProductTotal(key), 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {searched && !loading && productNames.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">{year}年 の製造データはありません</p>
        </div>
      )}
    </div>
  );
}
