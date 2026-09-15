'use strict';

/* ---------------------------------------------------------------------------
 * Mushaf reader — index2.html
 *
 * The whole Quran (604 printed pages) drawn the way the print does it, with the
 * technique quran.com uses:
 *
 *   1. data       QuranText/MushafPages/p<page>.json lists the words of one
 *                 printed page (built by tools/build-mushaf-pages.mjs). A word
 *                 carries `g` (the code points of its glyph in the page font),
 *                 `x` (the real ʿUthmānī word) and its printed line number.
 *   2. glyphs     every word becomes one <span> in the page font p<page>-v2, so
 *                 a word is a single vector shape in its printed form.
 *   3. layout     the words of a printed line are spread over the full page
 *                 width, so the text breaks exactly where the printed page
 *                 breaks; one glyph size is shared by every page, like the print.
 *   4. text       the real words stay next to the glyphs, so selection, screen
 *                 readers and the copy handler all see real Arabic.
 *
 * The pages are stacked in one long column and drawn only while they are near
 * the viewport, so the Quran scrolls like one document on desktop and mobile.
 * ------------------------------------------------------------------------ */
const PAGE_DIR = 'QuranText/MushafPages/';
const MANIFEST_URL = PAGE_DIR + 'index.json';
const WORD_AUDIO_BASE = 'https://verses.quran.com/';   // word-by-word recitation
const RECITERS_URL = 'QuranAudio/reciters.json';       // the ayah audio folders
const THEME_KEY = 'quran-theme';
const RECITER_KEY = 'quran-reciter';

/* Line pitch of the printed page: quran.com lays a 43.72px glyph on a 76.19px
 * line, i.e. 1.743. The page scales with this factor. */
const LINE_RATIO = 1.743;

/* A surah banner takes two of the 15 printed lines. */
const BANNER_LINES = 2;

/* The printed sheet is two thirds as wide as it is tall and holds 15 lines, so
 * the page width fixes the line pitch — and with it the glyph size — exactly as
 * in the print (quran.com: 761.9px wide page, 43.7px glyphs). */
const PAGE_ASPECT = 2 / 3;
const PRINTED_LINES = 15;

/* Pages are drawn when they come this close to the viewport, and dropped again
 * once they are that far away from it. */
const RENDER_MARGIN = '1500px 0px';
const KEEP_MARGIN = '4000px 0px';

/* Parsed pages kept in memory. */
const PAGE_CACHE = 24;

/* A slot is a little taller than its page: rounding in the glyph advances must
 * never push a page over its slot, because the offsets below it are cached. */
const SLOT_MARGIN = 6;

/* A short breath between two files of the recitation. */
const AYAH_GAP_MS = 250;

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = value => String(value).replace(/\d/g, digit => ARABIC_DIGITS[Number(digit)]);

const state = {
    manifest: null,
    chapters: [],
    chapterById: new Map(),  // chapter number -> { versesCount, firstPage, ... }
    reciters: [],            // the recitation folders of QuranAudio/
    reciterId: '',
    pages: [],               // page numbers, ascending
    pageInfo: new Map(),     // page number -> { slots, font, fontBytes }
    slots: [],               // the slot element of every page
    offsets: [],             // slot offsetTops, so finding the current page is cheap
    data: new Map(),         // page number -> parsed JSON (LRU)
    open: new Map(),         // page number -> { slot, card, words }
    loading: new Map(),      // page number -> promise
    fonts: new Map(),        // family -> promise
    size: 0,                 // the glyph size shared by every page
    extraHeight: 0,          // page padding + page number
    current: 1,
    openWord: null
};

const el = {
    appbar: document.getElementById('appbar'),
    mushaf: document.getElementById('mushaf'),
    chip: document.getElementById('page-chip'),
    prev: document.getElementById('prev-page'),
    next: document.getElementById('next-page'),
    surahToggle: document.getElementById('surah-toggle'),
    surahPanel: document.getElementById('surah-panel'),
    surahFilter: document.getElementById('surah-filter'),
    surahList: document.getElementById('surah-list'),
    random: document.getElementById('random-button'),
    theme: document.getElementById('theme-toggle'),
    toolsToggle: document.getElementById('tools-toggle'),
    toolsPanel: document.getElementById('appbar-tools'),
    listenToggle: document.getElementById('listen-toggle'),
    reciterPicker: document.getElementById('reciter-picker'),
    reciterSelect: document.getElementById('reciter-select'),
    readerLink: document.getElementById('reader-link'),
    popover: document.getElementById('popover'),
    toast: document.getElementById('toast')
};

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */
function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

let toastTimer = null;
function showToast(text) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2800);
}

function debounce(fn, wait) {
    let timer = null;
    return function () {
        clearTimeout(timer);
        timer = setTimeout(fn, wait);
    };
}

async function getJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.status + ' ' + url);
    return response.json();
}

/* Loads a font through the FontFace API so it is ready before the lines are
 * measured (measuring with a fallback font would size the page wrongly). The
 * promise is cached, so a page font is only ever fetched once. */
function ensureFont(family, url) {
    if (!state.fonts.has(family)) {
        state.fonts.set(family, (async () => {
            try {
                const face = new FontFace(family, 'url("' + url + '")');
                await face.load();
                document.fonts.add(face);
                return true;
            } catch (error) {
                console.warn('Font failed to load:', family, error);
                return false;
            }
        })());
    }
    return state.fonts.get(family);
}

