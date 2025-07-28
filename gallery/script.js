const imageFolder = 'images/';
const thumbnailFolder = 'thumbnails/';
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

let images = [];
let currentIndex = 0;

// Load images.json
fetch('images.json')
    .then(response => response.json())
    .then(data => {
        images = data;

        images.forEach((file, index) => {
            const img = document.createElement('img');
            img.src = thumbnailFolder + file;
            img.alt = file;
            img.addEventListener('click', () => openLightbox(index));
            gallery.appendChild(img);
        });
    })
    .catch(err => {
        console.error('Failed to load images.json', err);
    });

// Open lightbox
function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = imageFolder + images[currentIndex];
    lightbox.style.display = 'flex';
}

// Close lightbox
function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
}

// Navigate lightbox
function showNextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    lightboxImg.src = imageFolder + images[currentIndex];
}

function showPreviousImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    lightboxImg.src = imageFolder + images[currentIndex];
}

// Click anywhere to close
lightbox.addEventListener('click', closeLightbox);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'flex') {
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPreviousImage();
        if (e.key === 'Escape') closeLightbox();
    }
});

// --- Swipe support ---
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, { passive: true });

function handleSwipeGesture() {
    const swipeThreshold = 50; // Minimum px distance for swipe

    const diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
            // Swipe right → previous image
            showPreviousImage();
        } else {
            // Swipe left → next image
            showNextImage();
        }
    }
}