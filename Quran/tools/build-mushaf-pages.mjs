#!/usr/bin/env node
/**
 * Builds the data used by index2.html, the "Mushaf page" reader.
 *
 * The technique (the same one quran.com uses for its Mushaf view):
 *
 *   - Every printed page of the Madani Mushaf has its own font (p<page>.woff2).
 *     Inside that font, each *word* of that page is drawn as a single glyph in
 *     its exact printed shape, and that glyph is mapped to one code point
 *     (`code_v2` in the API, e.g. U+FCAD = "ٱلْحَمْدُ" on page 293).
 *   - The page is laid out as the 15 printed lines, each line filling the page
 *     width, so the words break exactly where the printed page breaks.
 *   - The real ʿUthmānī word is kept next to the glyph, so the text can still be
 *     selected, searched and copied.
 *   - The word audio files are named after the word's *position* in the verse
 *     (wbw/017_105_005.mp3 is the fifth word of 17:105). The API's audio_url
 *     field must not be used to name them: it counts the ۞ and waqf marks
 *     (ۚ ۖ ۗ ۛ) as extra slots, so it drifts one file further with every mark.
 *   - The API's by_page filter follows the *older* Mushaf pagination. Up to
 *     page 120 the two layouts agree, from page 121 they part: a by_page/N
 *     response carries page N-1's last verse (whose glyphs are not in page N's
 *     font, so it drew as garbage) and leaves out page N's own last verse
 *     (which only shows up in page N+1). Every word's own page_number is the
 *     page of the print the fonts belong to, so the build fetches whole
 *     chapters and groups the words by that field instead.
 *
 * Data sources:
 *   - api.quran.com/api/v4        word fields: code_v2, line_number, text_uthmani
 *                                 (+ translation / transliteration / word audio)
 *   - quran.com/fonts/quran/hafs/v2/woff2   the QPC Hafs "v2" page fonts
 *
 * The QPC fonts belong to the King Fahd Complex for the Printing of the Holy
 * Quran and are only downloaded here for local development. Check the Qur'anic
 * Universal Library (qul.tarteel.ai) licence before redistributing them.
 *
 * Usage:
 *     node tools/build-mushaf-pages.mjs [chapter | all] [--force]
 *
 *         chapter    chapter to build, default 18 (Al-Kahf)
 *         all        build every page of the Quran (604 pages, ~115 MB of fonts)
 *         --force    re-download the page fonts even when they already exist
 *
 * Output:
 *     QuranText/MushafPages/index.json        all chapters + page index ("all")
 *     QuranText/MushafPages/ch<chapter>.json  one chapter (single-chapter run)
 *     QuranText/MushafPages/p<page>.json      words and verses of one page
 *     fonts/mushaf/p<page>.woff2              the page font
 */
import { existsSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_DIR = path.join(ROOT, 'QuranText', 'MushafPages');
const FONT_DIR = path.join(ROOT, 'fonts', 'mushaf');

const API = 'https://api.quran.com/api/v4';
const WORD_FIELDS = 'text_uthmani,code_v2,line_number,page_number';
const fontUrl = page => `https://quran.com/fonts/quran/hafs/v2/woff2/p${page}.woff2`;
const HEADERS = {
    'User-Agent': 'QuranJS-mushaf-builder/1.0 (local development)',
    Accept: 'application/json'
};
/* Small pause between requests so the API is not hammered. */
const PAUSE_MS = 150;

const cli = process.argv.slice(2);
const force = cli.includes('--force');
const everything = cli.includes('all');
const chapter = Number(cli.find(value => /^\d+$/.test(value)) || 18);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return await response.json();
        } catch (error) {
            lastError = error;
            if (attempt < 3) await sleep(400 * attempt);
        }
    }
    throw new Error(`GET ${url} failed: ${lastError.message}`);
}

async function download(url, file) {
    if (!force && existsSync(file)) return (await stat(file)).size;
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(file, buffer);
    await sleep(PAUSE_MS);
    return buffer.length;
}

/* Runs `worker` over `items`, a few at a time, so the build stays quick without
 * hammering the API. */
async function runPool(items, limit, worker) {
    const queue = items.slice();
    const runners = [];
    for (let i = 0; i < Math.min(limit, queue.length); i += 1) {
        runners.push((async () => {
            for (; ;) {
                const item = queue.shift();
                if (item === undefined) return;
                await worker(item);
            }
        })());
    }
    await Promise.all(runners);
}