/* ---------------------------------------------------------------------------
 * Drawing one printed page
 * ------------------------------------------------------------------------ */
function surahBanner(chapter) {
    const banner = element('div', 'banner');
    const head = element('div', 'banner__head');

    const icon = element('span', 'chapter-icon');
    icon.setAttribute('data-chapter-icon', String(chapter).padStart(3, '0'));
    icon.setAttribute('aria-hidden', 'true');
    head.appendChild(icon);
    head.appendChild(surahPlayButton(chapter));
    banner.appendChild(head);

    /* Surah 9 has no basmala; in surah 1 the basmala is verse 1 itself. */
    if (chapter !== 9 && chapter !== 1) {
        banner.appendChild(element('span', 'banner__basmala', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'));
    }
    return banner;
}

/* The button beside the surah name: recites that surah from its first ayah. */
function surahPlayButton(chapter) {
    const button = element('button', 'banner__play');
    button.type = 'button';
    button.dataset.chapter = chapter;
    button.title = 'تلاوة السورة من أولها';
    button.setAttribute('aria-label', button.title);
    button.innerHTML = '<svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
        + '<path d="M8 5v14l11-7z"></path></svg>'
        + '<svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
        + '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"></path></svg>';
    button.addEventListener('click', event => {
        event.stopPropagation();
        playSurah(chapter);
    });
    return button;
}

function wordElement(word, words) {
    const span = element('span', word.t === 'end' ? 'word word--end' : 'word');
    span.dataset.loc = word.k + ':' + word.p;
    span.dataset.type = word.t;
    span.setAttribute('role', 'button');
    span.tabIndex = 0;
    span.setAttribute('aria-label', word.x);
    span.textContent = word.g;
    words.set(span.dataset.loc, word);
    return span;
}

/* Three pages hold lines that do not reach the sheet's width: al-Fātiḥah and
 * the opening of al-Baqarah (1 and 2) and the last page with the short surahs
 * of juzʾ 30 (604). There a line that is not full keeps the words' natural
 * spacing, centred, while a line that does fill the sheet still stretches edge
 * to edge - the way quran.com shows those pages (604 mixes both). */
const CENTERED_PAGES = [1, 2, 604];

/* Beyond this share of the sheet the line counts as full and is left stretched. */
const FULL_LINE_RATIO = 0.8;

/* A line that does not reach the sheet's width keeps its natural spacing and is
 * centred; a full line still stretches (see CENTERED_PAGES). */
function fitCenteredLines(card) {
    const lines = card.querySelector('.page__lines');
    if (!lines) return;
    const width = lines.clientWidth;
    for (const row of lines.querySelectorAll('.line-row')) {
        const words = [...row.querySelectorAll('.word')];
        const total = words.reduce((sum, word) => sum + word.offsetWidth, 0);
        row.classList.toggle('is-centered', total < width * FULL_LINE_RATIO);
    }
}

/* Draws one printed page into a page sheet. */
function buildCard(data, fontOk) {
    const card = element('div', 'page');
    card.dir = 'rtl';
    card.lang = 'ar';
    card.setAttribute('translate', 'no');
    card.style.setProperty('--page-font', fontOk ? '"' + data.font + '"' : '"Uthmanic"');
    if (CENTERED_PAGES.includes(data.page)) card.classList.add('page--center');

    const lines = element('div', 'page__lines');
    const words = new Map();

    for (const line of data.lines) {
        /* A surah opens at the head of a printed line: draw its banner. */
        const first = line.words[0];
        if (first.p === 1 && /:1$/.test(first.k)) {
            lines.appendChild(surahBanner(Number(first.k.split(':')[0])));
        }

        const row = element('div', 'line-row');
        for (const word of line.words) row.appendChild(wordElement(word, words));
        lines.appendChild(row);
    }

    card.appendChild(lines);
    card.appendChild(element('div', 'page__number', toArabicDigits(data.page)));
    card.appendChild(element('div', 'sr-only', data.verses.map(verse => verse.text).join(' ')));
    card._words = words;
    return card;
}

/* ---------------------------------------------------------------------------
 * Slots: one printed page each, drawn only while it is near the viewport
 * ------------------------------------------------------------------------ */
const slotFor = page => document.getElementById('p' + page);

/* Parsed pages, newest kept, oldest dropped once the cache is full. */
async function pageData(pageNumber) {
    const cached = state.data.get(pageNumber);
    if (cached) {
        state.data.delete(pageNumber);
        state.data.set(pageNumber, cached);
        return cached;
    }
    const data = await getJson(PAGE_DIR + 'p' + pageNumber + '.json');
    state.data.set(pageNumber, data);
    while (state.data.size > PAGE_CACHE) state.data.delete(state.data.keys().next().value);
    return data;
}

function openSlot(slot) {
    const page = Number(slot.dataset.page);
    if (state.open.has(page)) return Promise.resolve();
    if (state.loading.has(page)) return state.loading.get(page);

    const work = (async () => {
        try {
            const data = await pageData(page);
            const fontOk = await ensureFont(data.font, data.fontFile);
            if (!fontOk) showToast('تعذّر تحميل خط الصفحة — يُعرض النص بخط عثماني عادي.');
            if (state.open.has(page)) return;   // drawn while it was loading
            const card = buildCard(data, fontOk);
            slot.appendChild(card);
            if (CENTERED_PAGES.includes(page)) fitCenteredLines(card);
            state.open.set(page, { slot, card, words: card._words });
            /* A page drawn while it is being recited shows the highlight too. */
            if (recitation.key) markPlaying(recitation.key);
            syncBannerButtons();
        } catch (error) {
            console.warn(error);
            showToast('تعذّر تحميل الصفحة ' + toArabicDigits(page) + '.');
        } finally {
            state.loading.delete(page);
        }
    })();

    state.loading.set(page, work);
    return work;
}

function closeSlot(slot) {
    const page = Number(slot.dataset.page);
    const record = state.open.get(page);
    if (!record) return;
    /* The slot keeps its height, so every offset below it stays valid. */
    record.card.remove();
    state.open.delete(page);
}

/* Drawing a page costs a font load and a layout pass; a couple at a time is
 * plenty to keep scrolling smooth. */
const queue = [];
let busy = 0;

function pump() {
    while (busy < 2 && queue.length) {
        const task = queue.shift();
        busy += 1;
        task().catch(error => console.warn(error)).finally(() => {
            busy -= 1;
            pump();
        });
    }
}

function enqueue(task) {
    queue.push(task);
    pump();
}

const loader = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (entry.isIntersecting) enqueue(() => openSlot(entry.target));
    }
}, { rootMargin: RENDER_MARGIN });

