"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export default function DebugPage() {
  const [status, setStatus] = useState("チェック中...");
  const [docCount, setDocCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "設定済み" : "未設定",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "未設定",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "未設定",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "未設定",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "設定済み" : "未設定",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "設定済み" : "未設定",
  };

  useEffect(() => {
    async function testFirestore() {
      try {
        setStatus("Firestoreに接続中...");
        const q = query(collection(db, "productions"), limit(3));
        const snapshot = await getDocs(q);
        setDocCount(snapshot.size);
        setStatus("接続成功");
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setError(err);
        setStatus("接続失敗");
      }
    }
    testFirestore();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">デバッグ</h1>

      <h2 className="text-lg font-semibold mt-6 mb-2">環境変数</h2>
      <table className="border border-slate-300 mb-6">
        <tbody>
          {Object.entries(config).map(([key, value]) => (
            <tr key={key} className="border-b border-slate-200">
              <td className="px-4 py-2 font-mono text-sm">{key}</td>
              <td className={`px-4 py-2 text-sm ${value === "未設定" ? "text-red-600 font-bold" : "text-green-600"}`}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-6 mb-2">Firestore接続テスト</h2>
      <p className={`text-sm ${status === "接続成功" ? "text-green-600" : status === "接続失敗" ? "text-red-600" : "text-slate-600"}`}>
        ステータス: {status}
      </p>
      {docCount !== null && (
        <p className="text-sm text-green-600">取得ドキュメント数: {docCount}</p>
      )}
      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700 text-sm font-mono break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
