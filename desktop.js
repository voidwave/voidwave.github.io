const apps = [
    { id: 'portfolio', name: 'Portfolio', icon: 'folder-open', color: 'gold', description: 'Games & selected work' },
    { id: 'hydrogen', name: 'Hydrogen', icon: 'gamepad', color: 'mint', description: 'Hydrogen trailer', src: 'game-window.html?game=hydrogen', url: 'https://store.steampowered.com/app/1746820/' },
    { id: 'djinn', name: 'Djinn Scrolls', icon: 'magic', color: 'coral', description: 'Djinn Scrolls trailer', src: 'game-window.html?game=djinn', url: 'https://store.steampowered.com/app/4392620/DJINN_SCROLLS/' },
    { id: 'projects', name: 'Experiments', icon: 'flask', color: 'coral', description: 'Playable demos & projects', src: 'demos_projects.html' },
    { id: 'videos', name: 'Dev Videos', icon: 'youtube-play', color: 'coral', description: 'Development playlist', src: 'dev-videos.html', url: 'https://www.youtube.com/playlist?list=PLCyM3qNxv8UyJ2vV6gZb3smWyrJB5fnGq' },
    { id: 'gallery', name: 'Gallery', icon: 'picture-o', color: 'blue', description: 'Art & screenshots', src: 'gallery/index.html' },
    { id: 'terminal', name: 'Terminal', icon: 'terminal', color: 'graphite', description: 'majed@voidwave.com: ~' },
    { id: 'about', name: 'About Me', icon: 'user-o', color: 'mint', description: 'Majed Altaemi' },
    { id: 'settings', name: 'Settings', icon: 'sliders', color: 'graphite', description: 'Desktop appearance' },
    { id: 'archive', name: 'Project Archive', icon: 'folder', color: 'gold', description: 'All videos & demo projects', src: 'projects.html' },
    { id: 'twitter', name: 'Twitter / X', icon: 'twitter', color: 'blue', description: '@majedaltaemi', external: 'https://x.com/majedaltaemi' },
    { id: 'instagram', name: 'Instagram', icon: 'instagram', color: 'coral', description: '@majedaltaemi', external: 'https://www.instagram.com/majedaltaemi/' }
];

const mobileQuery = matchMedia('(max-width: 760px)');
const windowContainer = document.getElementById('window-container');
const launcher = document.getElementById('app-launcher');
const activitiesButton = document.getElementById('activities-button');
const appSearch = document.getElementById('app-search');
const dock = document.getElementById('dock');
const windows = new Map();
const favorites = ['portfolio', 'projects', 'videos', 'gallery', 'terminal', 'about'];
let activeApp = null;
let preferences = { wallpaper: 'dither', wallpaperVersion: 2, accent: 'mint', motion: true, language: 'en' };

try {
    const stored = JSON.parse(localStorage.getItem('voidwave.desktop'));
    if (stored && typeof stored === 'object') {
        preferences = { ...preferences, ...stored };
        if (!stored.wallpaperVersion && stored.wallpaper === 'world') preferences.wallpaper = 'dither';
        preferences.wallpaperVersion = 2;
    }
} catch { }

const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

function updateLiveWallpaper() {
    const wallpaper = document.querySelector('.wallpaper');
    const frame = wallpaper.querySelector('iframe');
    const enabled = preferences.wallpaper === 'dither' && !reducedMotionQuery.matches && !document.hidden;
    if (!enabled) {
        frame?.remove();
        return;
    }
    if (frame) return;
    const liveFrame = document.createElement('iframe');
    liveFrame.src = 'dither-wallpaper.html';
    liveFrame.title = 'Animated dither waves';
    liveFrame.tabIndex = -1;
    liveFrame.setAttribute('aria-hidden', 'true');
    wallpaper.appendChild(liveFrame);
}

function listenForMediaChange(query, listener) {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
    else query.addListener(listener);
}

listenForMediaChange(reducedMotionQuery, updateLiveWallpaper);
document.addEventListener('visibilitychange', updateLiveWallpaper);