const trimmer = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (!entry.isIntersecting) closeSlot(entry.target);
    }
}, { rootMargin: KEEP_MARGIN });

/* ---------------------------------------------------------------------------
 * One glyph size for the whole Mushaf, like the print: the biggest size at
 * which the longest line of a page still fits the page width.
 * ------------------------------------------------------------------------ */
function sizeForCard(card, rows) {
    const styles = getComputedStyle(card);
    const padding = parseFloat(styles.paddingInlineStart) + parseFloat(styles.paddingInlineEnd);
    const inner = card.clientWidth - padding;

    /* Measure the natural width of the lines once, at a big reference size:
     * the widths grow with the glyph size, so no search is needed. */
    const REFERENCE = 100;
    card.style.setProperty('--fs', REFERENCE + 'px');
    card.style.setProperty('--lh', (REFERENCE * LINE_RATIO).toFixed(2) + 'px');
    let widest = 0;
    for (const row of rows) widest = Math.max(widest, rowWidth(row));
    card.style.removeProperty('--fs');
    card.style.removeProperty('--lh');

    if (!widest) return 0;
    /* A hair of slack: glyph advances are rounded per size. */
    const byWidth = (inner / widest) * REFERENCE * 0.997;
    /* The sheet of the print is taller than it is wide, so a wide page does not
     * simply make the glyphs bigger. */
    const bySheet = (inner / PAGE_ASPECT) / (PRINTED_LINES * LINE_RATIO);
    return Math.max(8, Math.min(byWidth, bySheet));
}

/* The width a line takes when the page is wide enough; the words never wrap. */
function rowWidth(row) {
    row.style.width = 'max-content';
    const width = row.getBoundingClientRect().width;
    row.style.width = '';
    return width;
}

function applySize(size) {
    state.size = size;
    el.mushaf.style.setProperty('--fs', size.toFixed(2) + 'px');
    el.mushaf.style.setProperty('--lh', (size * LINE_RATIO).toFixed(2) + 'px');
    measureExtra();
    updateSlotHeights();
}

/* Everything a page adds around its printed lines. Measured on a drawn page:
 * the page padding, the border and the page number below the last line. */
function measureExtra() {
    for (const record of state.open.values()) {
        const info = state.pageInfo.get(Number(record.slot.dataset.page));
        if (!info) continue;
        state.extraHeight = record.card.offsetHeight - info.slots * state.size * LINE_RATIO;
        return;
    }
}

/* Every page is as tall as its printed lines; knowing that up front keeps the
 * scrollbar steady while pages are drawn and dropped, and lets the offsets of
 * all 604 pages be cached once. */
function updateSlotHeights() {
    if (!state.size) return;
    const lineHeight = state.size * LINE_RATIO;
    for (const slot of state.slots) {
        const info = state.pageInfo.get(Number(slot.dataset.page));
        slot.style.minHeight = Math.ceil(info.slots * lineHeight + state.extraHeight) + SLOT_MARGIN + 'px';
    }
    state.offsets = state.slots.map(slot => slot.offsetTop);
}

/* Sizes the glyphs from the pages that are drawn right now. A page with a very
 * long line can lower the shared size, so the reader is put back afterwards. */
function refit() {
    let size = Infinity;
    for (const record of state.open.values()) {
        size = Math.min(size, sizeForCard(record.card, [...record.card.querySelectorAll('.line-row')]));
    }
    if (!isFinite(size)) return;
    const changed = !state.size || Math.abs(size - state.size) > 0.05;
    if (!changed) return;
    const anchor = state.current;
    applySize(size);
    /* The shared size has changed, so every drawn line re-measures: a line that
     * no longer fills the sheet keeps its natural spacing from now on (and a
     * line that grew back into the sheet stretches again). */
    for (const record of state.open.values()) {
        if (CENTERED_PAGES.includes(Number(record.slot.dataset.page))) fitCenteredLines(record.card);
    }
    if (state.offsets.length) scrollToPage(anchor, false);
}

