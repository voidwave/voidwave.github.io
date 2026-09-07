const gameTrailers = {
    hydrogen: {
        title: 'Hydrogen', category: 'ACTION ROGUELITE / PC',
        steam: 'https://store.steampowered.com/app/1746820/',
        youtube: 'eVls3ZLbLmo'
    },
    djinn: {
        title: 'Djinn Scrolls', category: 'ACTION ROGUELIKE / PC',
        steam: 'https://store.steampowered.com/app/4392620/DJINN_SCROLLS/',
        youtube: 'fXA2v9EV6Fk'
    }
};
const gameId = new URLSearchParams(location.search).get('game');
const game = Object.hasOwn(gameTrailers, gameId) ? gameTrailers[gameId] : gameTrailers.hydrogen;
const trailer = document.getElementById('game-trailer');
const statusMessage = document.getElementById('trailer-status');
let streamPlayer;

function syncGameTheme() {
    try {
        const preferences = JSON.parse(localStorage.getItem('voidwave.desktop'));
        document.body.dataset.accent = preferences?.accent === 'ice' ? 'ice' : 'mint';
    } catch { }
}

function showTrailerError() {
    statusMessage.textContent = 'The trailer could not load. You can watch it on the Steam page.';
    statusMessage.hidden = false;
}

document.title = `${game.title} / voidwave`;
document.getElementById('game-title').textContent = game.title;
document.getElementById('game-category').textContent = game.category;
document.getElementById('game-steam').href = game.steam;
document.getElementById('trailer-caption').textContent = `${game.title} / Official trailer`;
document.getElementById('trailer-external').href = game.youtube ? `https://www.youtube.com/watch?v=${game.youtube}` : game.steam;
document.getElementById('trailer-link-label').textContent = game.youtube ? 'Watch on YouTube' : 'Watch on Steam';

if (game.youtube) {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube.com/embed/${game.youtube}?rel=0&playsinline=1`;
    frame.title = `${game.title} trailer`;
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    trailer.appendChild(frame);
} else {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = game.poster;
    video.setAttribute('aria-label', `${game.title} trailer`);
    video.addEventListener('error', showTrailerError);
    video.addEventListener('loadeddata', () => { statusMessage.hidden = true; });
    trailer.appendChild(video);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = game.stream;
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
        script.addEventListener('error', showTrailerError);
        script.addEventListener('load', () => {
            if (!window.Hls?.isSupported()) { showTrailerError(); return; }
            streamPlayer = new Hls({ maxBufferLength: 15, maxMaxBufferLength: 30 });
            streamPlayer.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) { streamPlayer.destroy(); showTrailerError(); }
            });
            streamPlayer.loadSource(game.stream);
            streamPlayer.attachMedia(video);
        });
        document.head.appendChild(script);
    }
}

addEventListener('pagehide', () => streamPlayer?.destroy());
addEventListener('storage', syncGameTheme);
syncGameTheme();