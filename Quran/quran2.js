// Base URL for Quran images
const baseUrl = 'https://voidwave.com/Quran/QuranPNGs/';

// Config
const totalPages = 604;

let container;
let progressBar;
let pageNumberEl;
let quranPageMap = [];

let showTimeout = null;
let hideTimeout = null;
let lastScrollY = window.scrollY;

let openBtn;
let clearSearchBtn;
let overlay;
let list;
let savedPage = 1;
let resizeTimeout;
let searchBar;
let resultsContainer;
var surasTashkeel;
var surasClean;
var surasEnglish;
var surasTafsirJalalyn;

Promise.all([
    loadXml('https://voidwave.com/Quran/QuranText/Quran/quran-uthmani.xml').then(data => surasTashkeel = data),
    loadXml('https://voidwave.com/Quran/QuranText/Quran/quran-simple-clean.xml').then(data => surasClean = data),
    loadXml('https://voidwave.com/Quran/QuranText/English-Translation/en.sahih.xml').then(data => surasEnglish = data),
    loadXml('https://voidwave.com/Quran/QuranText/Arabic-Tafsir/ar.jalalayn.xml').then(data => surasTafsirJalalyn = data)
]).then(() => {
    console.log("All XML files loaded successfully!");
    //initializePage();
    // Call the function that initializes the page
}).catch(error => {
    console.error("Error loading XML files:", error);
});

