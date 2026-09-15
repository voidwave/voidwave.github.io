
/* ---------------------------------------------------------------------------
 * Quran text sources
 *   QuranText/Quran/quran-uthmani.xml      - the Uthmani text used for reading
 *   QuranText/Quran/quran-simple-clean.xml - diacritic free text used by search
 *   QuranText/catalog.json                 - index of the tafsir/translation
 *                                            files that are available (built
 *                                            by tools/download-tanzil-translations.ps1)
 *   QuranAudio/reciters.json               - list of reciter folders with ayah
 *                                            audio (built by tools/build-reciter-list.ps1)
 * The tafsir and translation files are fetched the first time they are picked,
 * so the page does not download dozens of megabytes on start-up.
 * ------------------------------------------------------------------------ */
const SOURCE_UTHMANI = 'QuranText/Quran/quran-uthmani.xml';
const SOURCE_CLEAN = 'QuranText/Quran/quran-simple-clean.xml';
const SOURCE_CATALOG = 'QuranText/catalog.json';
const SOURCE_RECITERS = 'QuranAudio/reciters.json';

/* Search results are rendered in pages so common words stay responsive.
 * A page is drawn in small chunks: the first chunk appears immediately, the
 * rest is added while the browser is idle. */
const RESULTS_PER_PAGE = 120;
const RESULTS_CHUNK = 24;

/* Tafsir and translation are clamped to a few lines in result cards, so long
 * excerpts are cut short before they reach the DOM. */
const RESULTS_EXCERPT_LENGTH = 300;

/* Arabic-Indic digits, used for surah and ayah numbers. */
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/* Used when QuranText/catalog.json cannot be read, so the app still works. */
const FALLBACK_CATALOG = {
    tafsirs: [{
        id: 'ar.jalalayn',
        code: 'ar',
        lang: 'Arabic',
        rtl: true,
        flag: 'sa',
        name: 'تفسير الجلالين',
        translator: 'Jalal ad-Din al-Mahalli and Jalal ad-Din as-Suyuti',
        path: 'QuranText/Arabic-Tafsir/ar.jalalayn.xml'
    }],
    translations: [{
        id: 'en.sahih',
        code: 'en',
        lang: 'English',
        rtl: false,
        flag: 'gb',
        name: 'Saheeh International',
        translator: 'Saheeh International',
        path: 'QuranText/English-Translation/en.sahih.xml'
    }]
};

/* Parsed files that are not ticked are dropped again once the cache grows
 * past this size; ticked files are always kept, so a reader can enable as
 * many tafsirs and translations as they like. */
const SOURCE_CACHE_LIMIT = 4;

/* The files shown under every ayah. The reader ticks them in the picker and
 * the choice is stored in localStorage. */
const SOURCES_STORAGE_KEY = 'quran-sources';
const LEGACY_STORAGE_KEYS = ['quran-tafsir', 'quran-translation'];
const DEFAULT_SOURCES = ['ar.jalalayn', 'en.sahih'];
const RECITER_STORAGE_KEY = 'quran-reciter';
const CONTINUOUS_STORAGE_KEY = 'quran-continuous';

/* A short breath between two ayah files. */
const AYAH_GAP_MS = 250;

var surasTashkeel;
var surasClean;
var SurahText;
var catalog = FALLBACK_CATALOG;

var enabledSources = [];   // ids in the order the reader ticked them
var sourceCache = {};      // source id -> parsed <sura> elements
var sourceCacheOrder = []; // the ids above in the order they were added
var pickerElements = { toggle: null, panel: null, count: null, list: null };
var pickerIsOpen = false;
var reciters = [];         // [{ id, name }] of the audio folders
var selectedReciterId = null;
var audioPlayer = null;    // one shared player for the whole page
var preloader = null;      // warms up the file that plays next
var playback = { surah: null, ayah: null }; // what the player is on now
var continuousPlay = false;
var highlightedTrack = null; // 'surah:ayah' of the ayah that is marked now
var nextTrackTimer = null;  // pending start of the next file

let selectedSurah = null; // Variable to track selected Surah
let currentMatches = [];  // Matches of the last search query
let renderedMatches = 0;  // Number of matches that are already on screen
let resultsTarget = 0;    // Number of matches the loaded pages contain
let renderHandle = null;  // Pending idle render of the next chunk
let searchTimer = null;   // Debounce timer for the search field
let toastTimer = null;    // Hides the status message again

Promise.all([
    loadXml(SOURCE_UTHMANI).then(function (data) { surasTashkeel = data; }),
    loadXml(SOURCE_CLEAN).then(function (data) { surasClean = data; }),
    loadCatalog(),
    loadReciters()
]).then(function () {
    setupSourcePicker();
    restoreSources();
    return loadEnabledSources();
}).then(function () {
    console.log('Quran text loaded. Sources: ' + (enabledSources.join(', ') || 'none')
        + ', reciters: ' + reciters.length);
    setupReciterPicker();
    initializePage();
    setupSearchBar(); // Call the function that initializes the page
    openSurahFromUrl(); // ?surah=18, used by the Mushaf view
}).catch(error => {
    console.error("Error loading XML files:", error);
    var target = document.getElementById('maincontent');
    if (target) {
        target.innerHTML = '<p class="empty">تعذّر تحميل النص القرآني. تأكّد من الاتصال بالإنترنت ثم أعد تحميل الصفحة.</p>';
    }
});


function loadXml(path) {
    return fetch(path)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Could not fetch ' + path + ' (HTTP ' + response.status + ')');
            }
            return response.text();
        })
        .then(function (xml) {
            const parser = new DOMParser();
            const xmlDOM = parser.parseFromString(xml, 'application/xml');
            if (xmlDOM.querySelector('parsererror')) {
                throw new Error('Invalid XML in ' + path);
            }
            return xmlDOM.querySelectorAll('sura'); // Return the parsed sura elements
        });
}

