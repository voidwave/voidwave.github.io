const experimentData = [
    { title: 'Al-Quran.js', detail: 'Quran reader', image: 'img/quran.png', color: 'mint', src: 'Quran/index.html' },
    { title: 'Prime Jinn', detail: 'Sandbox / 2017', icon: 'robot', color: 'gold', src: 'primejinn/index.html', pcOnly: true },
    { title: 'AI Backgrounds', detail: 'WebGPU / 2024', icon: 'image', color: 'blue', src: 'genai-webgpu/index.html' },
    { title: 'Jinni Musha', detail: 'Game jam / 2026', icon: 'sparkles', color: 'coral', src: 'https://itch.io/embed-upload/19005599?color=151a18', url: 'https://voidwave.itch.io/jinnimusha' },
    { title: 'Game Jams', detail: 'itch.io', image: 'img/itchio.png', color: 'graphite', external: 'https://voidwave.itch.io' }
];

const filesContainer = document.getElementById('Files');
const library = document.getElementById('experiment-library');
const view = document.getElementById('experiment-view');
const backButton = document.getElementById('backButton');
const openLink = document.getElementById('open-project');
const currentProject = document.getElementById('current-project');
const statusText = document.getElementById('experiment-status');
let activeIndex = null;

// Prime Jinn is a Windows desktop build, so touch-only devices get a warning instead of the app.
const pcOnlyBlocked = matchMedia('(hover: none) and (pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const notice = document.createElement('div');
notice.className = 'experiment-notice';
notice.setAttribute('role', 'alert');
notice.hidden = true;
notice.title = 'Dismiss';
document.body.appendChild(notice);
let noticeTimer = 0;

function hideNotice() {
    clearTimeout(noticeTimer);
    notice.hidden = true;
}

function showNotice(project) {
    notice.innerHTML = `<i class="hn hn-exclamation-triangle-solid" aria-hidden="true"></i><span><b>${project.title}</b> is a Windows PC build and can't run here. Open this page on a desktop computer to play it.</span>`;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(hideNotice, 7000);
}

notice.addEventListener('click', hideNotice);
addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideNotice();
});

function syncTheme() {
    try {
        const settings = JSON.parse(localStorage.getItem('voidwave.desktop'));
        document.body.dataset.accent = settings?.accent === 'ice' ? 'ice' : 'mint';
        document.body.classList.toggle('reduce-motion', settings?.motion === false);
    } catch { }
}

function openProject(index) {
    const project = experimentData[index];
    if (!project || project.external) return;
    activeIndex = index;
    const frame = document.createElement('iframe');
    frame.title = project.title;
    frame.src = project.src;
    frame.allow = 'autoplay; fullscreen; gamepad';
    frame.addEventListener('load', () => {
        if (activeIndex === index) statusText.textContent = project.detail;
    });
    view.replaceChildren(frame);
    view.hidden = false;
    library.hidden = true;
    backButton.disabled = false;
    currentProject.textContent = `/ ${project.title}`;
    openLink.href = project.url || project.src;
    openLink.hidden = false;
    statusText.textContent = `Opening ${project.title}...`;
    backButton.focus();
}

function closeProject() {
    const previousIndex = activeIndex;
    activeIndex = null;
    view.replaceChildren();
    view.hidden = true;
    library.hidden = false;
    backButton.disabled = true;
    openLink.hidden = true;
    openLink.removeAttribute('href');
    currentProject.textContent = '';
    statusText.textContent = 'voidwave / experiments';
    if (previousIndex !== null) filesContainer.children[previousIndex]?.focus();
}

experimentData.forEach((project, index) => {
    const locked = Boolean(project.pcOnly) && pcOnlyBlocked;
    const tile = document.createElement(project.external ? 'a' : 'button');
    tile.className = 'experiment-app';
    if (project.external) {
        tile.href = project.external;
        tile.target = '_blank';
        tile.rel = 'noopener noreferrer';
        tile.setAttribute('aria-label', `${project.title} (opens in a new tab)`);
        tile.title = 'Open on itch.io';
    } else {
        tile.type = 'button';
        tile.addEventListener('click', () => (locked ? showNotice(project) : openProject(index)));
    }
    if (project.pcOnly) {
        tile.title = 'Windows PC only';
        if (locked) tile.setAttribute('aria-label', `${project.title} — Windows PC only, not available on this device`);
    }
    const artwork = project.image ? `<img src="${project.image}" alt="" width="42" height="42">` : `<i class="hn hn-${project.icon}" aria-hidden="true"></i>`;
    const badge = project.pcOnly ? '<span class="app-badge" aria-hidden="true">PC ONLY</span>' : '';
    tile.innerHTML = `<span class="app-tile ${project.color}">${artwork}${badge}${project.external ? '<i class="hn hn-external-link app-shortcut" aria-hidden="true"></i>' : ''}</span><span class="experiment-name">${project.title}</span><span class="experiment-meta">${project.detail}</span>`;
    filesContainer.appendChild(tile);
});

document.getElementById('project-count').textContent = `${experimentData.length} APPS`;
backButton.addEventListener('click', closeProject);
addEventListener('storage', syncTheme);
syncTheme();