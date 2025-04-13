// Base URL for Quran images
const baseUrl = 'https://voidwave.com/Quran/QuranPNGs/';

// Config
const totalPages = 604;

let container;
let progressBar;
let pageNumberEl;
let quranPageMap = [];

document.addEventListener('DOMContentLoaded', () => {

    loadQuranPageMapFromXML("quran_pages.xml").then(map => {
        quranPageMap = map;


    });
    // Example usage
    const page = getPageForAyah(2, 200);
    console.log("Page:", page);
    container = document.getElementById('container');
    progressBar = document.getElementById('progress-bar');
    pageNumberEl = document.getElementById('page-number');
    const viewportHeight = window.innerHeight;

    // Set up container for scrolling
    container.style.height = `${totalPages * viewportHeight}px`;
    container.style.position = 'relative';


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
        // Get current scroll position
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        let pageHeight = 1.62 * window.innerWidth;

        // Calculate visible page range
        const firstVisiblePage = Math.floor(scrollTop / pageHeight) + 1;
        const lastVisiblePage = firstVisiblePage + 2//Math.ceil((scrollTop + viewportHeight) / pageHeight);

        // console.log("scrolltop =" + scrollTop);
        // console.log("firstVisiblePage =" + firstVisiblePage);
        // console.log("lastVisiblePage =" + lastVisiblePage);
        // console.log("viewportHeight =" + viewportHeight);
        // Update UI
        const currentPage = firstVisiblePage;
        updateProgressBar(scrollTop, currentPage);

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
    });

    window.addEventListener('resize', () => {

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
    });
    // Progress bar click handler

    document.getElementById('progress').addEventListener('click', (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
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
        pageNumberEl.textContent = `Page ${currentPage} / ${totalPages}`;
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
});