/* Reads the index of the tafsir and translation files that are on the server. */
function loadCatalog() {
    return fetch(SOURCE_CATALOG)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            catalog = {
                tafsirs: Array.isArray(data.tafsirs) ? data.tafsirs : [],
                translations: Array.isArray(data.translations) ? data.translations : []
            };
        })
        .catch(function (error) {
            console.warn('Could not read ' + SOURCE_CATALOG + ', using the built-in list.', error);
            catalog = FALLBACK_CATALOG;
        });
}

/* Reads the list of reciter folders that hold the ayah audio files. */
function loadReciters() {
    return fetch(SOURCE_RECITERS)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            reciters = Array.isArray(data) ? data : (data ? [data] : []);
        })
        .catch(function (error) {
            console.warn('Could not read ' + SOURCE_RECITERS + ', recitation is off.', error);
            reciters = [];
        });
}

/* ---------------------------------------------------------------------------
 * Source picker (check boxes with flags)
 * ------------------------------------------------------------------------ */

function setupSourcePicker() {
    pickerElements.toggle = document.getElementById('sources-toggle');
    pickerElements.panel = document.getElementById('sources-panel');
    pickerElements.count = document.getElementById('sources-count');
    pickerElements.list = document.getElementById('sources-list');

    pickerElements.list.innerHTML =
        sourceGroupHTML('التفاسير', catalog.tafsirs)
        + sourceGroupHTML('الترجمات', catalog.translations);

    pickerElements.toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        setPickerOpen(!pickerIsOpen);
    });
    pickerElements.list.addEventListener('change', function (event) {
        const checkbox = event.target.closest('input[data-source]');
        if (checkbox) {
            setSourceEnabled(checkbox.dataset.source, checkbox.checked, checkbox);
        }
    });
    pickerElements.list.addEventListener('click', function (event) {
        event.stopPropagation(); // Clicks inside the panel keep it open
    });
    document.addEventListener('click', function () {
        setPickerOpen(false);
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setPickerOpen(false);
        }
    });
    window.addEventListener('resize', function () {
        if (pickerIsOpen) {
            positionPickerPanel();
        }
    });
}

/* One checkbox per catalog entry: flag, name and translator. */
function sourceGroupHTML(title, entries) {
    if (entries.length === 0) {
        return '';
    }

    const rows = entries.map(function (entry) {
        return '<label class="source-option" title="' + htmlEscape(entry.translator) + '">'
            + '<input type="checkbox" data-source="' + htmlEscape(entry.id) + '">'
            + flagHTML(entry)
            + '<span class="source-option__text">'
            + '<span class="source-option__name">' + htmlEscape(entry.name) + '</span>'
            + '<span class="source-option__meta">' + htmlEscape(entry.translator) + '</span>'
            + '</span>'
            + '</label>';
    }).join('');

    return '<p class="picker__group">' + title + '</p>' + rows;
}

/* Country flag of the language a file belongs to. */
function flagHTML(entry) {
    if (!entry.flag) {
        return '';
    }
    return '<img class="flag" src="flags/' + htmlEscape(entry.flag) + '.png" alt=""'
        + ' width="22" height="15" loading="lazy">';
}

function setPickerOpen(open) {
    pickerIsOpen = open;
    pickerElements.panel.hidden = !open;
    pickerElements.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
        positionPickerPanel();
    }
}

/* Keeps the panel below its button and inside the viewport, also on phones. */
function positionPickerPanel() {
    const panel = pickerElements.panel;
    const picker = panel.parentElement;
    const button = pickerElements.toggle.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);

    let viewportLeft = button.left + button.width / 2 - width / 2;
    viewportLeft = Math.max(12, Math.min(viewportLeft, window.innerWidth - width - 12));

    panel.style.width = width + 'px';
    panel.style.left = Math.round(viewportLeft - picker.getBoundingClientRect().left) + 'px';
}

function checkboxFor(id) {
    return pickerElements.list.querySelector('input[data-source="' + id + '"]');
}