function icon(name) {
    const names = {
        gamepad: 'robot', magic: 'sparkles', flask: 'code', 'youtube-play': 'youtube',
        'picture-o': 'image', terminal: 'code-block', 'user-o': 'user', sliders: 'cog',
        desktop: 'grid', 'th-large': 'grid', 'window-maximize': 'expand', 'window-restore': 'copy',
        'folder-open-o': 'folder-open', 'folder-o': 'folder', 'envelope-o': 'envelope',
        linux: 'code-block', 'level-down': 'arrow-right'
    };
    return `<i class="fa fa-${name} hn hn-${names[name] || name}" aria-hidden="true"></i>`;
}

function appButton(app, className = 'app-icon') {
    return `<button class="${className}" data-app="${app.id}" aria-label="${app.name}${app.external ? ' (opens in a new tab)' : ''}" title="${app.name}${app.external ? ' (new tab)' : ''}"><span class="app-tile ${app.color}">${icon(app.icon)}</span><span class="app-label">${app.name}</span>${app.external ? `<span class="external-mark">${icon('external-link')}</span>` : ''}</button>`;
}

function applyPreferences() {
    if (!['dither', 'world', 'grid'].includes(preferences.wallpaper)) preferences.wallpaper = 'dither';
    document.body.dataset.wallpaper = preferences.wallpaper;
    document.body.dataset.accent = preferences.accent === 'ice' ? 'ice' : 'mint';
    document.body.classList.toggle('reduce-motion', !preferences.motion);
    updateLiveWallpaper();
}

function savePreferences() {
    applyPreferences();
    try { localStorage.setItem('voidwave.desktop', JSON.stringify(preferences)); } catch { }
}

function applyLanguage() {
    preferences.language = preferences.language === 'ar' ? 'ar' : 'en';
    desktopLanguage.setLanguage(preferences.language);
    document.getElementById('language-select').value = preferences.language;
    desktopLanguage.localize(document.body);
    renderLauncher();
    renderDock();
    updateClock();
}

function renderLauncher() {
    const search = appSearch.value.trim().toLowerCase();
    const matches = apps.filter(app => `${app.name} ${app.description} ${desktopLanguage.text(app.name)} ${desktopLanguage.text(app.description)}`.toLowerCase().includes(search));
    document.getElementById('launcher-apps').innerHTML = matches.map(app => appButton(app, 'launcher-app')).join('');
    document.getElementById('app-count').textContent = preferences.language === 'ar' ? `التطبيقات: ${matches.length.toLocaleString('ar')}` : `${matches.length} apps`;
    document.getElementById('search-empty').hidden = matches.length > 0;
    desktopLanguage.localize(launcher);
}

function toggleLauncher(show = launcher.hidden) {
    launcher.hidden = !show;
    activitiesButton.setAttribute('aria-expanded', String(show));
    if (show) {
        appSearch.value = '';
        renderLauncher();
        appSearch.focus();
    }
}

function renderDock() {
    const ids = [...new Set([...favorites, ...windows.keys()])];
    dock.innerHTML = `<button class="dock-button show-desktop" data-action="home" title="Show desktop" aria-label="Show desktop">${icon('desktop')}<span class="dock-tooltip">Desktop</span></button><span class="dock-divider"></span>` + ids.map(id => {
        const app = apps.find(item => item.id === id);
        return `<button class="dock-button ${windows.has(id) ? 'running' : ''} ${activeApp === id ? 'active' : ''}" data-app="${id}" aria-label="${app.name}" title="${app.name}" aria-pressed="${activeApp === id}"><span class="app-tile ${app.color}">${icon(app.icon)}</span><span class="dock-tooltip">${app.name}</span></button>`;
    }).join('');
    desktopLanguage.localize(dock);
}