/* ---------------------------------------------------------------------------
 * Pages, position and the app bar
 * ------------------------------------------------------------------------ */
const appbarHeight = () => el.appbar.offsetHeight;

function pageFromHash() {
    const match = /^#p(\d+)$/.exec(location.hash);
    return match ? Number(match[1]) : 0;
}

/* #s18 = the page that surah 18 starts on; the view switch links here with it. */
function chapterFromHash() {
    const match = /^#s(\d+)$/.exec(location.hash);
    return match ? Number(match[1]) : 0;
}

/* The surah a printed page belongs to: the last one starting at or before it.
 * That is the surah the reader is handed when switching views. */
function chapterOfPage(page) {
    let chapter = state.chapters[0];
    for (const item of state.chapters) {
        if (item.firstPage > page) break;
        chapter = item;
    }
    return chapter;
}

/* The printed page the reader is looking at: the last one under the app bar. */
function pageAtTop() {
    const line = window.scrollY + appbarHeight() + 12;
    let low = 0;
    let high = state.offsets.length - 1;
    let index = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (state.offsets[mid] <= line) { index = mid; low = mid + 1; } else high = mid - 1;
    }
    return state.pages[index] || state.current;
}

function scrollToPage(page, smooth) {
    const index = state.pages.indexOf(page);
    if (index < 0) return;
    const slot = slotFor(page);
    const top = state.offsets[index] !== undefined ? state.offsets[index] : slot.offsetTop;
    window.scrollTo({
        top: Math.max(0, top - appbarHeight() - 10),
        behavior: smooth ? 'smooth' : 'instant'
    });
}

function setCurrent(page) {
    state.current = page;
    el.chip.textContent = toArabicDigits(page);
    el.prev.disabled = page <= state.pages[0];
    el.next.disabled = page >= state.pages[state.pages.length - 1];
    if (el.readerLink) {
        el.readerLink.href = 'index.html?surah=' + chapterOfPage(page).id;
    }
    if (location.hash !== '#p' + page) history.replaceState(null, '', '#p' + page);
}

function goToPage(page, smooth) {
    if (!state.pageInfo.has(page)) return;
    openSlot(slotFor(page));
    scrollToPage(page, smooth);
    setCurrent(page);
}

/* The observers draw and drop pages while scrolling; a jump over hundreds of
 * pages can leave far-away pages drawn until they catch up, so the neighbours
 * are checked again whenever the current page changes. */
const KEEP_PAGES = 4;

function trimFarPages() {
    for (const [page, record] of [...state.open]) {
        if (Math.abs(page - state.current) > KEEP_PAGES) closeSlot(record.slot);
    }
}

function updateChrome() {
    const page = pageAtTop();
    if (page !== state.current) {
        setCurrent(page);
        trimFarPages();
    }
}

/* ---------------------------------------------------------------------------
 * Copy: hand over the real ʿUthmānī words, never the glyph code points
 * ------------------------------------------------------------------------ */
document.addEventListener('copy', event => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);

    const picked = [];
    for (const node of el.mushaf.querySelectorAll('.word')) {
        if (!range.intersectsNode(node)) continue;
        const card = node.closest('.page');
        const word = card && card._words.get(node.dataset.loc);
        if (word && word.t !== 'end') picked.push(word);   // like quran.com: no verse number
    }
    if (!picked.length) return;

    const text = picked.map(word => word.x).join(' ');
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
    showToast('نُسخ: ' + text);
});

/* ---------------------------------------------------------------------------
 * Word popover (real word, meaning, recitation)
 * ------------------------------------------------------------------------ */
let wordAudio = null;

/* The word files are named after the word's position in the verse: the fifth
 * word of 17:105 is wbw/017_105_005.mp3 (the same rule quran.com's own reader
 * uses). The API's audio_url must not be used: it numbers the ۞ and waqf marks
 * (ۚ ۖ ۗ ۛ) as extra slots, so from the first mark on it points one file too
 * far and the played word drifts forward with every mark that follows. */
function wordAudioPath(word) {
    if (word.t === 'end') return null;
    const [surah, ayah] = String(word.k || '').split(':').map(Number);
    if (surah && ayah && word.p) {
        return 'wbw/' + padNumber(surah) + '_' + padNumber(ayah) + '_' + padNumber(word.p) + '.mp3';
    }
    return word.a || null;        // page data without a position: keep the old path
}

function playWord(word) {
    const file = wordAudioPath(word);
    if (!file) return;
    if (!wordAudio) wordAudio = new Audio();
    wordAudio.src = WORD_AUDIO_BASE + file;
    wordAudio.play().catch(() => showToast('تعذّر تشغيل تلاوة الكلمة.'));
}

function placePopover(node) {
    const rect = node.getBoundingClientRect();
    const box = el.popover.getBoundingClientRect();
    const left = Math.max(8, Math.min(
        rect.left + rect.width / 2 - box.width / 2,
        window.innerWidth - box.width - 8));
    let top = rect.top - box.height - 10;
    if (top < 8) top = rect.bottom + 10;
    el.popover.style.left = left + 'px';
    el.popover.style.top = top + 'px';
}