/* Ticks the boxes of the files the reader picked earlier. */
function restoreSources() {
    let stored = null;
    try {
        stored = JSON.parse(localStorage.getItem(SOURCES_STORAGE_KEY));
    } catch (error) {
        stored = null;
    }

    if (!Array.isArray(stored)) {
        stored = legacySources();
    }

    enabledSources = stored.filter(function (id) {
        return findCatalogEntry(id) !== null;
    });

    enabledSources.forEach(function (id) {
        const checkbox = checkboxFor(id);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

/* The two single selects this picker replaced, kept for a smooth upgrade. */
function legacySources() {
    const chosen = [];
    let hadChoice = false;

    LEGACY_STORAGE_KEYS.forEach(function (key) {
        let value = null;
        try {
            value = localStorage.getItem(key);
        } catch (error) {
            value = null;
        }
        if (value !== null) {
            hadChoice = true;
            if (value) {
                chosen.push(value);
            }
        }
    });

    return hadChoice ? chosen : DEFAULT_SOURCES.slice();
}

function saveSources() {
    try {
        localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(enabledSources));
        LEGACY_STORAGE_KEYS.forEach(function (key) {
            localStorage.removeItem(key);
        });
    } catch (error) {
        // Ignore storage errors (private mode, storage disabled, ...)
    }
}

/* Fetches the files of the sources that are ticked on start-up. */
function loadEnabledSources() {
    return Promise.all(enabledSources.map(function (id) {
        return ensureSourceData(id).catch(function (error) {
            console.warn('Could not load ' + id + '.', error);
            enabledSources = enabledSources.filter(function (other) {
                return other !== id;
            });
            const checkbox = checkboxFor(id);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
    })).then(function () {
        saveSources();
        updatePickerSummary();
    });
}

/* Ticking a box loads the file, unticking removes its blocks again. */
function setSourceEnabled(id, enabled, checkbox) {
    if (enabled) {
        if (enabledSources.indexOf(id) === -1) {
            enabledSources.push(id);
        }

        const option = checkbox.closest('.source-option');
        checkbox.disabled = true;
        option.classList.add('is-loading');

        ensureSourceData(id)
            .catch(function (error) {
                console.error('Could not load ' + id, error);
                enabledSources = enabledSources.filter(function (other) {
                    return other !== id;
                });
                checkbox.checked = false;
                showToast('تعذّر تحميل الملف المطلوب.');
            })
            .then(function () {
                checkbox.disabled = false;
                option.classList.remove('is-loading');
                saveSources();
                updatePickerSummary();
                afterSourceChange();
            });
        return;
    }

    enabledSources = enabledSources.filter(function (other) {
        return other !== id;
    });
    saveSources();
    updatePickerSummary();
    afterSourceChange();
}

function updatePickerSummary() {
    const count = enabledSources.length;
    pickerElements.count.textContent = count ? toArabicDigits(count) : '';
    pickerElements.count.hidden = count === 0;
    pickerElements.toggle.classList.toggle('is-active', count > 0);
    pickerElements.toggle.setAttribute('aria-label', count
        ? 'المصادر المعروضة: ' + count
        : 'اختر المصادر المعروضة');
}

function findCatalogEntry(id) {
    return catalog.tafsirs.concat(catalog.translations).find(function (entry) {
        return entry.id === id;
    }) || null;
}

/* Fetches and parses a tafsir/translation file the first time it is used. */
function ensureSourceData(id) {
    if (sourceCache[id]) {
        return Promise.resolve(sourceCache[id]);
    }

    const entry = findCatalogEntry(id);
    if (!entry) {
        return Promise.reject(new Error('Unknown source: ' + id));
    }

    return loadXml(entry.path).then(function (data) {
        sourceCache[id] = data;
        sourceCacheOrder.push(id);
        trimSourceCache();
        return data;
    });
}

/* Drops the oldest files that are not ticked; everything that is on screen
 * stays in memory, however many sources are selected. */
function trimSourceCache() {
    const keep = Math.max(SOURCE_CACHE_LIMIT, enabledSources.length);
    let index = 0;

    while (sourceCacheOrder.length > keep && index < sourceCacheOrder.length) {
        const cachedId = sourceCacheOrder[index];
        if (enabledSources.indexOf(cachedId) === -1) {
            delete sourceCache[cachedId];
            sourceCacheOrder.splice(index, 1);
        } else {
            index += 1;
        }
    }
}

/* ---------------------------------------------------------------------------
 * Recitation: one shared player and a play button on every ayah
 * ------------------------------------------------------------------------ */

function setupReciterPicker() {
    const picker = document.getElementById('reciter-picker');
    const select = document.getElementById('reciter-select');
    if (!picker || !select) {
        return;
    }

    if (reciters.length === 0) {
        picker.hidden = true;
        return;
    }

    select.innerHTML = reciters.map(function (reciter) {
        return '<option value="' + htmlEscape(reciter.id) + '">' + htmlEscape(reciter.name) + '</option>';
    }).join('');

    let stored = null;
    try {
        stored = localStorage.getItem(RECITER_STORAGE_KEY);
    } catch (error) {
        stored = null;
    }

    selectedReciterId = reciters.some(function (reciter) {
        return reciter.id === stored;
    }) ? stored : reciters[0].id;
    select.value = selectedReciterId;

    select.addEventListener('change', function () {
        selectedReciterId = select.value;
        try {
            localStorage.setItem(RECITER_STORAGE_KEY, selectedReciterId);
        } catch (error) {
            // Ignore storage errors (private mode, storage disabled, ...)
        }
        stopPlayback();
    });
}

/* The continuous play switch in the toolbar. */
function setupRepeatToggle() {
    const button = document.getElementById('repeat-toggle');
    if (!button) {
        return;
    }
    if (reciters.length === 0) {
        button.hidden = true;
        return;
    }

    try {
        continuousPlay = localStorage.getItem(CONTINUOUS_STORAGE_KEY) === '1';
    } catch (error) {
        continuousPlay = false;
    }
    syncRepeatToggle(button);

    button.addEventListener('click', function () {
        continuousPlay = !continuousPlay;
        syncRepeatToggle(button);
        try {
            localStorage.setItem(CONTINUOUS_STORAGE_KEY, continuousPlay ? '1' : '0');
        } catch (error) {
            // Ignore storage errors (private mode, storage disabled, ...)
        }
    });
}

function syncRepeatToggle(button) {
    button.classList.toggle('is-active', continuousPlay);
    button.setAttribute('aria-pressed', continuousPlay ? 'true' : 'false');
}

/* Play button handler: plays exactly the file behind the button. */
function playAyah(surahIndex, fileNumber) {
    if (!selectedReciterId) {
        return;
    }

    cancelScheduledTrack();
    startTrack(surahIndex, fileNumber);
}

/* Plays or pauses one file; file 0 is the basmala that opens a surah. */
function startTrack(surahIndex, fileNumber) {
    if (audioPlayer && playback.surah === surahIndex && playback.ayah === fileNumber) {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
        updatePlaybackUI();
        return;
    }

    if (!audioPlayer) {
        audioPlayer = new Audio();
        audioPlayer.addEventListener('play', updatePlaybackUI);
        audioPlayer.addEventListener('pause', updatePlaybackUI);
        audioPlayer.addEventListener('ended', function () {
            const next = continuousPlay ? nextTrack(playback.surah, playback.ayah) : null;
            if (next) {
                scheduleTrack(next);
            } else {
                playback.surah = null;
                playback.ayah = null;
                updatePlaybackUI();
            }
        });
        audioPlayer.addEventListener('error', function () {
            const error = audioPlayer.error;
            if (!error || error.code === 1) {
                return; // 1 = aborted, which usually means another ayah was picked
            }

            const failed = { surah: playback.surah, ayah: playback.ayah };
            const isCurrent = playback.surah === failed.surah && playback.ayah === failed.ayah;
            console.error('Could not load ' + audioPlayer.src, error);

            // A missing basmala file should not stop the recitation.
            if (isCurrent && failed.ayah === 0 && failed.surah !== null) {
                playback.surah = null;
                playback.ayah = null;
                updatePlaybackUI();
                showToast('ملف البسملة غير متوفّر، تم تخطّيه.');
                startTrack(failed.surah, 1);
                return;
            }

            if (isCurrent) {
                playback.surah = null;
                playback.ayah = null;
                updatePlaybackUI();
            }
            showToast(error.code === 2
                ? 'تعذّر الوصول إلى ملفات التلاوة. تأكّد من تشغيل الخادم.'
                : 'ملف التلاوة غير موجود.');
        });
    }

    playback.surah = surahIndex;
    playback.ayah = fileNumber;
    audioPlayer.src = recitationPath(surahIndex, fileNumber);
    audioPlayer.play().catch(function () {
        // Real failures are reported by the error listener above.
    });
    updatePlaybackUI();
    preloadNextTrack();
}

/* Where the recitation goes after this file: the next ayah, then the next surah. */
function nextTrack(surahIndex, fileNumber) {
    if (surahIndex === null || fileNumber === null) {
        return null;
    }
    if (fileNumber < surasTashkeel[surahIndex].children.length) {
        return { surah: surahIndex, ayah: fileNumber + 1 };
    }
    if (surahIndex < 113) {
        const nextSurah = surahIndex + 1;
        // A surah is opened with its basmala (file 0); surah 9 has none.
        return { surah: nextSurah, ayah: nextSurah === 8 ? 1 : 0 };
    }
    return null; // End of the Quran
}

/* Continuous play: follow the recitation into the next ayah or surah. */
function playNextTrack(next) {
    if (next.surah !== playback.surah) {
        selectSurah(next.surah);
        closeSurahNav();
        renderSurah(next.surah);
    }
    startTrack(next.surah, next.ayah);
}

/* A very short pause between two files of the recitation. */
function scheduleTrack(next) {
    cancelScheduledTrack();
    nextTrackTimer = setTimeout(function () {
        nextTrackTimer = null;
        playNextTrack(next);
    }, AYAH_GAP_MS);
}

function cancelScheduledTrack() {
    if (nextTrackTimer !== null) {
        clearTimeout(nextTrackTimer);
        nextTrackTimer = null;
    }
}

/* Warms up the next file, so a continuous recitation barely pauses. */
function preloadNextTrack() {
    const next = nextTrack(playback.surah, playback.ayah);
    if (!next) {
        return;
    }
    if (!preloader) {
        preloader = new Audio();
        preloader.preload = 'auto';
    }
    const path = recitationPath(next.surah, next.ayah);
    if (!preloader.src || preloader.src.indexOf(path) === -1) {
        preloader.src = path;
    }
}

function stopPlayback() {
    cancelScheduledTrack();
    if (audioPlayer) {
        audioPlayer.pause();
    }
    playback.surah = null;
    playback.ayah = null;
    updatePlaybackUI();
}

/* 002255.mp3 = sura 2, ayah 255; 002000.mp3 = the basmala of sura 2. */
function recitationPath(surahIndex, fileNumber) {
    return 'QuranAudio/' + encodeURIComponent(selectedReciterId) + '/'
        + padNumber(surahIndex + 1) + padNumber(fileNumber) + '.mp3';
}

function padNumber(value) {
    let text = String(value);
    while (text.length < 3) {
        text = '0' + text;
    }
    return text;
}

/* Keeps every play button and the highlighted file in sync with the player. */
function updatePlaybackUI() {
    const isPlaying = !!audioPlayer && !audioPlayer.paused && playback.surah !== null;
    const isActive = isPlaying || nextTrackTimer !== null; // stays lit in the gap

    document.querySelectorAll('.play-btn').forEach(function (button) {
        const matches = isActive
            && Number(button.dataset.surah) === playback.surah
            && Number(button.dataset.ayah) === playback.ayah;
        button.classList.toggle('is-playing', matches);
        button.setAttribute('aria-label', matches ? 'إيقاف التلاوة مؤقتًا' : 'تشغيل التلاوة');
    });

    syncPlayingCard(isActive);
}

/* Marks the file that is being recited and keeps it on screen. */
function syncPlayingCard(isActive) {
    const track = isActive ? playback.surah + ':' + playback.ayah : null;
    if (track === highlightedTrack) {
        return;
    }
    highlightedTrack = track;

    document.querySelectorAll('#maincontent .ayah.is-playing, #maincontent .basmala-row.is-playing')
        .forEach(function (element) {
            element.classList.remove('is-playing');
        });

    if (!track) {
        return;
    }

    if (playback.ayah === 0) {
        const basmalaRow = document.querySelector('#maincontent .basmala-row');
        if (basmalaRow) {
            basmalaRow.classList.add('is-playing');
            basmalaRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    const card = document.getElementById('ayah-' + playback.surah + '-' + (playback.ayah - 1));
    if (card) {
        card.classList.add('is-playing');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/* Re-draws everything that shows a tafsir or a translation. */
function afterSourceChange() {
    if (selectedSurah !== null) {
        renderSurah(selectedSurah);
    }
    refreshSearchResults();
}

function htmlEscape(text) {
    return String(text === null || text === undefined ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* Small message at the bottom of the screen. */
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.remove('is-visible');
    }, 4000);
}

/* The tool menu lives in the app bar on wide screens and behind the menu
 * button on small ones; the class on the bar decides which one is shown. */
function toolsMenuIsOpen() {
    const appbar = document.getElementById('button-container');
    return Boolean(appbar && appbar.classList.contains('is-menu-open'));
}

function setToolsMenu(open) {
    const appbar = document.getElementById('button-container');
    const toggle = document.getElementById('tools-toggle');
    if (!appbar || !toggle) {
        return;
    }

    appbar.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeToolsMenu() {
    if (toolsMenuIsOpen()) {
        setToolsMenu(false);
    }
}

function initializePage() {
    SurahText = document.getElementById('maincontent');
    var randomButton = document.getElementById("random-button");
    var randomSurahButton = document.getElementById("randomSurah-button");
    var clearButton = document.getElementById('clear-button');
    var list = document.getElementById("nav");
    var navBackdrop = document.getElementById("nav-backdrop");
    var closeNavButton = document.getElementById("nav-close");
    var surahFilter = document.getElementById("surah-filter");
    var themeButton = document.getElementById("theme-toggle");
    var toTop = document.getElementById('to-top');
    var showNav = document.getElementById('show-nav');
    var toolsToggle = document.getElementById('tools-toggle');

    // The text is available now, so the toolbar can be used.
    document.querySelectorAll('.appbar [disabled]').forEach(function (element) {
        element.disabled = false;
    });
    SurahText.innerHTML = emptyStateHTML();
    applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    setupRepeatToggle();

    themeButton.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        try {
            localStorage.setItem('quran-theme', next);
        } catch (error) {
            // Ignore storage errors (private mode, storage disabled, ...)
        }
    });

    // One button per surah, with its number and name.
    for (var i = 0; i < 114; i++) {
        var surahItem = document.createElement("button");
        surahItem.type = "button";
        surahItem.className = "surah";
        surahItem.innerHTML = '<span class="surah__num">' + toArabicDigits(i + 1) + '</span>'
            + '<span class="surah__name">' + surasTashkeel[i].getAttribute('name') + '</span>';
        addSurahClickHandler(surahItem, i);
        list.appendChild(surahItem);
    }
    var surahButtons = list.querySelectorAll('.surah');

    // Filter the list by surah name or number.
    surahFilter.addEventListener('input', function () {
        var query = normalizeArabic(surahFilter.value.trim());
        surahButtons.forEach(function (button, index) {
            var name = normalizeArabic(surasTashkeel[index].getAttribute('name'));
            var number = String(index + 1);
            var isMatch = !query || name.indexOf(query) !== -1 || number.indexOf(query) === 0;
            button.hidden = !isMatch;
        });
    });

    showNav.addEventListener('click', function () {
        if (list.style.display == 'none') {
            openSurahNav();
        } else {
            closeSurahNav();
        }
    });

    // On small screens the extra tools sit behind the menu button.
    toolsToggle.addEventListener('click', function () {
        setToolsMenu(!toolsMenuIsOpen());
    });

    // A tap anywhere outside the app bar closes the menu again.
    document.addEventListener('click', function (event) {
        if (toolsMenuIsOpen() && !event.target.closest('.appbar')) {
            setToolsMenu(false);
        }
    });

    // The menu button is a small screen affordance, so a wider window closes it.
    var narrowAppbar = window.matchMedia('(max-width: 700px)');
    var closeMenuWhenWide = function (event) {
        if (!event.matches) {
            setToolsMenu(false);
        }
    };
    if (typeof narrowAppbar.addEventListener === 'function') {
        narrowAppbar.addEventListener('change', closeMenuWhenWide);
    } else if (typeof narrowAppbar.addListener === 'function') {
        narrowAppbar.addListener(closeMenuWhenWide);
    }

    closeNavButton.addEventListener('click', closeSurahNav);

    navBackdrop.addEventListener('click', closeSurahNav);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeSurahNav();
            closeToolsMenu();
        }
    });

    // Random Ayah button functionality
    randomButton.addEventListener('click', function () {
        closeToolsMenu();
        var randomSura = generateRandomNumber(0, 113);
        var randomAyahNumber = generateRandomNumber(0, surasTashkeel[randomSura].children.length - 1);

        stopPlayback();
        clearSearch();
        selectSurah(randomSura);
        SurahText.innerHTML = surahHeadHTML(randomSura) + ayahCardHTML(randomSura, randomAyahNumber);
        updatePlaybackUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Random Surah button functionality
    randomSurahButton.addEventListener('click', function () {
        clearSearch();
        ViewSurah(generateRandomNumber(0, 113));
    });

    // Clear button functionality
    clearButton.addEventListener('click', function () {
        closeToolsMenu();
        stopPlayback();
        SurahText.innerHTML = emptyStateHTML(); // Clear the displayed surah and ayah
        clearSearch();                          // Clear the search field and the results
        clearSurahSelection();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Back to top button
    toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // One delegated listener serves every play button, including new ones.
    SurahText.addEventListener('click', function (event) {
        const playButton = event.target.closest('.play-btn');
        if (playButton) {
            playAyah(Number(playButton.dataset.surah), Number(playButton.dataset.ayah));
            return;
        }
        if (event.target.closest('[data-open-nav]')) {
            openSurahNav();
        }
    });

    var syncToTopVisibility = function () {
        toTop.hidden = window.scrollY < 700;
    };
    window.addEventListener('scroll', syncToTopVisibility, { passive: true });
    syncToTopVisibility();
}

function setupSearchBar() {
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('search-results');

    searchButton.addEventListener('click', function () {
        runSearch(true);
    });

    searchBar.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            runSearch(true);
        }
    });

    // Search while typing (debounced) so the list follows the query.
    searchBar.addEventListener('input', function () {
        if (searchTimer) {
            clearTimeout(searchTimer);
        }
        searchTimer = setTimeout(function () {
            runSearch(false);
        }, 280);
    });

    // A single delegated listener serves every result card, including paged ones.
    resultsContainer.addEventListener('click', function (event) {
        var card = event.target.closest('.result');
        if (card) {
            navigateToAyah(Number(card.dataset.surah), Number(card.dataset.ayah));
        }
    });

    resultsContainer.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        var card = event.target.closest('.result');
        if (card) {
            event.preventDefault();
            navigateToAyah(Number(card.dataset.surah), Number(card.dataset.ayah));
        }
    });
}

/* Runs a search and renders the first page of results. */
function runSearch(scrollToResults) {
    var searchBar = document.getElementById('search-bar');
    var resultsContainer = document.getElementById('search-results');
    if (!searchBar || !resultsContainer || !surasClean) {
        return;
    }

    const query = normalizeArabic(searchBar.value.trim());

    if (query.length < 3) { // At least three letters before a search starts
        clearResults();
        return;
    }

    closeToolsMenu(); // The results appear under the bar, so give them the screen

    cancelPendingRender();
    currentMatches = collectMatches(query);
    renderedMatches = 0;
    resultsTarget = 0;
    resultsContainer.innerHTML = '';

    if (currentMatches.length === 0) {
        resultsContainer.innerHTML = '<p class="empty">لا توجد نتائج مطابقة'
            + (selectedSurah !== null ? ' في سورة ' + surahName(selectedSurah) : '') + '.</p>';
        return;
    }

    appendResultsPage();

    if (scrollToResults) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* Re-renders the current results, for example after the selected surah changed. */
function refreshSearchResults() {
    if (!surasClean) {
        return;
    }
    runSearch(false);
}

/* Collects every ayah that contains the query (in the selected surah only). */
function collectMatches(query) {
    const matches = [];
    const firstSurah = selectedSurah === null ? 0 : selectedSurah;
    const lastSurah = selectedSurah === null ? surasClean.length - 1 : selectedSurah;

    for (let s = firstSurah; s <= lastSurah; s++) {
        const ayahs = surasClean[s].children;
        for (let a = 0; a < ayahs.length; a++) {
            const cleanText = ayahs[a].getAttribute('text') || '';
            if (cleanText && normalizeArabic(cleanText).includes(query)) {
                matches.push({ surah: s, ayah: a, cleanText: cleanText });
            }
        }
    }
    return matches;
}

/* Adds the next page of matches, drawn in chunks so typing stays smooth. */
function appendResultsPage() {
    const previousButton = document.getElementById('load-more');

    cancelPendingRender();
    if (previousButton) {
        previousButton.remove();
    }

    resultsTarget = Math.min(renderedMatches + RESULTS_PER_PAGE, currentMatches.length);

    if (renderedMatches === 0) {
        document.getElementById('search-results').insertAdjacentHTML('beforeend',
            '<p class="results-meta">' + toArabicDigits(currentMatches.length) + ' نتيجة'
            + (selectedSurah !== null ? ' في سورة ' + surahName(selectedSurah) : '')
            + '</p>');
    }

    renderNextChunk();
}

/* Renders one chunk, then hands the rest back to the browser's idle time. */
function renderNextChunk() {
    const resultsContainer = document.getElementById('search-results');
    const chunkEnd = Math.min(renderedMatches + RESULTS_CHUNK, resultsTarget);
    let html = '';

    for (let i = renderedMatches; i < chunkEnd; i++) {
        html += searchResultHTML(currentMatches[i]);
    }
    renderedMatches = chunkEnd;

    if (html) {
        resultsContainer.insertAdjacentHTML('beforeend', html);
    }

    if (renderedMatches < resultsTarget) {
        renderHandle = scheduleIdle(renderNextChunk);
    } else {
        renderHandle = null;
        addLoadMoreButton();
    }
}

function addLoadMoreButton() {
    if (resultsTarget >= currentMatches.length) {
        return;
    }

    const resultsContainer = document.getElementById('search-results');
    resultsContainer.insertAdjacentHTML('beforeend',
        '<button id="load-more" class="btn load-more" type="button">عرض المزيد ('
        + toArabicDigits(currentMatches.length - resultsTarget) + ' نتيجة)</button>');
    document.getElementById('load-more').addEventListener('click', appendResultsPage);
}

function scheduleIdle(callback) {
    if (typeof requestIdleCallback === 'function') {
        return requestIdleCallback(callback, { timeout: 500 });
    }
    return setTimeout(callback, 24);
}

function cancelPendingRender() {
    if (renderHandle === null) {
        return;
    }
    if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(renderHandle);
    } else {
        clearTimeout(renderHandle);
    }
    renderHandle = null;
}

/* Shortens a long excerpt; the card clamps the text to three lines anyway. */
function excerpt(text) {
    if (!text || text.length <= RESULTS_EXCERPT_LENGTH) {
        return text;
    }
    return text.slice(0, RESULTS_EXCERPT_LENGTH).replace(/\s+\S*$/, '') + '…';
}

/* Clears the search field and everything that was rendered for it. */
function clearSearch() {
    const searchBar = document.getElementById('search-bar');

    if (searchBar) {
        searchBar.value = '';
    }
    clearResults();
}

/* Empties the result list without touching what is typed in the field. */
function clearResults() {
    const resultsContainer = document.getElementById('search-results');

    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    currentMatches = [];
    renderedMatches = 0;
    resultsTarget = 0;
    cancelPendingRender();
}

function normalizeArabic(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[أإآٱى]/g, 'ا')
        .replace(/[ئؤ]/g, 'ء')
        .replace(/ة/g, 'ه');
}

// Function to select a surah (for example when a surah button is clicked)
function selectSurah(surahIndex) {
    selectedSurah = surahIndex;  // Store the selected surah index

    // Highlight the selected surah in the navigation list
    const buttons = document.querySelectorAll('#nav .surah');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('is-active', i === surahIndex);
    }

    // Refresh the results based on the selected surah
    refreshSearchResults();
}

