// تحميل الأسئلة من جدول جوجل — Question loading from Google Sheets.
// الأعمدة: 1 سؤال، 2 الإجابة الصحيحة، 3-5 أجوبة خاطئة.
// Columns: 1 question, 2 correct answer, 3-5 wrong answers.
import { SHEET, sheetCsvUrl } from '../config.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** محلّل CSV يتحمّل علامات التنصيص والأسطر الجديدة داخل الخلايا — tolerant CSV parser */
export function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    const src = text.replace(/^\uFEFF/, ''); // إزالة BOM — strip BOM
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (inQuotes) {
            if (c === '"') {
                if (src[i + 1] === '"') { cur += '"'; i++; }
                else inQuotes = false;
            } else cur += c;
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(cur); cur = '';
        } else if (c === '\n') {
            row.push(cur); rows.push(row); row = []; cur = '';
        } else if (c !== '\r') {
            cur += c;
        }
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
    return rows;
}

/** تحويل صفوف الجدول إلى أسئلة صالحة مع تجاهل الصفوف الناقصة — normalize + validate */
export function rowsToQuestions(rows, skipRows = SHEET.headerRows) {
    const items = [];
    const seen = new Set();
    let skipped = 0;
    for (const row of rows.slice(Math.max(0, skipRows))) {
        const cells = row.map((c) => (c ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim());
        if (cells.every((c) => c === '')) continue; // سطر فارغ
        const [q, correct, w1, w2, w3] = cells;
        if (cells.length < 5 || !q || !correct || !w1 || !w2 || !w3 || q.length < 3) {
            skipped++;
            continue;
        }
        if (seen.has(q)) { skipped++; continue; } // سؤال مكرر
        seen.add(q);
        items.push({ q, correct, wrongs: [w1, w2, w3] });
    }
    return { items, skipped };
}

async function fetchWithTimeout(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const init = { signal: ctrl.signal };
        if (typeof window !== 'undefined') {
            init.cache = 'no-store'; // لا تخزين — نريد أحدث نسخة من الجدول كل مرة
            init.mode = 'cors';
        }
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

/** جلب CSV الجدول مع إعادة محاولة — fetch the sheet CSV with retry */
export async function fetchSheetCsv() {
    let lastErr;
    for (let attempt = 0; attempt <= SHEET.retries; attempt++) {
        try {
            return await fetchWithTimeout(sheetCsvUrl(), SHEET.timeoutMs);
        } catch (err) {
            lastErr = err;
            if (attempt < SHEET.retries) await delay(600);
        }
    }
    throw lastErr ?? new Error('sheet fetch failed');
}

/** تحميل الأسئلة: الجدول أولًا، وعند الفشل نسخة محفوظة داخل المشروع
 *  Load questions: live sheet first, bundled offline copy as fallback. */
export async function loadQuestions() {
    let sheetError = null;
    try {
        const text = await fetchSheetCsv();
        let result = rowsToQuestions(parseCsv(text));
        // شفاء تلقائي: إن حُذف صف القالب ولم تبقَ أسئلة، نعيد القراءة من الصف الأول
        // Self-heal: if skipping the header yields nothing, read from row 1 again
        if (result.items.length === 0 && SHEET.headerRows > 0) {
            result = rowsToQuestions(parseCsv(text), 0);
        }
        if (result.items.length === 0) throw new Error('no valid rows in sheet');
        return { items: result.items, skipped: result.skipped, source: 'sheet', sheetError };
    } catch (err) {
        sheetError = err;
    }

    const base = typeof document !== 'undefined' ? document.baseURI : undefined;
    const res = await fetch(new URL(SHEET.fallbackUrl, base));
    if (!res.ok) throw new Error(`fallback unavailable (${res.status})`);
    const data = await res.json();
    return { items: data.items ?? [], skipped: data.skipped ?? 0, source: 'fallback', sheetError };
}

/** اختيار أسئلة الرحلة حسب الحد الأقصى — pick the questions for one run */
export function pickForRun(items, rng) {
    const max = SHEET.maxPerRun;
    if (max === 'all' || !Number.isFinite(max) || items.length <= max) return rng.shuffle([...items]);
    const copy = [...items];
    rng.shuffle(copy);
    return copy.slice(0, max);
}

/** تجهيز سؤال بخيارات مبعثرة — shuffle the 4 options for display */
export function buildQuestion(item, rng) {
    const options = [item.correct, ...item.wrongs];
    rng.shuffle(options);
    return { q: item.q, options, correctIndex: options.indexOf(item.correct) };
}