function openPopover(node) {
    const card = node.closest('.page');
    const word = card && card._words.get(node.dataset.loc);
    if (!word) return;
    if (state.openWord === node) { closePopover(); return; }

    closePopover();
    state.openWord = node;
    node.classList.add('is-open');

    el.popover.textContent = '';
    el.popover.appendChild(element('div', 'popover__word', word.x));
    if (word.tl) el.popover.appendChild(element('div', 'popover__translit', word.tl));
    if (word.tr) el.popover.appendChild(element('div', 'popover__translation', word.tr));

    const foot = element('div', 'popover__foot');
    foot.appendChild(element('span', 'popover__loc',
        toArabicDigits(word.k) + ' — الكلمة ' + toArabicDigits(word.p)));
    if (wordAudioPath(word)) {
        const play = element('button', 'play-btn', 'سماع الكلمة');
        play.type = 'button';
        play.addEventListener('click', () => playWord(word));
        foot.appendChild(play);
    }
    el.popover.appendChild(foot);

    el.popover.hidden = false;
    placePopover(node);
}

function closePopover() {
    el.popover.hidden = true;
    if (state.openWord) {
        state.openWord.classList.remove('is-open');
        state.openWord = null;
    }
}

/* ---------------------------------------------------------------------------
 * Recitation — the ayah audio of the app, the same files index.js plays:
 * QuranAudio/<reciter>/<sura><ayah>.mp3, <sura>000.mp3 being the basmala.
 * ------------------------------------------------------------------------ */
const recitation = {
    audio: null,
    key: null,          // the verse being recited, "18:5"
    basmala: false,     // the file playing is the basmala that opens a surah
    page: 0,            // the printed page the verse is on
    timer: null
};

/* 002255.mp3 = surah 2, ayah 255; 002000.mp3 = the basmala of surah 2. */
function padNumber(value) {
    return String(value).padStart(3, '0');
}

function recitationPath(chapter, verse) {
    return 'QuranAudio/' + encodeURIComponent(state.reciterId) + '/'
        + padNumber(chapter) + padNumber(verse) + '.mp3';
}

/* The verse that follows this one, or null at the end of the Quran. */
function nextVerse(key) {
    const [chapter, verse] = key.split(':').map(Number);
    const info = state.chapterById.get(chapter);
    if (info && verse < info.versesCount) return chapter + ':' + (verse + 1);
    return chapter < 114 ? (chapter + 1) + ':1' : null;
}

/* The page a verse sits on: verses follow each other, so the page is looked for
 * near the one that is being recited, forward first. */
async function pageOfVerse(key, fromPage) {
    const first = state.pages[0];
    const last = state.pages[state.pages.length - 1];
    const start = Math.min(Math.max(fromPage || state.current, first), last);

    let page = start;
    for (let step = 0; step < 4 && page <= last; step += 1) {
        const data = await pageData(page);
        if (data.verses.some(verse => verse.k === key)) return page;
        page += 1;
    }

    page = start;
    for (let step = 0; step < 4 && page > first; step += 1) {
        page -= 1;
        const data = await pageData(page);
        if (data.verses.some(verse => verse.k === key)) return page;
    }
    return state.current;
}

function markPlaying(key) {
    for (const node of el.mushaf.querySelectorAll('.word.is-playing')) node.classList.remove('is-playing');
    if (!key) return;
    for (const node of el.mushaf.querySelectorAll('.word[data-loc^="' + key + ':"]')) {
        node.classList.add('is-playing');
    }
}

/* The word record behind a drawn word. */
function wordOf(node) {
    const card = node.closest('.page');
    return card ? card._words.get(node.dataset.loc) : null;
}

/* The verse the reader is pointing at: the words they selected, or the word
 * whose popover is open. Null when neither is there. */
function verseFromContext() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        for (const node of el.mushaf.querySelectorAll('.word')) {
            if (!range.intersectsNode(node)) continue;
            const word = wordOf(node);
            if (word) return word.k;
        }
    }
    if (state.openWord) {
        const word = wordOf(state.openWord);
        if (word) return word.k;
    }
    return null;
}

function syncListenButton() {
    const playing = Boolean(recitation.key) && recitation.audio && !recitation.audio.paused;
    const label = playing
        ? 'إيقاف التلاوة مؤقتًا'
        : (recitation.key ? 'متابعة التلاوة' : 'بدء التلاوة من الآية المحددة أو من هذه الصفحة');
    el.listenToggle.classList.toggle('is-playing', Boolean(playing));
    el.listenToggle.setAttribute('aria-pressed', String(Boolean(playing)));
    el.listenToggle.setAttribute('aria-label', label);
    el.listenToggle.title = label;
    syncBannerButtons();
}

/* Keeps the play button in every surah banner in step with the recitation. */
function syncBannerButtons() {
    const activeChapter = recitation.key ? Number(recitation.key.split(':')[0]) : 0;
    const playing = Boolean(recitation.key) && recitation.audio && !recitation.audio.paused;

    for (const button of el.mushaf.querySelectorAll('.banner__play')) {
        const isActive = Number(button.dataset.chapter) === activeChapter;
        button.classList.toggle('is-active', isActive);
        button.classList.toggle('is-playing', isActive && Boolean(playing));
        const label = isActive
            ? (playing ? 'إيقاف تلاوة السورة مؤقتًا' : 'متابعة تلاوة السورة')
            : 'تلاوة السورة من أولها';
        button.title = label;
        button.setAttribute('aria-label', label);
    }
}

