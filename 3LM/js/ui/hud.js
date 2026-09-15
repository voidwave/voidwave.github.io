// واجهة اللاعب: القلوب والمفاتيح والنقاط والخريطة والتنبيهات
// HUD: hearts, keys, score, zone name, minimap, toasts.
import { TEXT, ZONES, LIBRARY } from '../config.js';
import { state, currentRoom, gateOpen } from '../game/state.js';
import { iconDataUrl } from '../render/sprites.js';

let els = {};
let icons = {};
const cache = { hearts: -1, keys: -1, score: -1, zone: '', mapOpen: false };
let mapOpen = false;

export function mountHUD() {
    els = {
        hearts: document.getElementById('hearts'),
        keys: document.getElementById('keysVal'),
        score: document.getElementById('scoreVal'),
        zone: document.getElementById('zoneName'),
        mapPanel: document.getElementById('mapPanel'),
        mapCanvas: document.getElementById('mapCanvas'),
        mapBtn: document.getElementById('mapBtn'),
        muteBtn: document.getElementById('muteBtn'),
        toasts: document.getElementById('toasts'),
    };
    icons = {
        heart: iconDataUrl('icon_heart', 3),
        heartEmpty: iconDataUrl('icon_heart_empty', 3),
        key: iconDataUrl('icon_key', 3),
        gem: iconDataUrl('icon_gem', 3),
    };
    document.getElementById('keyIcon').src = icons.key;
    document.getElementById('scoreIcon').src = icons.gem;
    buildHearts(3);
}

function buildHearts(max) {
    els.hearts.innerHTML = '';
    for (let i = 0; i < max; i++) {
        const img = document.createElement('img');
        img.src = icons.heart;
        img.alt = '';
        els.hearts.appendChild(img);
    }
}

/** تحديث قيم الواجهة (عند التغير فقط) — update HUD values when they change */
export function update(force = false) {
    if (!state.world) return;
    const room = currentRoom();
    const zoneName = room.zoneIndex < ZONES.length ? ZONES[room.zoneIndex].name : LIBRARY.name;
    if (force || cache.hearts !== state.hearts) {
        cache.hearts = state.hearts;
        const max = Math.max(3, state.hearts);
        if (els.hearts.children.length !== max) buildHearts(max);
        [...els.hearts.children].forEach((img, i) => {
            img.src = i < state.hearts ? icons.heart : icons.heartEmpty;
            img.classList.toggle('lost', i >= state.hearts);
        });
    }
    if (force || cache.keys !== state.keys) { cache.keys = state.keys; els.keys.textContent = state.keys; }
    if (force || cache.score !== state.score) { cache.score = state.score; els.score.textContent = state.score; }
    if (force || cache.zone !== zoneName) { cache.zone = zoneName; els.zone.textContent = zoneName; }
    if (mapOpen) drawMinimap();
}

/** تنبيه صغير يختفي وحده — small auto-dismissing toast */
export function toast(msg, ms = 2600) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    els.toasts.appendChild(div);
    setTimeout(() => div.classList.add('out'), ms - 350);
    setTimeout(() => div.remove(), ms);
}

export function toggleMap(force) {
    mapOpen = force ?? !mapOpen;
    els.mapPanel.classList.toggle('hidden', !mapOpen);
    els.mapBtn.classList.toggle('active', mapOpen);
    if (mapOpen) drawMinimap();
}

export const isMapOpen = () => mapOpen;

/** رسم الخريطة المصغرة — minimap of discovered rooms */
export function drawMinimap() {
    const world = state.world;
    const cv = els.mapCanvas;
    const cell = 8;
    cv.width = Math.max(24, (world.mapW + 1) * cell);
    cv.height = Math.max(24, (world.mapH + 1) * cell);
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!world) return;

    for (const room of world.rooms.values()) {
        if (!state.discovered.has(room.id)) continue;
        const x = (room.mapCol + 1) * cell;
        const y = (world.mapH - room.mapRow) * cell;
        const pal = room.pal;
        ctx.fillStyle = pal.floorDark;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        ctx.strokeStyle = pal.wallTop;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        ctx.globalAlpha = 1;

        if (room.id === state.roomId) {
            ctx.strokeStyle = '#ffd76a';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, cell, cell);
            ctx.lineWidth = 1;
        }
        if (room.kind === 'library') {
            ctx.fillStyle = '#ffd76a';
            ctx.fillRect(x + cell / 2 - 1, y + cell / 2 - 1, 3, 3);
        } else if (room.npc && !room.npc.done) {
            ctx.fillStyle = '#ffb03a';
            ctx.fillRect(x + cell / 2 - 2, y + cell / 2 - 2, 4, 4);
        } else if (room.chest && room.chest.opened) {
            ctx.fillStyle = '#7ac86a';
            ctx.fillRect(x + cell / 2 - 2, y + cell / 2 - 2, 3, 3);
        } else if (room.chest && !room.chest.opened) {
            ctx.fillStyle = '#d9a441';
            ctx.fillRect(x + cell / 2 - 2, y + cell / 2 - 2, 3, 3);
        } else if (room.npc && room.npc.done) {
            ctx.fillStyle = '#7ac86a';
            ctx.fillRect(x + cell / 2 - 1, y + cell / 2 - 1, 3, 3);
        }
        // أقفال البوابات — gate locks
        for (const door of room.doors) {
            if (!door.gate) continue;
            ctx.fillStyle = gateOpen(door.gate) ? '#7ac86a' : '#e05454';
            const gx = door.edge === 'left' ? x : door.edge === 'right' ? x + cell - 3 : x + cell / 2 - 1;
            const gy = door.edge === 'top' ? y : door.edge === 'bottom' ? y + cell - 3 : y + cell / 2 - 1;
            ctx.fillRect(gx, gy, 3, 3);
        }
    }
}

export function setMuteIcon(muted) {
    if (els.muteBtn) els.muteBtn.textContent = muted ? '🔇' : '🔊';
}

export function hideMapOnMove() {
    if (mapOpen) toggleMap(false);
}