// Reset the search to search the entire Quran
function clearSurahSelection() {
    selectedSurah = null;  // Clear the selected surah

    const buttons = document.querySelectorAll('#nav .surah');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('is-active');
    }
}

function navigateToAyah(surahIndex, ayahIndex) {
    ViewSurah(surahIndex, false);
    const ayah = document.getElementById(`ayah-${surahIndex}-${ayahIndex}`);
    if (ayah) {
        ayah.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ayah.classList.add('is-flash');
        setTimeout(function () {
            ayah.classList.remove('is-flash');
        }, 1800);
    }
}
/* Splits text into word ranges: [[start, end], ...] */
function wordRanges(text) {
    const ranges = [];
    const pattern = /\S+/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
    }
    return ranges;
}

function highlightMatch(uthmaniText, cleanText, query) {
    const normalizedText = normalizeArabic(cleanText);
    const normalizedQuery = normalizeArabic(query);
    const charRanges = [];

    let matchIndex = normalizedText.indexOf(normalizedQuery);
    while (matchIndex !== -1) {
        charRanges.push([matchIndex, matchIndex + normalizedQuery.length]);
        matchIndex = normalizedText.indexOf(normalizedQuery, matchIndex + normalizedQuery.length);
    }

    if (charRanges.length === 0) {
        return uthmaniText;
    }

    // The clean and the Uthmani text are word aligned, so the matched words can
    // be marked in the Uthmani text even though it carries the diacritics.
    const cleanWords = wordRanges(cleanText);
    const uthmaniWords = wordRanges(uthmaniText);
    if (cleanWords.length !== uthmaniWords.length) {
        return uthmaniText; // Not aligned: show the text without a highlight
    }

    const markedWords = [];
    const alreadyMarked = {};

    for (let c = 0; c < charRanges.length; c++) {
        for (let w = 0; w < cleanWords.length; w++) {
            const overlaps = cleanWords[w][1] > charRanges[c][0] && cleanWords[w][0] < charRanges[c][1];
            if (overlaps && !alreadyMarked[w]) {
                alreadyMarked[w] = true;
                markedWords.push(w);
            }
        }
    }

    let highlightedText = uthmaniText;
    for (let i = markedWords.length - 1; i >= 0; i--) {
        const [start, end] = uthmaniWords[markedWords[i]];
        highlightedText = highlightedText.substring(0, end) +
            '</mark>' + highlightedText.substring(end);
        highlightedText = highlightedText.substring(0, start) +
            '<mark>' + highlightedText.substring(start);
    }

    return highlightedText;
}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