function recitationAudio() {
    if (!recitation.audio) {
        recitation.audio = new Audio();
        recitation.audio.addEventListener('ended', () => advanceRecitation());
        recitation.audio.addEventListener('error', () => handleRecitationError());
        recitation.audio.addEventListener('play', syncListenButton);
        recitation.audio.addEventListener('pause', syncListenButton);
    }
    return recitation.audio;
}

/* Plays one file: the verse itself, or the basmala that opens its surah. */
function playFile(key, basmala) {
    const [chapter, verse] = key.split(':').map(Number);
    recitation.key = key;
    recitation.basmala = Boolean(basmala);
    const audio = recitationAudio();
    audio.src = recitationPath(chapter, basmala ? 0 : verse);
    audio.play().catch(() => { /* real failures come through the error event */ });
    markPlaying(key);
    syncListenButton();
}

/* Keeps the recitation on screen by following it from page to page. */
async function followVerse(key) {
    const page = await pageOfVerse(key, recitation.page);
    if (page !== recitation.page) {
        recitation.page = page;
        goToPage(page, true);
    }
}

function playVerse(key, withBasmala) {
    followVerse(key);
    playFile(key, Boolean(withBasmala));
}

function advanceRecitation() {
    if (!recitation.key) return;
    /* The basmala is followed by the first verse of its surah. */
    if (recitation.basmala) {
        playVerse(recitation.key, false);
        return;
    }
    const next = nextVerse(recitation.key);
    if (!next) {
        showToast('انتهت التلاوة — بلغت آخر المصحف.');
        stopRecitation();
        return;
    }
    const nextChapter = Number(next.split(':')[0]);
    /* A surah is opened with its basmala; surah 1 is the basmala itself and
       surah 9 has none (the same rule as index.js). */
    const withBasmala = next.endsWith(':1') && nextChapter !== 1 && nextChapter !== 9;
    clearTimeout(recitation.timer);
    recitation.timer = setTimeout(() => playVerse(next, withBasmala), AYAH_GAP_MS);
}

function handleRecitationError() {
    const error = recitation.audio ? recitation.audio.error : null;
    if (!error || error.code === 1 || !recitation.key) return;   // 1 = aborted
    console.warn('Could not load ' + (recitation.audio ? recitation.audio.src : ''), error);

    /* A missing basmala should not stop the recitation. */
    if (recitation.basmala) {
        showToast('ملف البسملة غير متوفّر، تم تخطّيه.');
        playVerse(recitation.key, false);
        return;
    }
    showToast(error.code === 2
        ? 'تعذّر الوصول إلى ملفات التلاوة. تأكّد من تشغيل الخادم.'
        : 'ملف التلاوة غير موجود.');
    stopRecitation();
}

function stopRecitation() {
    clearTimeout(recitation.timer);
    recitation.timer = null;
    if (recitation.audio) recitation.audio.pause();
    recitation.key = null;
    recitation.basmala = false;
    markPlaying(null);
    syncListenButton();
}

async function startRecitation(key) {
    const data = await pageData(state.current);
    const target = key || (data.verses[0] ? data.verses[0].k : null);
    if (!target) return;
    recitation.page = state.current;
    playVerse(target, false);
}

/* Recites a whole surah: its basmala first, like the app does. */
function playSurah(chapter) {
    if (!state.reciterId) {
        showToast('لا توجد ملفات تلاوة — تأكّد من QuranAudio/reciters.json.');
        return;
    }
    const info = state.chapterById.get(chapter);
    if (!info) return;

    /* The surah being recited: its own button pauses or resumes. */
    if (recitation.key && Number(recitation.key.split(':')[0]) === chapter) {
        const audio = recitationAudio();
        if (audio.paused) audio.play().catch(() => { });
        else audio.pause();
        syncListenButton();
        return;
    }

    recitation.page = info.firstPage;
    /* Surah 1 is the basmala itself and surah 9 has none. */
    playVerse(chapter + ':1', chapter !== 1 && chapter !== 9);
}

function toggleRecitation() {
    if (!state.reciterId) {
        showToast('لا توجد ملفات تلاوة — تأكّد من QuranAudio/reciters.json.');
        return;
    }

    /* A selected verse, or an open word, reads as "play from here". */
    const context = verseFromContext();
    if (context && context !== recitation.key) {
        startRecitation(context);
        return;
    }

    if (!recitation.key) {
        startRecitation(null);
        return;
    }

    const audio = recitationAudio();
    if (audio.paused) audio.play().catch(() => { });
    else audio.pause();
    syncListenButton();
}

/* The reciters of QuranAudio/reciters.json; the choice is remembered. */
async function loadReciters() {
    try {
        const data = await getJson(RECITERS_URL);
        state.reciters = Array.isArray(data) ? data : (data ? [data] : []);
    } catch (error) {
        console.warn('Could not read ' + RECITERS_URL, error);
        state.reciters = [];
    }

    if (!state.reciters.length) {
        el.listenToggle.hidden = true;
        el.reciterPicker.hidden = true;
        return;
    }

    el.reciterSelect.textContent = '';
    for (const reciter of state.reciters) {
        const option = element('option', null, reciter.name);
        option.value = reciter.id;
        el.reciterSelect.appendChild(option);
    }

    let stored = null;
    try {
        stored = localStorage.getItem(RECITER_KEY);
    } catch (error) {
        stored = null;
    }
    state.reciterId = state.reciters.some(reciter => reciter.id === stored)
        ? stored
        : state.reciters[0].id;
    el.reciterSelect.value = state.reciterId;
    el.reciterSelect.disabled = false;
    el.listenToggle.hidden = false;
    el.reciterPicker.hidden = false;
}