function focusWindow(id, moveFocus = true) {
    const appWindow = windows.get(id);
    if (!appWindow) return;
    activeApp = id;
    appWindow.hidden = false;
    const ordered = [...windows.values()].filter(element => element !== appWindow);
    ordered.sort((first, second) => Number(first.style.zIndex) - Number(second.style.zIndex));
    ordered.forEach((element, index) => {
        element.style.zIndex = index + 1;
        element.classList.remove('focused');
    });
    appWindow.style.zIndex = windows.size + 1;
    appWindow.classList.add('focused');
    if (moveFocus) appWindow.focus({ preventScroll: true });
    document.body.classList.add('app-open');
    renderDock();
}

function syncActiveWindow() {
    const visible = [...windows.entries()].filter(([, element]) => !element.hidden);
    visible.sort((first, second) => Number(second[1].style.zIndex) - Number(first[1].style.zIndex));
    if (visible.length) focusWindow(visible[0][0]);
    else {
        activeApp = null;
        document.body.classList.remove('app-open');
        renderDock();
        activitiesButton.focus({ preventScroll: true });
    }
}

function goHome() {
    toggleLauncher(false);
    if (mobileQuery.matches) closeOtherWindows();
    if (mobileQuery.matches && history.state?.voidwaveApp) {
        history.back();
        return;
    }
    windows.forEach(element => { element.hidden = true; });
    syncActiveWindow();
}

function closeWindow(id) {
    windows.get(id)?.remove();
    windows.delete(id);
    syncActiveWindow();
}

function closeOtherWindows(keepId) {
    windows.forEach((element, id) => {
        if (id === keepId) return;
        element.remove();
        windows.delete(id);
    });
    syncActiveWindow();
}

function setInitialBounds(element, id) {
    const width = Math.min(id === 'terminal' || id === 'settings' ? 620 : 920, innerWidth - 190);
    const height = Math.min(id === 'settings' ? 480 : 580, innerHeight - 265);
    const offset = (windows.size % 4) * 24;
    Object.assign(element.style, {
        width: `${Math.max(340, width)}px`, height: `${Math.max(290, height)}px`,
        left: `${Math.max(130, (innerWidth - width) / 2 + 35) + offset}px`,
        top: `${Math.min(190, Math.max(80, innerHeight * 0.22)) + offset}px`
    });
    clampWindow(element);
}

function clampWindow(element) {
    if (mobileQuery.matches || element.classList.contains('maximized')) return;
    const width = Math.min(parseFloat(element.style.width), innerWidth - 24);
    const height = Math.min(parseFloat(element.style.height), innerHeight - 140);
    element.style.width = `${Math.max(320, width)}px`;
    element.style.height = `${Math.max(200, height)}px`;
    element.style.left = `${Math.max(12, Math.min(parseFloat(element.style.left), innerWidth - width - 12))}px`;
    element.style.top = `${Math.max(48, Math.min(parseFloat(element.style.top), innerHeight - height - 88))}px`;
}

function toggleMaximize(element) {
    const maximized = element.classList.toggle('maximized');
    const button = element.querySelector('[data-window-action="maximize"]');
    button.innerHTML = icon(maximized ? 'window-restore' : 'window-maximize');
    button.title = maximized ? 'Restore window' : 'Maximize window';
    button.setAttribute('aria-label', button.title);
    desktopLanguage.localize(button);
    if (!maximized) clampWindow(element);
}

