// Base URL for Quran images
const baseUrl = 'https://voidwave.com/Quran/QuranPNGs/';

// Config
const totalPages = 605;
const pageHeight = 965;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const progressBar = document.getElementById('progress-bar');
    const pageNumberEl = document.getElementById('page-number');

    // Set up container for scrolling
    container.style.height = `${totalPages * pageHeight}px`;
    container.style.position = 'relative';
    container.style.overflowY = 'auto';

    // Create empty page placeholders
    for (let i = 1; i <= totalPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.id = `page-${i}`;
        pageDiv.className = 'page';
        pageDiv.dataset.page = i;
        pageDiv.style.height = `${pageHeight}px`;
        pageDiv.style.position = 'absolute';
        pageDiv.style.top = `${(i - 1) * pageHeight}px`;
        pageDiv.style.width = '100%';
        container.appendChild(pageDiv);
    }

    // Keep track of which pages are currently loaded
    const loadedPages = new Set();

    // Scroll handler
    container.addEventListener('scroll', () => {
        // Get current scroll position
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;

        // Calculate visible page range
        const firstVisiblePage = Math.floor(scrollTop / pageHeight) + 1;
        const lastVisiblePage = Math.ceil((scrollTop + viewportHeight) / pageHeight);

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

    // Progress bar click handler
    document.getElementById('progress').addEventListener('click', (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        const targetPage = Math.max(1, Math.min(totalPages, Math.ceil(ratio * totalPages)));
        navigateToPage(targetPage);
    });

    // Initial check for visible pages
    setTimeout(() => {
        container.dispatchEvent(new Event('scroll'));
    }, 100);

    function loadPage(pageNum) {
        const pageDiv = document.getElementById(`page-${pageNum}`);
        if (!pageDiv) return;

        console.log(`Loading page ${pageNum}`);

        const img = new Image();
        img.src = `${baseUrl}${pageNum.toString().padStart(3, '0')}.png`;
        img.alt = `Quran Page ${pageNum}`;
        img.style.width = '100%';
        img.style.display = 'block';

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
        const viewHeight = container.clientHeight;
        const maxScroll = container.scrollHeight - viewHeight;
        const progress = (scrollTop / maxScroll) * 100;
        progressBar.style.width = `${progress}%`;

        // Update page counter
        pageNumberEl.textContent = `Page ${currentPage} / ${totalPages}`;
    }

    function navigateToPage(pageNum) {
        if (pageNum < 1 || pageNum > totalPages) return;
        container.scrollTop = (pageNum - 1) * pageHeight;
    }
});