/* ---------------------------------------------------------------------------
 * Rendering
 * ------------------------------------------------------------------------ */

/* Renders numbers with Arabic-Indic digits (٠١٢٣…). */
function toArabicDigits(value) {
    return String(value).replace(/[0-9]/g, function (digit) {
        return ARABIC_DIGITS[Number(digit)];
    });
}

function surahName(surahIndex) {
    return surasTashkeel[surahIndex].getAttribute('name');
}

function surahHeadHTML(surahIndex) {
    return '<header class="surah-head">'
        + '<span class="surah-head__badge">' + toArabicDigits(surahIndex + 1) + '</span>'
        + '<h2 class="surah-head__name">' + surahName(surahIndex) + '</h2>'
        + '</header>';
}

/* One block per ticked source, in the order the reader ticked them. */
function sourceBlocksHTML(surahIndex, ayahIndex, clamp) {
    return enabledSources.map(function (id) {
        return sourceBlockHTML(id, surahIndex, ayahIndex, clamp);
    }).join('');
}

function sourceBlockHTML(id, surahIndex, ayahIndex, clamp) {
    const entry = findCatalogEntry(id);
    const data = sourceCache[id];
    if (!entry || !data) {
        return '';
    }

    const sura = data[surahIndex];
    const ayah = sura ? sura.children[ayahIndex] : null;
    const text = ayah ? ayah.getAttribute('text') : '';
    if (!text) {
        return '';
    }

    const isRtl = entry.rtl === true;
    return '<div class="ayah__block" dir="' + (isRtl ? 'rtl' : 'ltr') + '">'
        + '<span class="ayah__label">' + flagHTML(entry) + htmlEscape(entry.name) + '</span>'
        + '<p class="' + (isRtl ? 'ayah__tafsir' : 'ayah__english')
        + (clamp ? ' clamp-text' : '') + '">'
        + (clamp ? excerpt(text) : text)
        + '</p>'
        + '</div>';
}

