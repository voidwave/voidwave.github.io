const imageFolder = 'images/';
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

// Load images.json
fetch('images.json')
    .then(response => response.json())
    .then(images => {
        images.forEach(file => {
            const img = document.createElement('img');
            img.src = imageFolder + file;
            img.alt = file;
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightbox.style.display = 'flex';
            });
            gallery.appendChild(img);
        });
    })
    .catch(err => {
        console.error('Failed to load images.json', err);
    });

// Close lightbox on click
lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
});