document.addEventListener('DOMContentLoaded', () => {

    openBtn = document.getElementById("open-surah-picker");
    clearSearchBtn = document.getElementById("clear-search");
    overlay = document.getElementById("surah-picker-overlay");
    list = document.getElementById("surah-list");
    searchBar = document.getElementById('search-bar');
    resultsContainer = document.getElementById('search-results');
    container = document.getElementById('container');
    progressBar = document.getElementById('progress-bar');
    pageNumberEl = document.getElementById('page-number');
    const viewportHeight = window.innerHeight;

    // Set up container for scrolling
    container.style.height = `${totalPages * viewportHeight}px`;
    container.style.position = 'relative';
    savedPage = parseInt(localStorage.getItem('currentPage'));

    (async () => {
        const map = await loadQuranPageMapFromXML("https://voidwave.com/Quran/quran_pages.xml");
        quranPageMap = map;
        populateSuraNav();
        //const page = getPageForAyah(2, 200);
        console.log("loaded Quran PageMap From XML");
    })();

    function populateSuraNav() {
        suraNames.forEach((name, index) => {
            const btn = document.createElement("button");
            btn.textContent = `${index + 1}. ${name}`;
            btn.onclick = () => {
                overlay.classList.remove("show");
                const page = getPageForAyah(index + 1, 1);
                navigateToPage(page); // you define this function based on how your quran.js works
            };
            list.appendChild(btn);
        });
    }



    // Toggle overlay visibility
    ["click"].forEach(evt =>
        openBtn.addEventListener(evt, () => {
            overlay.classList.toggle("show");
        })
    );
    ["click"].forEach(evt =>
        clearSearchBtn.addEventListener(evt, () => {
            resultsContainer.innerHTML = '';
            searchBar.value = '';
        })
    );
    // Create empty page placeholders
    for (let i = 1; i <= totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.id = `page-${i}`;
        pageDiv.className = 'page';
        pageDiv.dataset.page = i;
        pageDiv.style.height = `${viewportHeight}px`;
        pageDiv.style.top = `${(i - 1) * viewportHeight}px`;
        container.appendChild(pageDiv);
    }

    // Keep track of which pages are currently loaded
    const loadedPages = new Set();

    // Scroll handler
    window.addEventListener('scroll', () => {

        lastScrollY = window.scrollY;
        // Get current scroll position
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        let pageHeight = 1.62 * window.innerWidth;

        // Calculate visible page range

        const firstVisiblePage = Math.floor(scrollTop / pageHeight) + 1;
        const lastVisiblePage = firstVisiblePage + 2//Math.ceil((scrollTop + viewportHeight) / pageHeight);


        // Update UI
        let currentPage = firstVisiblePage;
        updateProgressBar(scrollTop, firstVisiblePage);

        console.log(`Visible pages: ${firstVisiblePage} to ${lastVisiblePage}`);

        // Determine which pages to load and unload
        for (let i = 1; i <= totalPages; i++) {
            // Page is visible - load it if not already loaded
            if (i >= firstVisiblePage && i <= lastVisiblePage) {
                if (!loadedPages.has(i)) {
                    loadPage(i);
                    loadedPages.add(i);
                }
            }
            // Page is not visible - unload it if it's loaded
            else if (loadedPages.has(i)) {
                unloadPage(i);
                loadedPages.delete(i);
            }
        }

        // if (Math.abs(window.scrollY - lastScrollY) > 5) {
        //     lastScrollY = window.scrollY;
        //     showNav();
        //}
    });
    // // Mouse movement near top
    // document.addEventListener("mousemove", (e) => {
    //     if (e.clientY < 80 && e.clientX < 300) {
    //         showNav();
    //     }
    // });
    // // Show when near the top or scrolling
    // function showNav() {
    //     navDropdown.classList.add("visible");
    //     if (hideTimeout) clearTimeout(hideTimeout);
    //     hideTimeout = setTimeout(() => {
    //         navDropdown.classList.remove("visible");
    //     }, 2000); // auto-hide after 2 seconds of no movement
    // }
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);

        resizeTimeout = setTimeout(() => {

            let pageHeight = 1.62 * window.innerWidth;
            container.style.height = `${totalPages * pageHeight}px`;

            const children = container.childNodes;
            for (let i = 0; i < children.length; i++) {
                children[i].style.height = `${pageHeight}px`;
                children[i].style.top = `${i * pageHeight}px`;
            }

            console.log("Resized event called");

            // Force scroll recalculation and page (un)loading
            window.dispatchEvent(new Event('scroll'));

            console.log('Resize done');
        }, 200); // Adjust the delay as needed (200ms is a good starting point)

    });
    // Progress bar click handler

    document.getElementById('progress').addEventListener('click', (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (rect.right - event.clientX) / rect.width;
        const targetPage = Math.max(1, Math.min(totalPages, Math.ceil(ratio * totalPages)));
        navigateToPage(targetPage);
    });
    // Initial check for visible pages
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);

    function loadPage(pageNum) {
        const pageDiv = document.getElementById(`page-${pageNum}`);
        if (!pageDiv) return;

        console.log(`Loading page ${pageNum}`);

        const img = new Image();
        img.src = `${baseUrl}${pageNum.toString().padStart(3, '0')}.png`;
        img.alt = `Quran Page ${pageNum}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.style.objectFit = 'contain';

        // Clear any existing content and add the image
        pageDiv.innerHTML = '';
        pageDiv.appendChild(img);
    }

    function unloadPage(pageNum) {
        const pageDiv = document.getElementById(`page-${pageNum}`);
        if (!pageDiv) return;

        console.log(`Unloading page ${pageNum}`);

        // Clear the page div
        pageDiv.innerHTML = '';
    }

    function updateProgressBar(scrollTop, currentPage) {
        // Update progress bar

        let pageheight = 1.62 * window.innerWidth;
        const maxScroll = totalPages * pageheight;
        const progress = (scrollTop / maxScroll) * 100;
        progressBar.style.width = `${progress}%`;

        // Update page counter
        pageNumberEl.textContent = `${currentPage}`;

        if (currentPage != 1)
            localStorage.setItem('currentPage', currentPage);
    }

    function navigateToPage(pageNum) {
        if (pageNum < 1 || pageNum > totalPages) return;
        let pageHeight = 1.62 * window.innerWidth;
        console.log("navigate to page = " + pageNum);
        let scrollpos = (pageNum - 1) * pageHeight;

        window.scrollTo({
            top: scrollpos,
            left: 0//,
            // behavior: 'smooth' // or 'auto'
        });
    }

    async function loadQuranPageMapFromXML(url) {
        const response = await fetch(url);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        const pages = xmlDoc.getElementsByTagName("page");
        const map = [];

        for (const page of pages) {
            const pageNumber = parseInt(page.getAttribute("number"));
            const ranges = [];
            const rangeElements = page.getElementsByTagName("range");

            for (const range of rangeElements) {
                ranges.push({
                    surah: parseInt(range.getAttribute("surah")),
                    startAyah: parseInt(range.getAttribute("start")),
                    endAyah: parseInt(range.getAttribute("end"))
                });
            }

            map.push({ page: pageNumber, ranges });
        }

        return map;
    }

    function getPageForAyah(surah, ayah) {
        for (const pageEntry of quranPageMap) {
            for (const range of pageEntry.ranges) {
                if (
                    range.surah === surah &&
                    ayah >= range.startAyah &&
                    ayah <= range.endAyah
                ) {
                    return pageEntry.page;
                }
            }
        }
        return null;
    }

    const suraNames = [
        "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف",
        "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
        "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون",
        "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
        "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص",
        "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
        "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم",
        "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
        "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك",
        "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر",
        "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير",
        "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية",
        "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق",
        "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر",
        "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
        "المسد", "الإخلاص", "الفلق", "الناس"
    ];


    if (!isNaN(savedPage)) {
        navigateToPage(savedPage);
    }
    setupSearchBar();
    var selectedSurah = null; // Variable to track selected Surah
    function setupSearchBar() {



        searchBar.addEventListener('input', function () {
            const query = this.value.trim().toLowerCase();
            resultsContainer.innerHTML = ''; // Clear previous results

            if (query.length < 2) return; // Avoid overly short searches

            let matchCount = 0;

            if (selectedSurah === null) {
                // Search the entire Quran if no surah is selected
                for (let s = 0; s < surasClean.length; s++) {
                    for (let a = 0; a < surasClean[s].children.length; a++) {
                        const cleanText = surasClean[s].children[a].getAttribute('text')?.toLowerCase();
                        if (cleanText && cleanText.includes(query)) {
                            matchCount++;

                            const surahName = surasClean[s].getAttribute('name');
                            const cleanAyahText = surasClean[s].children[a].getAttribute('text');
                            //const tashkeelAyahText = surasTashkeel[s].children[a].getAttribute('text');
                            const tafsir = surasTafsirJalalyn[s].children[a].getAttribute('text');
                            const english = surasEnglish[s].children[a].getAttribute('text');

                            // Step 1: Highlight the tashkeel ayah text based on the clean text and search query
                            const highlightedAyahText = highlightMatch(cleanAyahText, query);

                            const result = document.createElement('div');
                            result.style.padding = '10px';
                            result.style.borderBottom = '1px solid #ccc';
                            result.innerHTML = `
                               <h4>${surahName} [${a + 1}:${s + 1}]</h4>
                            <p style="color: white;">${highlightedAyahText}</p>` +
                                `<p style="color: gray;"><strong></strong> ${tafsir}</p>` +
                                `<p style="direction: ltr; color: gray;"><strong></strong> ${english}</p>`;
                            resultsContainer.appendChild(result);
                            const pagenumber = getPageForAyah(s + 1, a + 1);
                            result.addEventListener('click', () => {
                                navigateToPage(pagenumber);
                                resultsContainer.innerHTML = '';

                            });
                        }
                    }
                }
            } else {
                // Search only the selected surah
                const s = selectedSurah;
                for (let a = 0; a < surasClean[s].children.length; a++) {
                    const cleanText = surasClean[s].children[a].getAttribute('text')?.toLowerCase();
                    if (cleanText && cleanText.includes(query)) {
                        matchCount++;

                        const surahName = surasClean[s].getAttribute('name');
                        const cleanAyahText = surasClean[s].children[a].getAttribute('text');
                        const tafsir = surasTafsirJalalyn[s].children[a].getAttribute('text');
                        const english = surasEnglish[s].children[a].getAttribute('text');
                        const highlightedAyahText = highlightMatch(cleanAyahText, query);

                        const result = document.createElement('div');
                        result.style.padding = '10px';
                        result.style.borderBottom = '1px solid #ccc';
                        result.innerHTML = `
                            <h4>${surahName} [${a + 1}:${s + 1}]</h4>
                            <p style="color: white;">${highlightedAyahText}</p>` +
                            `<p style="color: gray;"><strong></strong> ${tafsir}</p>` +
                            `<p style="direction: ltr; color: gray;"><strong></strong> ${english}</p>`;
                        resultsContainer.appendChild(result);
                        const pagenumber = getPageForAyah(s + 1, a + 1);
                        result.addEventListener('click', () => {
                            navigateToPage(pagenumber);
                            resultsContainer.innerHTML = '';
                        });
                    }
                }
            }

            if (matchCount === 0) {
                resultsContainer.innerHTML = '<p>No results found.</p>';
            }
        });
    }

});





function loadXml(path) {
    return fetch(path)
        .then(response => response.text())
        .then(xml => {
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(xml, 'application/xml');
            return xmlDOM.querySelectorAll('sura'); // Return the parsed sura elements
        });
}

function highlightMatch(text, query) {
    // Step 1: Escape the query to make it safe for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Step 2: Find the positions of the matches in the clean text
    let match;
    let indices = [];
    while ((match = regex.exec(text)) !== null) {
        indices.push([match.index, match.index + match[0].length]);
    }

    // Step 3: Highlight the matched text in the tashkeel text
    let highlightedText = text;
    for (let i = indices.length - 1; i >= 0; i--) {
        let [start, end] = indices[i];
        highlightedText = highlightedText.substring(0, start) +
            '<mark>' + highlightedText.substring(start, end) + '</mark>' +
            highlightedText.substring(end);
    }

    // console.log('highlightMatch result:', highlightedText); // Debug
    return highlightedText;
}