/* Small play/pause button of one ayah. `fileNumber` is what the audio file is
 * called: the ayah number, or 0 for the basmala that opens a surah. */
function ayahPlayButtonHTML(surahIndex, fileNumber) {
    if (reciters.length === 0) {
        return '';
    }

    return '<button class="play-btn" type="button" data-surah="' + surahIndex
        + '" data-ayah="' + fileNumber + '" aria-label="تشغيل التلاوة" title="تشغيل التلاوة">'
        + '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>'
        + '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"></path></svg>'
        + '</button>';
}

/* One ayah card: number, Uthmani text, tafsir and translation. */
function ayahCardHTML(surahIndex, ayahIndex) {
    return '<article class="ayah" id="ayah-' + surahIndex + '-' + ayahIndex + '">'
        + '<div class="ayah__head">'
        + '<span class="ayah__num">' + toArabicDigits(ayahIndex + 1) + '</span>'
        + '<span class="ayah__rule" aria-hidden="true"></span>'
        + ayahPlayButtonHTML(surahIndex, ayahIndex + 1)
        + '</div>'
        + '<p class="ayah__text quran-text" lang="ar">'
        + surasTashkeel[surahIndex].children[ayahIndex].getAttribute('text')
        + '</p>'
        + sourceBlocksHTML(surahIndex, ayahIndex, false)
        + '</article>';
}

