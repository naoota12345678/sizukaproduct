#!/usr/bin/env node
/**
 * フィールド追加スクリプト
 *
 * 使い方:
 *   node scripts/add-field.js <フィールド英名> <表示名> <変換シート列番号>
 *
 * 例:
 *   node scripts/add-field.js worker 担当者 5
 *   node scripts/add-field.js memo メモ 6
 *
 * 実行後:
 *   1. GASコード（firestore_sync.gs）は手動で修正が必要（出力されるコードをコピペ）
 *   2. git push origin main で自動デプロイ
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("使い方: node scripts/add-field.js <フィールド英名> <表示名> <変換シート列番号>");
  console.log("例:     node scripts/add-field.js worker 担当者 5");
  process.exit(1);
}

const [fieldName, displayName, colIndexStr] = args;
const colIndex = parseInt(colIndexStr, 10);

const srcDir = path.join(__dirname, "..", "src");
const firebasePath = path.join(srcDir, "lib", "firebase.ts");
const pages = ["app/page.tsx", "app/daily/page.tsx", "app/monthly/page.tsx"];

let changes = 0;

// --- 1. firebase.ts: Production型にフィールド追加 ---
function updateFirebaseTs() {
  let content = fs.readFileSync(firebasePath, "utf-8");

  // Production interfaceに追加
  if (content.includes(`${fieldName}?:`)) {
    console.log(`[スキップ] firebase.ts: "${fieldName}" は既に存在します`);
    return;
  }

  content = content.replace(
    /  createdAt\?: unknown;/,
    `  ${fieldName}?: string;\n  createdAt?: unknown;`
  );

  // ProductionSummaryにも追加
  content = content.replace(
    /export interface ProductionSummary \{[^}]+\}/,
    (match) => match.replace(
      "  quantity: number;",
      `  quantity: number;\n  ${fieldName}?: string;`
    )
  );

  // aggregateByProduct内でフィールドをコピー
  content = content.replace(
    `        quantity: p.quantity,\n      });`,
    `        quantity: p.quantity,\n        ${fieldName}: p.${fieldName} || "",\n      });`
  );

  fs.writeFileSync(firebasePath, content, "utf-8");
  console.log(`[更新] firebase.ts: Production型とProductionSummaryに "${fieldName}" を追加`);
  changes++;
}

// --- 2. 各ページのテーブルに列を追加 ---
function updatePage(pagePath) {
  const fullPath = path.join(srcDir, pagePath);
  let content = fs.readFileSync(fullPath, "utf-8");

  if (content.includes(displayName)) {
    console.log(`[スキップ] ${pagePath}: "${displayName}" は既に存在します`);
    return;
  }

  // thead: 「数量」or「合計数量」の前に列ヘッダーを追加
  content = content.replace(
    /(<th className="px-6 py-3 font-medium text-right">(?:数量|合計数量)<\/th>)/,
    `<th className="px-6 py-3 font-medium">${displayName}</th>\n                  $1`
  );

  // tbody: quantity表示の前にセルを追加
  content = content.replace(
    /(<td className="px-6 py-3 text-sm text-right font-mono text-slate-800">)/,
    `<td className="px-6 py-3 text-sm text-slate-600">\n                      {item.${fieldName} || "-"}\n                    </td>\n                    $1`
  );

  fs.writeFileSync(fullPath, content, "utf-8");
  console.log(`[更新] ${pagePath}: テーブルに "${displayName}" 列を追加`);
  changes++;
}

// --- 実行 ---
console.log(`\nフィールド追加: ${fieldName} (${displayName}) - 変換シート列${colIndex}\n`);
console.log("=== ウェブアプリ修正 ===");

updateFirebaseTs();
pages.forEach(updatePage);

console.log(`\n=== GAS修正用コード（手動でfirestore_sync.gsに追加） ===\n`);
console.log(`// --- syncProductionsToFirestore 内に追加 ---`);
console.log(`// 1. 変数読み取り（170行目付近、productCodeの下に追加）:`);
console.log(`const ${fieldName} = row[${colIndex}] ? row[${colIndex}].toString().trim() : '';`);
console.log(``);
console.log(`// 2. aggregated[key]のオブジェクトに追加:`);
console.log(`${fieldName}: ${fieldName},`);
console.log(``);
console.log(`// 3. toFirestoreFields_のオブジェクトに追加:`);
console.log(`${fieldName}: entry.${fieldName},`);

console.log(`\n=== 完了 ===`);
console.log(`変更ファイル数: ${changes}`);
if (changes > 0) {
  console.log(`\n次のステップ:`);
  console.log(`  1. GASを手動修正（上のコードをコピペ）`);
  console.log(`  2. git add . && git commit -m "${displayName}フィールドを追加" && git push origin main`);
}
