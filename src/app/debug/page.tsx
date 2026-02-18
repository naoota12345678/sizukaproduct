"use client";

export default function DebugPage() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "設定済み" : "未設定",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "未設定",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "未設定",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "未設定",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "設定済み" : "未設定",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "設定済み" : "未設定",
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">環境変数チェック</h1>
      <table className="border border-slate-300">
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
    </div>
  );
}