/* One search result card (the matched ayah, with the query highlighted). */
function searchResultHTML(match) {
    const surahIndex = match.surah;
    const ayahIndex = match.ayah;
    const searchBar = document.getElementById('search-bar');
    const query = searchBar ? normalizeArabic(searchBar.value.trim()) : '';
    const highlighted = highlightMatch(
        surasTashkeel[surahIndex].children[ayahIndex].getAttribute('text'),
        match.cleanText,
        query
    );

    let html = '<div class="result" role="button" tabindex="0"'
        + ' data-surah="' + surahIndex + '" data-ayah="' + ayahIndex + '"'
        + ' aria-label="' + surahName(surahIndex) + ' ' + toArabicDigits(ayahIndex + 1) + '">'
        + '<div class="result__head">'
        + '<h4 class="result__ref">' + surahName(surahIndex) + '</h4>'
        + '<span class="result__loc">'
        + toArabicDigits(surahIndex + 1) + ':' + toArabicDigits(ayahIndex + 1)
        + '</span>'
        + '</div>'
        + '<p class="quran-text" lang="ar">' + highlighted + '</p>'
        + sourceBlocksHTML(surahIndex, ayahIndex, true);

    return html + '</div>';
}

function emptyStateHTML() {
    return '<div class="empty">'
        + '<p class="empty__text">اختر سورة من قائمة السور، أو ابحث في القرآن الكريم من الشريط في الأعلى.</p>'
        + '<button class="btn btn--primary empty__cta" type="button" data-open-nav>'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>'
        + '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>'
        + '</svg>'
        + '<span>قائمة السور</span>'
        + '</button>'
        + '</div>';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const button = document.getElementById('theme-toggle');
    if (button) {
        button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        button.title = theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري';
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'light' ? '#f7f5ef' : '#0a0f10');
    }
}