function portfolioContent() {
    return `<div class="file-manager">
        <nav class="file-sidebar" aria-label="Portfolio folders">
            <span class="sidebar-label">PLACES</span>
            <button class="selected" data-folder="all">${icon('home')}<span>Home</span></button>
            <button data-folder="games">${icon('gamepad')}<span>Games</span></button>
            <button data-folder="experiments">${icon('flask')}<span>Experiments</span></button>
            <button data-app="gallery">${icon('picture-o')}<span>Gallery</span></button>
            <span class="sidebar-label">PERSONAL</span>
            <button data-app="about">${icon('user-o')}<span>About me</span></button>
            <a href="mailto:majed@voidwave.com">${icon('envelope-o')}<span>Get in touch</span></a>
            <div class="sidebar-bottom">${icon('linux')}<span>majed@voidwave.com<br><small>personal workspace</small></span></div>
        </nav>
        <div class="file-main">
            <div class="file-path">${icon('folder-open-o')}<span>home <span class="muted">/</span> majed <span class="muted">/</span> <b id="folder-name">portfolio</b></span><span class="path-end">${icon('th-large')}</span></div>
            <div class="file-scroll">
                <div class="portfolio-intro"><span class="eyebrow">THE WORKSPACE OF</span><h2>Majed Altaemi<span class="accent">.</span></h2><p>Independent game developer. Making games and exploring what's possible.</p></div>
                <section data-category="games">
                    <div class="section-heading"><h3>Selected games</h3><span>02 ITEMS</span></div>
                    <div class="project-grid">
                        <button class="project-file" data-app="hydrogen"><div class="project-image"><img src="img/hydrogen-preview.jpg" alt="Hydrogen game main menu" loading="lazy"><span class="image-badge">${icon('steam')} STEAM</span></div><div class="project-detail"><div><h4>Hydrogen</h4><p>Game / PC</p></div>${icon('arrow-up')}</div></button>
                        <button class="project-file" data-app="djinn"><div class="project-image djinn-image"><img src="img/DS%20PIXEL%20LOGO.png" alt="Djinn Scrolls" loading="lazy"><span class="image-badge">${icon('steam')} STEAM</span></div><div class="project-detail"><div><h4>Djinn Scrolls</h4><p>Game / PC</p></div>${icon('external-link')}</div></button>
                    </div>
                </section>
                <section data-category="experiments">
                    <div class="section-heading"><h3>Beyond the games</h3><span>EXPLORE</span></div>
                    <div class="folder-grid"><button data-app="projects"><span class="small-tile blue">${icon('flask')}</span><span>Experiments<small>Demos & side projects</small></span>${icon('angle-right')}</button><button data-app="videos"><span class="small-tile coral">${icon('youtube-play')}</span><span>Dev Videos<small>Behind the builds</small></span>${icon('angle-right')}</button><button data-app="archive"><span class="small-tile gold">${icon('folder')}</span><span>Project Archive<small>All videos & demos</small></span>${icon('angle-right')}</button></div>
                </section>
            </div>
            <footer class="file-status"><span>Games, experiments & other worlds</span><span>${icon('folder-o')} portfolio</span></footer>
        </div>
    </div>`;
}

function aboutContent() {
    return `<article class="about-content"><img class="about-logo" src="img/majedphoto.png" alt="Majed Altaemi"><span class="eyebrow">THE PERSON BEHIND VOIDWAVE</span><h2>Hi, I'm Majed<span class="accent">.</span></h2><p>I'm an independent game developer. This is my corner of the internet: games, playable experiments, and the things I make along the way.</p><div class="about-facts"><span>NAME<b>Majed Altaemi</b></span><span>FOCUS<b>Game development</b></span></div><a class="primary-action" href="mailto:majed@voidwave.com">${icon('envelope-o')} majed@voidwave.com</a><div class="social-links"><a href="https://store.steampowered.com/app/1746820/" target="_blank" rel="noopener noreferrer">Steam ${icon('external-link')}</a><a href="https://voidwave.itch.io" target="_blank" rel="noopener noreferrer">itch.io ${icon('external-link')}</a><a href="https://x.com/majedaltaemi" target="_blank" rel="noopener noreferrer">Twitter / X ${icon('external-link')}</a><a href="https://www.instagram.com/majedaltaemi/" target="_blank" rel="noopener noreferrer">Instagram ${icon('external-link')}</a><a href="https://www.youtube.com/@majedemon" target="_blank" rel="noopener noreferrer">YouTube ${icon('external-link')}</a><a href="https://www.linkedin.com/in/majed-altaemi/" target="_blank" rel="noopener noreferrer">LinkedIn ${icon('external-link')}</a><a href="https://www.twitch.tv/voidwave" target="_blank" rel="noopener noreferrer">Twitch ${icon('external-link')}</a></div></article>`;
}

