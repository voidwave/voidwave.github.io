// العرض: يرسم الغرفة الحالية والكيانات والجزيئات والانتقالات
// Renderer: draws the current room, y-sorted entities, glows, markers, particles.
import { VIEW } from '../config.js';
import { getRoomCanvas, doorRect, doorInsidePoint } from './rooms.js';
import { drawSprite, spriteInfo } from './sprites.js';
import { state, currentRoom, gateOpen } from '../game/state.js';

let glowCanvas = null;
function glowSprite() {
    if (glowCanvas) return glowCanvas;
    glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const c = glowCanvas.getContext('2d');
    const g = c.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,216,130,0.5)');
    g.addColorStop(0.45, 'rgba(255,190,90,0.16)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return glowCanvas;
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

function playerSpriteName() {
    const p = state.player;
    const step = p.moving ? Math.floor(p.walkPhase) % 2 : 0;
    if (p.dir === 'up') return step ? 'p_up1' : 'p_up0';
    if (p.dir === 'down') return step ? 'p_down1' : 'p_down0';
    return step ? 'p_side1' : 'p_side0';
}

function drawShadow(ctx, x, y, w = 12) {
    ctx.fillStyle = 'rgba(20,14,30,0.28)';
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), w, 2);
    ctx.fillRect(Math.round(x - w / 2 + 2), Math.round(y), w - 4, 1);
}

/** الأبواب الديناميكية (البوابات) — dynamic gate doors */
function drawGates(ctx, room, ox, oy) {
    for (const door of room.doors) {
        if (!door.gate) continue;
        const r = doorRect(door.edge, door.index);
        const horizontal = door.edge === 'top' || door.edge === 'bottom';
        const open = gateOpen(door.gate);
        const name = open ? (horizontal ? 'door_h' : 'door_v') : (horizontal ? 'gate_h' : 'gate_v');
        ctx.drawImage(spriteInfo(name).canvas, r.x + ox, r.y + oy);
    }
}

/** توهج المصابيح والمواقد — pulsing glows for lit props */
function drawGlows(ctx, room, ox, oy, now) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of room.props) {
        const info = spriteInfo(p.name);
        if (!info?.glow) continue;
        const g = glowSprite();
        const gx = p.x - info.w / 2 + info.glow[0];
        const gy = p.y - info.h + info.glow[1];
        const pulse = 0.72 + Math.sin(now * 3 + p.x) * 0.12;
        const size = 26 * pulse;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(g, Math.round(gx + ox - size / 2), Math.round(gy + oy - size / 2), size, size);
    }
    ctx.restore();
}

function drawEntities(ctx, room, ox, oy, now) {
    const drawables = [];
    if (room.chest) {
        const c = room.chest;
        drawables.push({ y: c.y, draw: () => { drawShadow(ctx, c.x + ox, c.y + oy); drawSprite(ctx, c.opened ? 'chest_open' : 'chest_closed', c.x + ox, c.y + oy); } });
    }
    if (room.npc) {
        const n = room.npc;
        const bob = n.done ? 0 : Math.sin(now * 2.4 + n.x) > 0.65 ? 1 : 0;
        drawables.push({ y: n.y, draw: () => { drawShadow(ctx, n.x + ox, n.y + oy, 14); drawSprite(ctx, n.sprite, n.x + ox, n.y + oy + bob); if (n.done) drawCheck(ctx, n.x + ox + 8, n.y + oy - 18 + bob); } });
    }
    // اللاعب (يُرسم أثناء الانتقال في مكان آخر)
    if (state.phase !== 'transition') {
        const p = state.player;
        drawables.push({ y: p.y, draw: () => { drawShadow(ctx, p.x + ox, p.y + oy); drawSprite(ctx, playerSpriteName(), p.x + ox, p.y + oy, p.dir === 'right'); } });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();
}

/** علامة صغيرة فوق من أجاب — tiny check on solved NPCs */
function drawCheck(ctx, x, y) {
    ctx.fillStyle = '#7ac86a';
    ctx.fillRect(x - 1, y + 2, 1, 3);
    ctx.fillRect(x, y + 3, 1, 3);
    ctx.fillRect(x + 1, y + 1, 1, 3);
    ctx.fillRect(x + 2, y, 1, 3);
}

/** علامة التفاعل النابضة — bouncing interaction marker */
function drawMarkers(ctx, interact, now) {
    if (!interact) return;
    const bounce = Math.round(Math.sin(now * 4) * 2);
    const y = interact.y - 26 + bounce;
    const name = interact.type === 'chest' ? 'marker_open'
        : interact.type === 'gate' ? 'marker_lock'
            : interact.type === 'npcDone' ? null : 'marker_talk';
    if (!name) return;
    ctx.drawImage(spriteInfo(name).canvas, Math.round(interact.x - spriteInfo(name).w / 2), Math.round(y - spriteInfo(name).h));
}

function drawParticles(ctx, ox, oy) {
    for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x + ox), Math.round(p.y + oy), p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

/** الإطار الكامل — draw one frame */
export function render(ctx, interact, now) {
    ctx.fillStyle = '#141020';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    if (state.transition) {
        const tr = state.transition;
        const p = easeInOut(Math.min(1, tr.t / tr.duration));
        const from = state.world.rooms.get(tr.fromRoomId);
        const to = state.world.rooms.get(tr.toRoomId);
        const H = VIEW.height, Wd = VIEW.width;
        let f = [0, 0], t = [0, 0];
        if (tr.door.edge === 'top') { f = [0, p * H]; t = [0, p * H - H]; }
        else if (tr.door.edge === 'bottom') { f = [0, -p * H]; t = [0, -p * H + H]; }
        else if (tr.door.edge === 'left') { f = [p * Wd, 0]; t = [p * Wd - Wd, 0]; }
        else { f = [-p * Wd, 0]; t = [-p * Wd + Wd, 0]; }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, VIEW.width, VIEW.height);
        ctx.clip();
        ctx.drawImage(getRoomCanvas(from), f[0], f[1]);
        ctx.drawImage(getRoomCanvas(to), t[0], t[1]);
        drawGates(ctx, from, f[0], f[1]);
        drawGates(ctx, to, t[0], t[1]);
        // اللاعب ينتقل بسلاسة من باب الغرفة الحالية إلى باب الغرفة الجديدة
        const fromPt = doorInsidePoint(tr.door.edge, tr.door.index);
        const back = to.doors.find((d) => d.target === from.id);
        const toPt = back ? doorInsidePoint(back.edge, back.index) : fromPt;
        const px = fromPt.x + (toPt.x - fromPt.x) * p;
        const py = fromPt.y + (toPt.y - fromPt.y) * p;
        // قاعدة رسم الجانب تنظر لليسار، والنسخة المعكوسة تُستخدم لليمين
        drawSprite(ctx, playerSpriteName(), px, py, state.player.dir === 'right');
        ctx.restore();
        return;
    }

    const room = currentRoom();
    ctx.drawImage(getRoomCanvas(room), 0, 0);
    drawGates(ctx, room, 0, 0);
    drawEntities(ctx, room, 0, 0, now);
    drawGlows(ctx, room, 0, 0, now);
    drawParticles(ctx, 0, 0);
    drawMarkers(ctx, interact, now);
}
