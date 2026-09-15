const projectLibraries = {
    archive: [
        { title: 'YouTube Projects', detail: 'Video archive', icon: 'youtube', color: 'coral', src: 'youtube_projects.html' },
        { title: 'Experiments', detail: 'Demos & side projects', icon: 'code', color: 'blue', src: 'demos_projects.html' }
    ],
    youtube: [
        { title: 'AI Prerendered Demo', detail: '2024', icon: 'image', color: 'blue', video: 'pMM3PzSojqk' },
        { title: 'Prime Jinn', detail: '2017', icon: 'robot', color: 'gold', video: 'f48cQPfXy3I' },
        { title: 'Project Voxel', detail: '2016', icon: 'grid', color: 'mint', video: 'ypSCp02pHBM' },
        { title: 'FPS: Rocket Jump', detail: '2022', icon: 'arrow-up', color: 'coral', video: 'lkFQ3f5EQmM' },
        { title: '3D File Explorer', detail: '2020', icon: 'folder-open', color: 'gold', video: 'PK6jNEWV0NA' }
    ]
};

const collection = document.body.dataset.library;
const projects = projectLibraries[collection];
const library = document.getElementById('experiment-library');
const files = document.getElementById('Files');
const viewer = document.getElementById('experiment-view');
const back = document.getElementById('backButton');
const external = document.getElementById('open-project');
const breadcrumb = document.getElementById('current-project');
const status = document.getElementById('experiment-status');
const idleStatus = status.textContent;
let selectedIndex = null;

function syncLibraryTheme() {
    try {
        const preferences = JSON.parse(localStorage.getItem('voidwave.desktop'));
        document.body.dataset.accent = preferences?.accent === 'ice' ? 'ice' : 'mint';
        document.body.classList.toggle('reduce-motion', preferences?.motion === false);
    } catch { }
}

function openLibraryProject(index) {
    const project = projects[index];
    if (!project) return;
    selectedIndex = index;
    const frame = document.createElement('iframe');
    frame.title = project.title;
    frame.src = project.video ? `https://www.youtube.com/embed/${project.video}?rel=0` : project.src;
    frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; gamepad';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    viewer.replaceChildren(frame);
    viewer.hidden = false;
    library.hidden = true;
    back.disabled = false;
    breadcrumb.textContent = `/ ${project.title}`;
    status.textContent = project.detail;
    external.href = project.video ? `https://www.youtube.com/watch?v=${project.video}` : project.src;
    external.hidden = false;
    back.focus();
}

// YouTube stills, best resolution first; each size falls back to the next on error.
const thumbnailSizes = ['maxresdefault', 'sddefault', 'hqdefault'];

function thumbnailSources(video) {
    return thumbnailSizes.map(size => `https://i.ytimg.com/vi/${video}/${size}.jpg`);
}

projects.forEach((project, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'experiment-app';
    const icon = `<i class="hn hn-${project.icon}" aria-hidden="true"></i>`;
    const sources = project.video ? thumbnailSources(project.video) : [];
    const artwork = sources.length
        ? `${icon}<img class="app-thumb" src="${sources[0]}" alt="" loading="lazy" decoding="async"><i class="hn hn-play app-play" aria-hidden="true"></i>`
        : icon;
    button.innerHTML = `<span class="app-tile ${project.color}">${artwork}</span><span class="experiment-name">${project.title}</span><span class="experiment-meta">${project.detail}</span>`;
    const thumb = button.querySelector('.app-thumb');
    if (thumb) {
        let attempt = 0;
        let settled = false;
        // YouTube answers missing sizes with a 404 *page* that still decodes as a
        // 120x90 placeholder image, so onerror alone never fires. Treat that size
        // (and a decode failure) as a miss and drop to the next resolution.
        const useNextSource = () => {
            if (settled) return;
            attempt += 1;
            if (attempt < sources.length) thumb.src = sources[attempt];
            else {
                settled = true;
                thumb.remove(); // reveal the icon underneath
            }
        };
        thumb.addEventListener('error', useNextSource);
        thumb.addEventListener('load', () => {
            if (settled) return;
            if (thumb.naturalWidth > 120) settled = true;
            else useNextSource();
        });
    }
    button.addEventListener('click', () => openLibraryProject(index));
    files.appendChild(button);
});

back.addEventListener('click', () => {
    viewer.replaceChildren();
    viewer.hidden = true;
    library.hidden = false;
    back.disabled = true;
    external.hidden = true;
    external.removeAttribute('href');
    breadcrumb.textContent = '';
    status.textContent = idleStatus;
    files.children[selectedIndex]?.focus();
    selectedIndex = null;
});

document.getElementById('project-count').textContent = `${projects.length} ${collection === 'archive' ? 'COLLECTIONS' : 'VIDEOS'}`;
addEventListener('storage', syncLibraryTheme);
syncLibraryTheme();