/* Every verse of one chapter, with its words. The words are grouped by their
 * own page_number afterwards (groupByPage) instead of trusting the API's
 * by_page filter, which follows the older pagination. */
async function fetchChapterVerses(chapterId) {
    const verses = [];
    let pageParam = 1;
    for (; ;) {
        const url = `${API}/verses/by_chapter/${chapterId}?words=true&word_fields=${WORD_FIELDS}` +
            `&per_page=50&page=${pageParam}`;
        const data = await getJson(url);
        verses.push(...(data.verses || []));
        const meta = data.pagination;
        if (!meta || !meta.next_page || pageParam >= meta.total_pages) break;
        pageParam = meta.next_page;
        await sleep(PAUSE_MS);
    }
    return verses;
}

/* The word audio of a verse: quran.com numbers the files by the word's position
 * in the verse (wbw/017_105_005.mp3 = the fifth word of 17:105). */
function wordAudioPath(verseKey, position) {
    const [surah, ayah] = verseKey.split(':');
    const pad = value => String(value).padStart(3, '0');
    return `wbw/${pad(surah)}_${pad(ayah)}_${pad(position)}.mp3`;
}

/* Groups every word of the fetched verses by the page it is printed on. The
 * word's own page_number is the page of the print the fonts belong to; the
 * API's by_page filter instead follows the older pagination, which parts from
 * it at page 121 - it hands page 120's last verse to page 121 and page 121's
 * last verse to page 122, so the first drew as garbage (those glyphs are not
 * in that page's font) and the second went missing. */
function groupByPage(verses) {
    const pages = new Map();        // page -> word entries, in reading order
    const texts = new Map();        // verse_key -> the verse and its full text
    const chapterPages = new Map(); // chapter -> { first, last }

    for (const verse of verses) {
        const [chapterId, verseNumber] = verse.verse_key.split(':').map(Number);
        const realWords = [];
        let page = 0;
        for (const word of verse.words || []) {
            if (word.page_number) page = word.page_number;
            if (!page) continue;                      // no page known: never happens
            if (word.char_type_name !== 'end') realWords.push(word.text_uthmani);

            if (!pages.has(page)) pages.set(page, []);
            pages.get(page).push({
                line: word.line_number || 1,
                k: verse.verse_key,                       // "18:1"
                p: word.position,                         // word number in the verse
                t: word.char_type_name,                   // "word" | "end"
                g: word.code_v2,                          // glyph code point(s)
                x: word.text_uthmani,                     // the real word
                tr: word.translation ? word.translation.text : null,
                tl: word.transliteration ? word.transliteration.text : null,
                a: word.char_type_name === 'end' ? null   // word audio, relative path
                    : wordAudioPath(verse.verse_key, word.position)
            });

            const range = chapterPages.get(chapterId) || { first: page, last: page };
            range.first = Math.min(range.first, page);
            range.last = Math.max(range.last, page);
            chapterPages.set(chapterId, range);
        }
        if (realWords.length) {
            texts.set(verse.verse_key, {
                k: verse.verse_key,
                n: verseNumber,
                c: chapterId,
                text: realWords.join(' ')
            });
        }
    }
    return { pages, texts, chapterPages };
}

/* The page index2.js draws: lines of words, plus the verses written on it. */
function buildPageData(pageNumber, entries, texts) {
    const lines = new Map();
    const verseKeys = new Set();

    for (const { line, ...word } of entries) {
        if (!lines.has(line)) lines.set(line, []);
        lines.get(line).push(word);
        if (!verseKeys.has(word.k)) verseKeys.add(word.k);
    }

    return {
        page: pageNumber,
        font: `p${pageNumber}-v2`,
        fontFile: `fonts/mushaf/p${pageNumber}.woff2`,
        lines: [...lines.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([line, words]) => ({ line, words })),
        verses: [...verseKeys].map(key => texts.get(key)).filter(Boolean)
    };
}