function settingsContent() {
    return `<div class="settings-content"><span class="eyebrow">PERSONALIZE YOUR WORKSPACE</span><h2>Appearance</h2><fieldset><legend>Wallpaper</legend><div class="wallpaper-options"><label><input type="radio" name="wallpaper" value="dither" ${preferences.wallpaper === 'dither' ? 'checked' : ''}><span class="wallpaper-preview dither-preview">${icon('sparkles')}</span>Dither Waves</label><label><input type="radio" name="wallpaper" value="world" ${preferences.wallpaper === 'world' ? 'checked' : ''}><span class="wallpaper-preview world-preview"></span>Otherworld</label><label><input type="radio" name="wallpaper" value="grid" ${preferences.wallpaper === 'grid' ? 'checked' : ''}><span class="wallpaper-preview grid-preview"></span>Graphite</label></div></fieldset><fieldset><legend>Accent color</legend><div class="swatch-options"><label title="Mint"><input type="radio" name="accent" value="mint" ${preferences.accent !== 'ice' ? 'checked' : ''}><span class="swatch mint"></span>Mint</label><label title="Ice"><input type="radio" name="accent" value="ice" ${preferences.accent === 'ice' ? 'checked' : ''}><span class="swatch blue"></span>Ice</label></div></fieldset><label class="setting-toggle"><span>Window animations</span><input type="checkbox" name="motion" ${preferences.motion ? 'checked' : ''}></label></div>`;
}

function terminalContent() {
    return `<div class="terminal-content"><div class="terminal-output" role="log" aria-label="Terminal output" aria-live="polite"><div class="terminal-brand">voidwave<span>.</span></div><p>Majed Altaemi / Independent game developer</p><p class="muted">${new Date().getFullYear()} &middot; personal workspace</p><p><span class="accent">~</span> Games. Experiments. Other worlds.</p></div><form class="terminal-form"><label for="terminal-command"><span class="accent">visitor@voidwave</span>:~$</label><input id="terminal-command" name="command" aria-label="Terminal command" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="submit" title="Run command" aria-label="Run command">${icon('level-down')}</button></form></div>`;
}

function initializeTerminal(element) {
    const form = element.querySelector('.terminal-form');
    const input = form.elements.command;
    const output = element.querySelector('.terminal-output');
    const commands = ['help', 'about', 'projects', 'open', 'date', 'clear', 'whoami'];
    const commandHistory = [];
    let historyIndex = 0;
    function print(text) {
        const line = document.createElement('p');
        line.textContent = text;
        output.appendChild(line);
    }
    form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        commandHistory.push(value);
        historyIndex = commandHistory.length;
        print(`visitor@voidwave:~$ ${value}`);
        const [command, ...argumentsList] = value.toLowerCase().split(/\s+/);
        if (command === 'clear') output.replaceChildren();
        else if (command === 'help') print('help, about, projects, open <app>, date, whoami, clear');
        else if (command === 'about') print('Majed Altaemi. Independent game developer. majed@voidwave.com');
        else if (command === 'whoami') print('visitor@voidwave');
        else if (command === 'date') print(new Date().toLocaleString());
        else if (command === 'projects') print(apps.filter(app => app.id !== 'terminal').map(app => app.id).join('  '));
        else if (command === 'open') {
            const target = apps.find(app => app.id === argumentsList[0]);
            if (target) openApp(target.id);
            else print('App not found. Run projects for available apps.');
        } else print(`Command not found: ${command}. Run help for commands.`);
        input.value = '';
        input.scrollIntoView({ block: 'nearest' });
    });
    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
            input.value = commandHistory[historyIndex] || '';
        } else if (event.key === 'Tab' && input.value) {
            const choices = input.value.startsWith('open ') ? apps.map(app => `open ${app.id}`) : commands;
            const matches = choices.filter(command => command.startsWith(input.value));
            if (matches.length === 1) { event.preventDefault(); input.value = matches[0]; }
        }
    });
}