/* ---------------------------------------------------------------------------
 * Surah picker, theme, events and start-up
 * ------------------------------------------------------------------------ */
function buildSurahList() {
    const fragment = document.createDocumentFragment();

    /* The random surah button lives in the bar on wide screens, and here on
     * phones, where the bar has no room for it. */
    const random = element('button', 'surah-item');
    random.type = 'button';
    random.dataset.random = '1';
    random.appendChild(element('span', 'surah-item__num', '⚄'));
    random.appendChild(element('span', 'surah-item__name', 'سورة عشوائية'));
    fragment.appendChild(random);

    for (const chapter of state.chapters) {
        const item = element('button', 'surah-item');
        item.type = 'button';
        item.dataset.page = chapter.firstPage;
        item.dataset.search = (chapter.nameArabic + ' ' + chapter.nameSimple + ' ' + chapter.id).toLowerCase();
        item.appendChild(element('span', 'surah-item__num', toArabicDigits(chapter.id)));
        item.appendChild(element('span', 'surah-item__name', chapter.nameArabic));
        item.appendChild(element('span', 'surah-item__page', 'صفحة ' + toArabicDigits(chapter.firstPage)));
        fragment.appendChild(item);
    }
    el.surahList.appendChild(fragment);
}

/* One slot for every printed page; they hold the height of their page even
 * while the page itself is not drawn. */
function buildSlots() {
    const fragment = document.createDocumentFragment();
    for (const info of state.manifest.pages) {
        const slot = element('section', 'page-slot');
        slot.id = 'p' + info.page;
        slot.dataset.page = info.page;
        fragment.appendChild(slot);
    }
    el.mushaf.appendChild(fragment);
    state.slots = [...el.mushaf.querySelectorAll('.page-slot')];
}

function filterSurahs() {
    const query = el.surahFilter.value.trim().toLowerCase();
    for (const item of el.surahList.children) {
        if (item.dataset.random) {
            item.hidden = Boolean(query);   // hidden while searching
            continue;
        }
        item.hidden = Boolean(query) && !item.dataset.search.includes(query);
    }
}

function randomChapter() {
    return state.chapters[Math.floor(Math.random() * state.chapters.length)];
}

function setPanel(open) {
    if (open) setMenu(false);
    el.surahPanel.hidden = !open;
    el.surahToggle.setAttribute('aria-expanded', String(open));
    if (open) {
        el.surahFilter.focus();
    } else if (el.surahFilter.value) {
        el.surahFilter.value = '';
        filterSurahs();
    }
}

/* The tools menu: a dropdown on small screens, and the plain row of tools on
 * wide ones, where the button is hidden and this only keeps the state. */
function setMenu(open) {
    el.appbar.classList.toggle('is-menu-open', open);
    el.toolsToggle.setAttribute('aria-expanded', String(open));
    if (open) setPanel(false);
    resetBarTimer();
}

/* ---------------------------------------------------------------------------
 * The bar slides away while nothing is going on, and returns on the next
 * scroll, touch or hover.
 * ------------------------------------------------------------------------ */
const BAR_IDLE_MS = 2600;
let barTimer = null;

/* Kept on screen while the reader is using it. */
function barBusy() {
    return !el.surahPanel.hidden
        || el.appbar.classList.contains('is-menu-open')
        || el.appbar.matches(':hover')
        || el.appbar.contains(document.activeElement);
}

function hideBar() {
    if (barBusy()) {
        resetBarTimer();
        return;
    }
    el.appbar.classList.add('is-hidden');
}

function showBar() {
    el.appbar.classList.remove('is-hidden');
    resetBarTimer();
}

function resetBarTimer() {
    clearTimeout(barTimer);
    barTimer = setTimeout(hideBar, BAR_IDLE_MS);
}

function setTheme(theme) {
    const light = theme === 'light';
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
    try {
        localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
    } catch (error) {
        /* private mode: the choice just will not be remembered */
    }
    /* The browser chrome follows the page background. */
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f7f5ef' : '#0a0f10');
    el.theme.title = light ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري';
    el.theme.setAttribute('aria-label', el.theme.title);
}

