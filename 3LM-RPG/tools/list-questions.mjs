// أداة: عرض الأسئلة الحالية من الجدول (مباشرة من جوجل) مع رقم الصف في الجدول
// Tool: list the questions the game would load right now, straight from the sheet.
// ‏الاستخدام: npm run list   أو   node tools/list-questions.mjs
import { fetchSheetCsv, parseCsv, rowsToQuestions } from '../js/data/questions.js';
import { SHEET } from '../js/config.js';

const csv = await fetchSheetCsv();
const rows = parseCsv(csv);
const { items, skipped } = rowsToQuestions(rows);
const headerOffset = Math.max(0, SHEET.headerRows);

console.log(`\n📄 الجدول: ${SHEET.id} (gid=${SHEET.gid})`);
console.log(`🔎 صفوف مقروءة: ${rows.length} — أسئلة صالحة: ${items.length} — صفوف متجاهلة: ${skipped}`);
console.log(`↩️ تجاهل أول ${headerOffset} صف (صف القالب/العنوان)\n`);

items.forEach((it, i) => {
    const rowNumber = i + 1 + headerOffset; // رقم الصف في الجدول
    console.log(`${String(i + 1).padStart(2)}. [جدول: صف ${rowNumber}] ${it.q}`);
    console.log(`     ✅ الصحيحة: ${it.correct}`);
    console.log(`     ❌ الخاطئة: ${it.wrongs.join(' | ')}`);
});

if (items.length === 0) console.log('⚠️ لا توجد أسئلة صالحة في الجدول.');
console.log('');