function createWindow(app) {
    const element = document.createElement('section');
    element.className = 'app-window';
    element.dataset.appId = app.id;
    element.tabIndex = -1;
    element.setAttribute('aria-label', app.name);
    const content = app.id === 'portfolio' ? portfolioContent() : app.id === 'about' ? aboutContent() : app.id === 'settings' ? settingsContent() : app.id === 'terminal' ? terminalContent() : `<div class="embed-view"><div class="embed-toolbar"><span>${app.description}</span><a href="${app.url || app.src}" target="_blank" rel="noopener noreferrer" title="Open in a new tab">Open in browser ${icon('external-link')}</a></div><iframe src="${app.src}" title="${app.name}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    element.innerHTML = `<header class="window-titlebar"><button class="mobile-back window-control" data-window-action="back" title="Back" aria-label="Back">${icon('arrow-left')}</button><div class="window-title">${icon(app.icon)}<span>${app.name}</span></div><div class="window-controls"><button class="window-control" data-window-action="minimize" title="Minimize window" aria-label="Minimize window">${icon('minus')}</button><button class="window-control" data-window-action="maximize" title="Maximize window" aria-label="Maximize window">${icon('window-maximize')}</button><button class="window-control close-control" data-window-action="close" title="Close window" aria-label="Close window">${icon('times')}</button></div></header><div class="window-body">${content}</div><div class="resize-handle" aria-hidden="true"></div>`;
    desktopLanguage.localize(element);
    windowContainer.appendChild(element);
    setInitialBounds(element, app.id);
    element.addEventListener('pointerdown', () => focusWindow(app.id, false));
    element.addEventListener('focusin', () => {
        if (activeApp !== app.id) focusWindow(app.id, false);
    });
    element.querySelector('.window-titlebar').addEventListener('dblclick', event => {
        if (!mobileQuery.matches && !event.target.closest('button')) toggleMaximize(element);
    });
    element.querySelector('.window-titlebar').addEventListener('pointerdown', event => startWindowGesture(event, element, false));
    element.querySelector('.resize-handle').addEventListener('pointerdown', event => startWindowGesture(event, element, true));
    element.addEventListener('click', event => {
        const action = event.target.closest('[data-window-action]')?.dataset.windowAction;
        if (action === 'close') closeWindow(app.id);
        if (action === 'minimize') { element.hidden = true; syncActiveWindow(); }
        if (action === 'maximize') toggleMaximize(element);
        if (action === 'back') goHome();
        const folderButton = event.target.closest('[data-folder]');
        if (folderButton) {
            const folder = folderButton.dataset.folder;
            element.querySelectorAll('[data-folder]').forEach(button => button.classList.toggle('selected', button === folderButton));
            element.querySelectorAll('[data-category]').forEach(section => { section.hidden = folder !== 'all' && section.dataset.category !== folder; });
            element.querySelector('#folder-name').textContent = folder === 'all' ? 'portfolio' : folder;
        }
    });
    if (app.id === 'terminal') initializeTerminal(element);
    if (app.id === 'settings') element.addEventListener('change', event => {
        const input = event.target;
        if (input.name === 'wallpaper' || input.name === 'accent') preferences[input.name] = input.value;
        if (input.name === 'motion') preferences.motion = input.checked;
        savePreferences();
    });
    return element;
}

function openApp(id, recordHistory = true) {
    const app = apps.find(item => item.id === id);
    if (!app) return;
    toggleLauncher(false);
    if (app.external) {
        if (mobileQuery.matches) goHome();
        window.open(app.external, '_blank', 'noopener,noreferrer');
        return;
    }
    if (mobileQuery.matches) {
        closeOtherWindows(id);
        if (recordHistory) {
            try {
                const method = history.state?.voidwaveApp ? 'replaceState' : 'pushState';
                history[method]({ voidwaveApp: id }, '', `#${id}`);
            } catch { }
        }
    }
    if (!windows.has(id)) windows.set(id, createWindow(app));
    focusWindow(id);
}

