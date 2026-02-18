import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sizukaproduct",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export interface Production {
  date: string;
  productName: string;
  packageType: string;
  quantity: number;
  productCode: string;
  createdAt?: unknown;
}

export interface ProductionSummary {
  productName: string;
  productCode: string;
  packageType: string;
  quantity: number;
}

// 日次: 指定日の製造データを取得
export async function getDailyProductions(dateStr: string): Promise<Production[]> {
  const q = query(
    collection(db, "productions"),
    where("date", "==", dateStr),
    orderBy("productName")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Production);
}

// 月次: 指定年月の製造データを取得
export async function getMonthlyProductions(year: number, month: number): Promise<Production[]> {
  const startDate = `${year}${String(month).padStart(2, "0")}01`;
  const endDate = `${year}${String(month).padStart(2, "0")}31`;
  const q = query(
    collection(db, "productions"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Production);
}

// 年次: 指定年の製造データを取得
export async function getYearlyProductions(year: number): Promise<Production[]> {
  const startDate = `${year}0101`;
  const endDate = `${year}1231`;
  const q = query(
    collection(db, "productions"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Production);
}

// 商品別に集計
export function aggregateByProduct(productions: Production[]): ProductionSummary[] {
  const map = new Map<string, ProductionSummary>();
  for (const p of productions) {
    const key = `${p.productCode}_${p.packageType}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += p.quantity;
    } else {
      map.set(key, {
        productName: p.productName,
        productCode: p.productCode,
        packageType: p.packageType,
        quantity: p.quantity,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName, "ja")
  );
}

// 月別に集計（年次表示用）
export function aggregateByMonth(
  productions: Production[]
): Map<number, ProductionSummary[]> {
  const monthMap = new Map<number, Production[]>();
  for (const p of productions) {
    const month = parseInt(p.date.substring(4, 6), 10);
    const existing = monthMap.get(month) || [];
    existing.push(p);
    monthMap.set(month, existing);
  }
  const result = new Map<number, ProductionSummary[]>();
  for (const [month, prods] of monthMap) {
    result.set(month, aggregateByProduct(prods));
  }
  return result;
}
