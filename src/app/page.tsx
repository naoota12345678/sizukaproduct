"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDailyProductions, aggregateByProduct, type ProductionSummary } from "@/lib/firebase";

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatDate(dateStr: string): string {
  return `${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<ProductionSummary[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dateStr = todayStr();

  useEffect(() => {
    getDailyProductions(dateStr)
      .then((prods) => {
        const agg = aggregateByProduct(prods);
        setSummary(agg);
        setTotalQuantity(agg.reduce((sum, item) => sum + item.quantity, 0));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateStr]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        ダッシュボード
      </h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <p className="text-sm text-slate-500">本日の日付</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {formatDate(dateStr)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <p className="text-sm text-slate-500">本日の製造品目数</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {loading ? "..." : summary.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <p className="text-sm text-slate-500">本日の製造合計数</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {loading ? "..." : totalQuantity.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ナビゲーションカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/daily"
          className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold text-slate-800">日次表示</h2>
          <p className="text-sm text-slate-500 mt-1">
            日付を選んで製造データを確認
          </p>
        </Link>
        <Link
          href="/monthly"
          className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold text-slate-800">月次表示</h2>
          <p className="text-sm text-slate-500 mt-1">
            月ごとの製造数合計を確認
          </p>
        </Link>
        <Link
          href="/yearly"
          className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <h2 className="text-lg font-semibold text-slate-800">年次表示</h2>
          <p className="text-sm text-slate-500 mt-1">
            年間の月別製造数推移を確認
          </p>
        </Link>
      </div>

      {/* 本日の製造データ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">エラー: {error}</p>
        </div>
      )}

      {!loading && summary.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">
              本日の製造データ
            </h2>
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

      {!loading && summary.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">本日の製造データはまだありません</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">読み込み中...</p>
        </div>
      )}
    </div>
  );
}