function startWindowGesture(event, element, resizing) {
    if (mobileQuery.matches || event.button !== 0 || event.target.closest('button') || element.classList.contains('maximized')) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const origin = { x: event.clientX, y: event.clientY, left: element.offsetLeft, top: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight };
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add('window-gesture');
    function move(pointer) {
        const deltaX = pointer.clientX - origin.x;
        const deltaY = pointer.clientY - origin.y;
        if (resizing) {
            element.style.width = `${Math.max(360, Math.min(origin.width + deltaX, innerWidth - origin.left - 12))}px`;
            element.style.height = `${Math.max(240, Math.min(origin.height + deltaY, innerHeight - origin.top - 88))}px`;
        } else {
            element.style.left = `${Math.max(12, Math.min(origin.left + deltaX, innerWidth - origin.width - 12))}px`;
            element.style.top = `${Math.max(48, Math.min(origin.top + deltaY, innerHeight - origin.height - 88))}px`;
        }
    }
    function finish() {
        document.body.classList.remove('window-gesture');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', finish);
        handle.removeEventListener('pointercancel', finish);
        handle.removeEventListener('lostpointercapture', finish);
    }
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('lostpointercapture', finish);
}

function updateClock() {
    const now = new Date();
    const locale = preferences.language === 'ar' ? 'ar' : 'en';
    const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
    const panelClock = document.getElementById('panel-clock');
    panelClock.textContent = `${now.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}  ${time}`;
    panelClock.dateTime = now.toISOString();
    document.getElementById('mobile-time').textContent = time;
    document.getElementById('mobile-date').textContent = now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

document.getElementById('desktop-icons').innerHTML = apps.filter(app => !['settings', 'archive', 'twitter', 'instagram'].includes(app.id)).map(app => appButton(app)).join('');
document.addEventListener('click', event => {
    const appButtonElement = event.target.closest('[data-app]');
    if (appButtonElement) {
        const id = appButtonElement.dataset.app;
        if (!mobileQuery.matches && appButtonElement.closest('#dock') && activeApp === id && windows.has(id)) {
            windows.get(id).hidden = true;
            syncActiveWindow();
        } else openApp(id);
    }
    if (event.target.closest('[data-action="home"]')) goHome();
    if (!launcher.hidden && !event.target.closest('#app-launcher, #activities-button')) toggleLauncher(false);
});
activitiesButton.addEventListener('click', () => toggleLauncher());
document.getElementById('language-select').addEventListener('change', event => {
    preferences.language = event.target.value;
    savePreferences();
    applyLanguage();
});
document.getElementById('settings-button').addEventListener('click', () => openApp('settings'));
appSearch.addEventListener('input', renderLauncher);
appSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        const firstMatch = document.querySelector('#launcher-apps [data-app]');
        if (firstMatch) openApp(firstMatch.dataset.app);
    }
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !launcher.hidden) { toggleLauncher(false); activitiesButton.focus(); }
});
addEventListener('popstate', () => {
    if (mobileQuery.matches) closeOtherWindows(history.state?.voidwaveApp);
    else windows.forEach(element => { element.hidden = true; });
    if (history.state?.voidwaveApp) openApp(history.state.voidwaveApp, false);
    else syncActiveWindow();
});
addEventListener('resize', () => windows.forEach(clampWindow));
listenForMediaChange(mobileQuery, () => {
    toggleLauncher(false);
    if (mobileQuery.matches) closeOtherWindows(activeApp);
    windows.forEach(clampWindow);
    syncActiveWindow();
});

applyPreferences();
applyLanguage();
setInterval(updateClock, 1000);
const linkedApp = location.hash.slice(1);
if (apps.some(app => app.id === linkedApp && !app.external)) openApp(linkedApp);
else if (!mobileQuery.matches) openApp('portfolio');