function addSurahClickHandler(button, surahIndex) {
    button.addEventListener('click', function () {
        ViewSurah(surahIndex);
    }, false);
}

/* Opens the surah list, from the app bar button or the empty state button. */
function openSurahNav() {
    const list = document.getElementById('nav');
    const backdrop = document.getElementById('nav-backdrop');
    const showNav = document.getElementById('show-nav');
    const filter = document.getElementById('surah-filter');
    if (!list) {
        return;
    }

    closeToolsMenu(); // The tool menu and the surah list never share the screen
    list.style.display = 'grid';
    if (backdrop) {
        backdrop.hidden = false;
    }
    if (showNav) {
        showNav.setAttribute('aria-expanded', 'true');
    }
    if (filter) {
        filter.focus({ preventScroll: true });
    }
}

function closeSurahNav() {
    const list = document.getElementById('nav');
    const backdrop = document.getElementById('nav-backdrop');
    const showNav = document.getElementById('show-nav');
    if (!list) {
        return;
    }

    list.style.display = 'none';
    if (backdrop) {
        backdrop.hidden = true;
    }
    if (showNav) {
        showNav.setAttribute('aria-expanded', 'false');
    }

    // The list always opens unfiltered again.
    const filter = document.getElementById('surah-filter');
    if (filter && filter.value) {
        filter.value = '';
        list.querySelectorAll('.surah').forEach(function (button) {
            button.hidden = false;
        });
    }
}

function renderSurah(index) {
    const parts = [surahHeadHTML(index)];

    // Surah 1 already contains the basmala as its first ayah, surah 9 has none.
    if (index !== 0 && index !== 8) {
        parts.push('<div class="basmala-row">'
            + '<p class="basmala" lang="ar">'
            + surasTashkeel[0].children[0].getAttribute('text') + '</p>'
            + ayahPlayButtonHTML(index, 0)
            + '</div>');
    }

    for (let a = 0; a < surasTashkeel[index].children.length; a++) {
        parts.push(ayahCardHTML(index, a));
    }

    SurahText.innerHTML = parts.join('');
    updatePlaybackUI();
}

function ViewSurah(index, scrollToTop) {
    if (playback.surah !== null && playback.surah !== index) {
        stopPlayback(); // The player follows the surah that is on screen
    }
    selectSurah(index);
    closeSurahNav();
    closeToolsMenu();
    renderSurah(index);
    syncViewSwitch(index);

    if (scrollToTop !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/* Keeps the mushaf link and the address bar in step with the surah on screen,
 * so switching to the Mushaf view opens the page that surah starts on. */
function syncViewSwitch(index) {
    const link = document.getElementById('mushaf-link');
    if (link) {
        link.href = 'index2.html#s' + (index + 1);
    }
    try {
        history.replaceState(null, '', '?surah=' + (index + 1));
    } catch (error) {
        // History may be blocked (file://); the link above still works.
    }
}

/* index2.html links here as ?surah=18 so the two views stay in step. */
function openSurahFromUrl() {
    let requested = 0;
    try {
        requested = Number(new URLSearchParams(window.location.search).get('surah'));
    } catch (error) {
        requested = 0;
    }
    if (requested >= 1 && requested <= 114) {
        ViewSurah(requested - 1, false);
    }
}