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

projects.forEach((project, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'experiment-app';
    button.innerHTML = `<span class="app-tile ${project.color}"><i class="hn hn-${project.icon}" aria-hidden="true"></i></span><span class="experiment-name">${project.title}</span><span class="experiment-meta">${project.detail}</span>`;
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