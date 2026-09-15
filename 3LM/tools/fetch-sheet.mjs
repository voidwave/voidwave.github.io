// أداة: تنزيل جدول الأسئلة وحفظه كنسخة محفوظة داخل المشروع
// Tool: download the question sheet into the bundled offline copy.
// ‏الاستخدام: npm run sheet  أو  node tools/fetch-sheet.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchSheetCsv, parseCsv, rowsToQuestions } from '../js/data/questions.js';
import { SHEET } from '../js/config.js';

const outPath = fileURLToPath(new URL('../js/data/fallback-questions.json', import.meta.url));

console.log('⏳ جارٍ تنزيل الجدول… fetching the sheet…');
const csv = await fetchSheetCsv();
const { items, skipped } = rowsToQuestions(parseCsv(csv));

if (items.length === 0) {
    console.error('❌ لا توجد أسئلة صالحة في الجدول — no valid questions found.');
    process.exit(1);
}

await mkdir(fileURLToPath(new URL('../js/data/', import.meta.url)), { recursive: true });
await writeFile(
    outPath,
    JSON.stringify(
        { source: 'sheet', sheetId: SHEET.id, gid: SHEET.gid, fetchedAt: new Date().toISOString(), skipped, items },
        null,
        2
    ) + '\n',
    'utf8'
);

console.log(`✅ تم حفظ ${items.length} سؤالًا (تم تجاهل ${skipped})`);
console.log(`   ${outPath}`);
console.log('   هذا الملف يُستخدم فقط عند تعذّر الوصول إلى الإنترنت.');