/* Writes one printed page: its word list and its font. */
async function buildOnePage(pageNumber, entries, texts) {
    const built = buildPageData(pageNumber, entries, texts);
    await writeFile(path.join(PAGE_DIR, `p${pageNumber}.json`), JSON.stringify(built, null, 1) + '\n', 'utf8');

    /* How many of the 15 printed lines the page uses; a surah banner takes two
     * of them, which is what the reader needs to size the page before it is
     * drawn. */
    const banners = built.lines.filter(line => {
        const first = line.words[0];
        return first && first.p === 1 && /:1$/.test(first.k);
    }).length;

    const fontBytes = await download(fontUrl(pageNumber), path.join(FONT_DIR, `p${pageNumber}.woff2`));
    return {
        page: pageNumber,
        slots: built.lines.length + banners * 2,
        verses: built.verses.length,
        words: built.lines.reduce((total, line) => total + line.words.length, 0),
        font: `fonts/mushaf/p${pageNumber}.woff2`,
        fontBytes
    };
}

async function main() {
    await mkdir(PAGE_DIR, { recursive: true });
    await mkdir(FONT_DIR, { recursive: true });

    const chapters = (await getJson(`${API}/chapters?language=ar`)).chapters;
    const selected = everything ? chapters : chapters.filter(item => item.id === chapter);
    if (!selected.length) throw new Error(`Unknown chapter ${chapter}`);

    /* Whole chapters are fetched (every chapter once for the whole Quran),
     * because which page a word is printed on is decided by the word itself.
     * A single chapter also needs its neighbours: their verses share its first
     * and last printed page. */
    const wanted = everything
        ? chapters.map(item => item.id)
        : [chapter - 1, chapter, chapter + 1].filter(id => chapters.some(item => item.id === id));

    const verses = [];
    await runPool(wanted, 3, async id => {
        verses.push(...await fetchChapterVerses(id));
    });
    verses.sort((a, b) => {
        const [chapterA, verseA] = a.verse_key.split(':').map(Number);
        const [chapterB, verseB] = b.verse_key.split(':').map(Number);
        return chapterA - chapterB || verseA - verseB;
    });

    const { pages: wordsByPage, texts, chapterPages } = groupByPage(verses);

    /* Every page the selected chapters cover, from the built words: a single
     * chapter's range is its own words' range (the pages may carry the
     * neighbours' verses too). */
    let pageNumbers;
    if (everything) {
        pageNumbers = [...wordsByPage.keys()].sort((a, b) => a - b);
    } else {
        const range = chapterPages.get(chapter);
        if (!range) throw new Error(`Chapter ${chapter} has no words`);
        pageNumbers = [];
        for (let page = range.first; page <= range.last; page += 1) pageNumbers.push(page);
    }

    console.log(everything
        ? `Whole Quran — ${pageNumbers.length} pages`
        : `Surah ${selected[0].name_simple} (${chapter}) — pages ${pageNumbers[0]}-${pageNumbers[pageNumbers.length - 1]}`);

    const pages = [];
    let done = 0;
    let megabytes = 0;
    await runPool(pageNumbers, 3, async pageNumber => {
        const info = await buildOnePage(pageNumber, wordsByPage.get(pageNumber) || [], texts);
        megabytes += info.fontBytes / 1048576;
        pages.push(info);
        done += 1;
        if (done % 25 === 0 || done === pageNumbers.length) {
            console.log(`  ${done}/${pageNumbers.length} pages, ${megabytes.toFixed(1)} MB of fonts`);
        }
    });
    pages.sort((a, b) => a.page - b.page);

    /* The ornate surah name cartouches used at the top of a surah: a ligature
     * font where the three digits of the chapter number ("018") become one
     * decorated name banner. */
    const surahFontBytes = await download(
        'https://quran.com/fonts/quran/surah-names/v1/sura_names.woff2',
        path.join(FONT_DIR, 'sura_names.woff2')
    );

    const manifest = {
        chapters: selected.map(item => {
            /* The page range comes from the built words, not the API's chapter
             * pages: those follow the older pagination the fonts do not use. */
            const range = chapterPages.get(item.id);
            return {
                id: item.id,
                nameArabic: item.name_arabic,
                nameSimple: item.name_simple,
                versesCount: item.verses_count,
                firstPage: range ? range.first : item.pages[0],
                lastPage: range ? range.last : item.pages[1]
            };
        }),
        pages,
        surahNamesFont: 'fonts/mushaf/sura_names.woff2',
        surahNamesFontBytes: surahFontBytes,
        builtAt: new Date().toISOString()
    };
    const manifestName = everything ? 'index.json' : `ch${chapter}.json`;
    await writeFile(path.join(PAGE_DIR, manifestName), JSON.stringify(manifest, null, 1) + '\n', 'utf8');
    console.log(`Wrote QuranText/MushafPages/${manifestName}`);
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