function wireEvents() {
    el.prev.addEventListener('click', () => goToPage(state.current - 1, true));
    el.next.addEventListener('click', () => goToPage(state.current + 1, true));

    el.random.addEventListener('click', () => {
        goToPage(randomChapter().firstPage, false);
    });

    el.listenToggle.addEventListener('click', toggleRecitation);
    el.reciterSelect.addEventListener('change', () => {
        state.reciterId = el.reciterSelect.value;
        try {
            localStorage.setItem(RECITER_KEY, state.reciterId);
        } catch (error) {
            /* private mode: the choice just will not be remembered */
        }
        stopRecitation();
    });

    el.theme.addEventListener('click', () => {
        setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });

    el.surahToggle.addEventListener('click', () => setPanel(el.surahPanel.hidden));
    el.surahFilter.addEventListener('input', filterSurahs);
    el.surahList.addEventListener('click', event => {
        const item = event.target.closest('.surah-item');
        if (!item) return;
        setPanel(false);
        if (item.dataset.random) {
            goToPage(randomChapter().firstPage, false);
            return;
        }
        goToPage(Number(item.dataset.page), false);
    });

    /* Word popover, wherever the pointer lands on a drawn page. */
    el.mushaf.addEventListener('click', event => {
        const node = event.target.closest('.word');
        if (node) openPopover(node); else closePopover();
    });

    el.mushaf.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const node = event.target.closest('.word');
        if (!node) return;
        event.preventDefault();
        openPopover(node);
    });

    document.addEventListener('click', event => {
        if (!el.surahPanel.hidden && !event.target.closest('#surah-picker')) setPanel(false);
        if (el.appbar.classList.contains('is-menu-open')
            && !event.target.closest('#appbar-tools')
            && !event.target.closest('#tools-toggle')) {
            setMenu(false);
        }
        if (el.popover.contains(event.target) || event.target.closest('.word')) return;
        closePopover();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            setPanel(false);
            setMenu(false);
            closePopover();
            return;
        }
        /* In a Mushaf the next page is the one on the left. */
        if (event.key === 'ArrowLeft') goToPage(state.current + 1, true);
        if (event.key === 'ArrowRight') goToPage(state.current - 1, true);
    });

    /* The app bar follows the scroll, so it always shows the page under it, and
     * it comes back as soon as the reader scrolls. */
    let scrollPending = false;
    window.addEventListener('scroll', () => {
        showBar();
        if (scrollPending) return;
        scrollPending = true;
        requestAnimationFrame(() => {
            scrollPending = false;
            updateChrome();
        });
    }, { passive: true });

    /* Touching, pointing at or tabbing into the bar keeps it on screen. */
    el.appbar.addEventListener('pointerenter', showBar);
    el.appbar.addEventListener('pointerdown', showBar);
    el.appbar.addEventListener('focusin', showBar);
    el.appbar.addEventListener('pointerleave', resetBarTimer);
    window.addEventListener('mousemove', event => {
        if (event.clientY <= appbarHeight() + 24) showBar();
    }, { passive: true });

    el.toolsToggle.addEventListener('click', () => {
        setMenu(!el.appbar.classList.contains('is-menu-open'));
    });

    resetBarTimer();

    window.addEventListener('resize', debounce(() => {
        document.documentElement.style.setProperty('--appbar-h', appbarHeight() + 'px');
        refit();
    }, 150));

    /* The glyph size follows the container width, and that width can change
     * without a window resize (rotation, a folded pane, an emulated viewport),
     * so the container itself is watched as well. */
    if ('ResizeObserver' in window) {
        let lastWidth = el.mushaf.clientWidth;
        const refitOnWidth = debounce(() => refit(), 120);
        new ResizeObserver(() => {
            const width = el.mushaf.clientWidth;
            if (Math.abs(width - lastWidth) < 1) return;
            lastWidth = width;
            document.documentElement.style.setProperty('--appbar-h', appbarHeight() + 'px');
            refitOnWidth();
        }).observe(el.mushaf);
    }

    window.addEventListener('hashchange', () => {
        const page = pageFromHash();
        const chapter = state.chapterById.get(chapterFromHash());
        if (page) goToPage(page, false);
        else if (chapter) goToPage(chapter.firstPage, false);
    });
}

async function init() {
    /* The reader's place comes from the hash, not from the browser's own scroll
     * restoration, which would fight the jump below. */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    try {
        state.manifest = await getJson(MANIFEST_URL);
    } catch (error) {
        console.warn(error);
        showToast('بيانات المصحف غير موجودة — شغّل: node tools/build-mushaf-pages.mjs all');
        return;
    }

    state.chapters = state.manifest.chapters;
    state.chapterById = new Map(state.chapters.map(chapter => [chapter.id, chapter]));
    state.pages = state.manifest.pages.map(info => info.page);
    state.pageInfo = new Map(state.manifest.pages.map(info => [info.page, info]));

    buildSlots();
    buildSurahList();
    wireEvents();

    document.documentElement.style.setProperty('--appbar-h', appbarHeight() + 'px');
    setTheme(document.documentElement.getAttribute('data-theme'));

    /* The ornate surah name cartouches; the banners stay hidden until ready. */
    ensureFont('surahnames', state.manifest.surahNamesFont).then(ok => {
        if (ok) document.documentElement.setAttribute('data-surah-names-ready', 'true');
    });
    ensureFont('Uthmanic', 'fonts/uthmanic_hafs_v22.ttf');

    /* The reciter list only fills the toolbar; the reader does not wait for it. */
    loadReciters();

    /* #p293 opens a printed page and #s18 the page where surah 18 begins; the
     * page drawn first fixes the glyph size, and the size every page height. */
    const wantedPage = pageFromHash();
    const wantedChapter = state.chapterById.get(chapterFromHash());
    const start = state.pageInfo.has(wantedPage)
        ? wantedPage
        : (wantedChapter ? wantedChapter.firstPage : state.pages[0]);
    await openSlot(slotFor(start));
    refit();
    scrollToPage(start, false);
    setCurrent(start);

    for (const slot of state.slots) {
        loader.observe(slot);
        trimmer.observe(slot);
    }
}

init();
