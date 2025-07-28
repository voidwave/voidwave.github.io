const imageFolder = 'images/';
const gallery = document.getElementById('gallery');

fetch('images.json')
    .then(response => response.json())
    .then(images => {
        images.forEach(file => {
            const img = document.createElement('img');
            img.src = imageFolder + file;
            img.alt = file;
            gallery.appendChild(img);
        });
    })
    .catch(err => {
        console.error('Failed to load images.json', err);
    });
