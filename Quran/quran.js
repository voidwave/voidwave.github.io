// The base URL for the images
const baseUrl = 'https://voidwave.github.io/Quran/QuranPNGs/';
// The current page number
let currentPage = 1;

// The maximum number of pages to keep in the DOM
const maxPages = 3;

// The total number of pages
const totalPages = 605;

// The container for the images
const container = document.getElementById('container');
const progressBar = document.getElementById('progress-bar');

document.addEventListener('DOMContentLoaded', (event) => {
    // The progress container
    const progressContainer = document.getElementById('progress');

    // Navigate to a page when the progress container is clicked
    progressContainer.addEventListener('click', (event) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progressWidth = rect.width;
        const clickRatio = clickX / progressWidth;
        const page = Math.round(clickRatio * totalPages);
        navigateToPage(page);
    });
});

// Create an Intersection Observer to load more pages when the user scrolls to the bottom
let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id === 'bottom' && currentPage < totalPages) {
            loadNextPage();
        } else if (entry.isIntersecting && entry.target.id === 'top' && currentPage > 1) {
            loadPreviousPage();
        }
    });
}, {
    rootMargin: '100px'
});

// Load the initial pages
loadInitialPages();
// Update the progress bar
function updateProgressBar() {
    const progress = (currentPage / totalPages) * 100;
    progressBar.style.width = `${progress}%`;
}

// Navigate to a specific page
function navigateToPage(page) {
    // Clear the container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Set the current page
    currentPage = page;

    // Load the new pages
    loadInitialPages();

    // Update the progress bar
    updateProgressBar();
}

// Create a Resize Observer to reconnect the Intersection Observer when the iframe is resized
const resizeObserver = new ResizeObserver(() => {
    observer.disconnect();
    observer = new IntersectionObserver(observer.callback, observer.options);
    observer.observe(container.firstChild);
    observer.observe(container.lastChild);
});

// Observe the body for resize events
resizeObserver.observe(document.body);

function loadInitialPages() {
    for (let i = 0; i < maxPages && i < totalPages; i++) {
        loadNextPage();
    }
}

function loadNextPage() {
    const img = document.createElement('img');
    img.src = `${baseUrl}${currentPage.toString().padStart(3, '0')}.png`;
    container.appendChild(img);
    currentPage++;

    // Remove the old page if there are more than maxPages in the DOM
    while (container.children.length > maxPages) {
        container.removeChild(container.firstChild);
    }

    // Observe the last image for scrolling
    if (container.lastChild) {
        observer.observe(container.lastChild);
        container.lastChild.id = 'bottom';
    }

    // If it's the first image, also observe it for scrolling up
    if (container.firstChild) {
        observer.observe(container.firstChild);
        container.firstChild.id = 'top';
    }

    updateProgressBar();
}

function loadPreviousPage() {
    currentPage--;
    const img = document.createElement('img');
    img.src = `${baseUrl}${currentPage.toString().padStart(3, '0')}.png`;
    container.insertBefore(img, container.firstChild);

    // Remove the old page if there are more than maxPages in the DOM
    while (container.children.length > maxPages) {
        container.removeChild(container.lastChild);
    }

    // Observe the first image for scrolling
    if (container.firstChild) {
        observer.observe(container.firstChild);
        container.firstChild.id = 'top';
    }

    // If it's the last image, also observe it for scrolling down
    if (container.lastChild) {
        observer.observe(container.lastChild);
        container.lastChild.id = 'bottom';
    }

    updateProgressBar();
}