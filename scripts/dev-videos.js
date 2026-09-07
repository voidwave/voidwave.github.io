const playlistId = 'PLCyM3qNxv8UyJ2vV6gZb3smWyrJB5fnGq';
const queue = document.getElementById('playlist-queue');
const queueStatus = document.getElementById('queue-status');
const playerStatus = document.getElementById('player-status');
const playerError = document.getElementById('player-error');
const videoTitle = document.getElementById('video-title');
let player;
let playlist = [];
let refreshTimer;
let refreshAttempts = 0;
const videoTitles = new Map();
const pendingTitles = [];
let activeTitleRequests = 0;
const titleObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        titleObserver.unobserve(entry.target);
        pendingTitles.push(entry.target);
    });
    fetchPendingTitles();
}, { root: queue, rootMargin: '200px' });

function fetchPendingTitles() {
    while (activeTitleRequests < 4 && pendingTitles.length) {
        const button = pendingTitles.shift();
        activeTitleRequests++;
        fetchQueueTitle(button);
    }
}

async function fetchQueueTitle(button) {
    const id = button.dataset.videoId;
    try {
        if (!videoTitles.has(id)) {
            const url = new URL('https://www.youtube.com/oembed');
            url.searchParams.set('url', `https://www.youtube.com/watch?v=${id}`);
            url.searchParams.set('format', 'json');
            const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) return;
            const data = await response.json();
            if (typeof data.title === 'string' && data.title) videoTitles.set(id, data.title);
        }
        const title = videoTitles.get(id);
        if (title && button.isConnected) {
            button.querySelector('.queue-title').textContent = title;
            button.setAttribute('aria-label', `Play ${title}, ${Number(button.dataset.index) + 1} of ${playlist.length}`);
        }
    } catch { }
    finally {
        activeTitleRequests--;
        fetchPendingTitles();
    }
}

function syncVideoTheme() {
    try {
        const preferences = JSON.parse(localStorage.getItem('voidwave.desktop'));
        document.body.dataset.accent = preferences?.accent === 'ice' ? 'ice' : 'mint';
    } catch { }
}

function showPlayerError(message) {
    playerError.textContent = message;
    playerError.hidden = false;
    playerStatus.textContent = 'Playback unavailable';
    if (!playlist.length) {
        queueStatus.hidden = false;
        queueStatus.textContent = 'Playlist unavailable here. The full playlist is available through the YouTube link above.';
    }
}

function updateCurrentVideo() {
    const index = player?.getPlaylistIndex?.() ?? -1;
    const data = player?.getVideoData?.();
    if (data?.video_id && data.title) videoTitles.set(data.video_id, data.title);
    queue.querySelectorAll('button').forEach((button, buttonIndex) => {
        const current = buttonIndex === index;
        button.setAttribute('aria-current', String(current));
        const title = videoTitles.get(playlist[buttonIndex]) || `Video ${buttonIndex + 1}`;
        button.querySelector('.queue-title').textContent = title;
        button.setAttribute('aria-label', `Play ${title}, ${buttonIndex + 1} of ${playlist.length}`);
    });
    videoTitle.textContent = data?.title || 'Dev Videos';
    if (playlist.length && index >= 0) playerStatus.textContent = `${index + 1} / ${playlist.length}`;
}

function refreshPlaylist() {
    clearTimeout(refreshTimer);
    const videos = player?.getPlaylist?.();
    if (Array.isArray(videos) && videos.length) {
        if (videos.some(video => typeof video !== 'string' || !/^[\w-]{11}$/.test(video))) return;
        if (videos.join(',') !== playlist.join(',')) {
            playlist = [...videos];
            titleObserver.disconnect();
            pendingTitles.length = 0;
            queue.replaceChildren();
            playlist.forEach((id, index) => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'queue-video';
                button.dataset.videoId = id;
                button.dataset.index = index;
                button.innerHTML = `<span class="queue-number">${index + 1}</span><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy" width="80" height="45"><span class="queue-title"></span>`;
                button.addEventListener('click', () => {
                    playerError.hidden = true;
                    player.playVideoAt(index);
                });
                item.appendChild(button);
                queue.appendChild(item);
                titleObserver.observe(button);
            });
            document.getElementById('playlist-count').textContent = `${playlist.length} VIDEOS`;
        }
        queueStatus.hidden = true;
        updateCurrentVideo();
    } else if (++refreshAttempts < 30) {
        refreshTimer = setTimeout(refreshPlaylist, 500);
    } else {
        showPlayerError('YouTube did not return the playlist. Open it on YouTube to view all available videos.');
    }
}

const apiTimeout = setTimeout(() => {
    showPlayerError('YouTube could not load. Check your connection or open the playlist on YouTube.');
}, 20000);

window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('playlist-player', {
        width: '100%',
        height: '100%',
        playerVars: { listType: 'playlist', list: playlistId, playsinline: 1, rel: 0, origin: location.origin },
        events: {
            onReady: () => {
                clearTimeout(apiTimeout);
                playerError.hidden = true;
                player.getIframe().title = 'Development video playlist';
                refreshPlaylist();
            },
            onStateChange: event => {
                if (event.data === 1) playerError.hidden = true;
                refreshPlaylist();
            },
            onError: () => {
                clearTimeout(apiTimeout);
                refreshPlaylist();
                showPlayerError('This video cannot play here. Select another video or open the playlist on YouTube.');
            }
        }
    });
};

const apiScript = document.createElement('script');
apiScript.src = 'https://www.youtube.com/iframe_api';
apiScript.async = true;
apiScript.addEventListener('error', () => {
    clearTimeout(apiTimeout);
    showPlayerError('YouTube is blocked or unavailable. Open the playlist on YouTube to continue.');
});
document.head.appendChild(apiScript);
addEventListener('storage', syncVideoTheme);
syncVideoTheme();