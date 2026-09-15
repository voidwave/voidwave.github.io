// بناء خلفية الغرفة وتخزينها مؤقتًا — room background painting + caching.
// كل غرفة تُرسم مرة واحدة على لوحة مستقلة ثم تُعاد استخدامها (أداء عالٍ).
import { VIEW } from '../config.js';
import { createRng } from '../util/rng.js';
import { drawSprite, spriteInfo } from './sprites.js';

export const INT = {
    x: VIEW.wall,
    y: VIEW.wall,
    w: VIEW.width - VIEW.wall * 2,
    h: VIEW.height - VIEW.wall * 2,
    cols: (VIEW.width - VIEW.wall * 2) / VIEW.tile, // 10
    rows: (VIEW.height - VIEW.wall * 2) / VIEW.tile, // 14
};

const T = VIEW.tile;
const W = VIEW.wall;

/** مستطيل فتحة الباب في حلقة الجدار — door gap rect */
export function doorRect(edge, idx) {
    switch (edge) {
        case 'top': return { x: W + idx * T, y: 0, w: T, h: W };
        case 'bottom': return { x: W + idx * T, y: VIEW.height - W, w: T, h: W };
        case 'left': return { x: 0, y: W + idx * T, w: W, h: T };
        case 'right': return { x: VIEW.width - W, y: W + idx * T, w: W, h: T };
    }
    return { x: 0, y: 0, w: 0, h: 0 };
}

/** نقطة داخل الغرفة أمام الباب — spot just inside the room in front of a door */
export function doorInsidePoint(edge, idx) {
    switch (edge) {
        case 'top': return { x: W + idx * T + T / 2, y: W + T * 1.4 };
        case 'bottom': return { x: W + idx * T + T / 2, y: VIEW.height - W - T * 1.4 };
        case 'left': return { x: W + T * 1.4, y: W + idx * T + T / 2 };
        case 'right': return { x: VIEW.width - W - T * 1.4, y: W + idx * T + T / 2 };
    }
    return { x: VIEW.width / 2, y: VIEW.height / 2 };
}

// ---------------------------------------------------------------------------
// تزيين الأرضيات حسب المنطقة — biome floor painters
// ---------------------------------------------------------------------------
const floorPainters = {
    desert(ctx, room, rng) {
        ctx.fillStyle = room.pal.floor;
        ctx.fillRect(W, W, INT.w, INT.h);
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                if (rng.chance(0.08)) { ctx.fillStyle = room.pal.floorLight; ctx.fillRect(x, y, T, T); }
                else if (rng.chance(0.05)) { ctx.fillStyle = room.pal.floorDark; ctx.fillRect(x, y, T, T); }
                if (rng.chance(0.75)) { // خطوط الرمل — dune ripple
                    ctx.fillStyle = room.pal.speck;
                    const ry = y + rng.int(3, 12);
                    ctx.fillRect(x + rng.int(1, 8), ry, rng.int(3, 6), 1);
                }
                if (rng.chance(0.3)) { // حصيات صغيرة — pebbles
                    ctx.fillStyle = room.pal.floorDark;
                    ctx.fillRect(x + rng.int(2, 12), y + rng.int(2, 12), 2, 1);
                }
            }
        }
    },
    oasis(ctx, room, rng) {
        ctx.fillStyle = room.pal.floor;
        ctx.fillRect(W, W, INT.w, INT.h);
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                if (rng.chance(0.1)) { ctx.fillStyle = room.pal.floorDark; ctx.fillRect(x, y, T, T); }
                if (rng.chance(0.3)) { // عشبة — grass tuft
                    ctx.fillStyle = room.pal.speck;
                    const gx = x + rng.int(2, 12), gy = y + rng.int(2, 12);
                    ctx.fillRect(gx, gy, 1, 3); ctx.fillRect(gx + 1, gy + 1, 1, 2); ctx.fillRect(gx - 1, gy + 2, 1, 1);
                }
                if (rng.chance(0.05)) { // زهرة صغيرة
                    ctx.fillStyle = rng.pick(['#e07a9a', '#f2d06a', '#f6f3ea']);
                    ctx.fillRect(x + rng.int(3, 12), y + rng.int(3, 12), 2, 2);
                }
            }
        }
    },
    town(ctx, room, rng) {
        // بلاط حجري — stone pavement
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                const shade = (tx + ty) % 2 === 0 ? room.pal.floor : room.pal.floorLight;
                ctx.fillStyle = shade;
                ctx.fillRect(x, y, T, T);
                ctx.fillStyle = room.pal.floorDark;
                ctx.fillRect(x, y + 15, T, 1);
                ctx.fillRect(x + (ty % 2 === 0 ? 7 : 0), y, 1, T);
                if (rng.chance(0.08)) ctx.fillRect(x + rng.int(2, 12), y + rng.int(2, 12), 2, 1);
            }
        }
    },
    gardens(ctx, room, rng) {
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                const alt = (tx + ty) % 2 === 0;
                ctx.fillStyle = alt ? room.pal.floor : room.pal.floorDark;
                ctx.fillRect(x, y, T, T);
                // نقشة معينية — diamond motif
                ctx.fillStyle = room.pal.floorLight;
                const cx = x + 8, cy = y + 8;
                for (let d = -3; d <= 3; d++) {
                    const wdt = 3 - Math.abs(d);
                    ctx.fillRect(cx - wdt, cy + d, wdt * 2 + 1, 1);
                }
                ctx.fillStyle = room.pal.speck;
                if (rng.chance(0.25)) ctx.fillRect(x + rng.int(2, 13), y + rng.int(2, 13), 1, 1);
            }
        }
    },
    night(ctx, room, rng) {
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                ctx.fillStyle = (tx + ty) % 2 === 0 ? room.pal.floor : room.pal.floorDark;
                ctx.fillRect(x, y, T, T);
                ctx.fillStyle = room.pal.floorLight;
                if (rng.chance(0.06)) ctx.fillRect(x + rng.int(3, 12), y + rng.int(3, 12), 1, 1);
            }
        }
    },
    library(ctx, room, rng) {
        for (let ty = 0; ty < INT.rows; ty++) {
            for (let tx = 0; tx < INT.cols; tx++) {
                const x = W + tx * T, y = W + ty * T;
                const alt = (tx + ty) % 2 === 0;
                ctx.fillStyle = alt ? room.pal.floor : room.pal.floorDark;
                ctx.fillRect(x, y, T, T);
                ctx.fillStyle = '#d9a441';
                if ((tx * 7 + ty * 3) % 5 === 0) ctx.fillRect(x + 7, y + 7, 2, 2);
            }
        }
    },
};

const ZONE_PAINTER = { desert: 'desert', oasis: 'oasis', town: 'town', gardens: 'gardens', night: 'night', library: 'library' };

// ---------------------------------------------------------------------------
// رسم الجدران — wall ring painter
// ---------------------------------------------------------------------------
function paintWalls(ctx, room, rng) {
    const pal = room.pal;
    ctx.fillStyle = pal.wall;
    ctx.fillRect(0, 0, VIEW.width, W);                       // أعلى
    ctx.fillRect(0, VIEW.height - W, VIEW.width, W);         // أسفل
    ctx.fillRect(0, 0, W, VIEW.height);                      // يسار
    ctx.fillRect(VIEW.width - W, 0, W, VIEW.height);         // يمين

    ctx.fillStyle = pal.wallTop;
    ctx.fillRect(0, 0, VIEW.width, 2);                       // حافة عليا مضيئة
    ctx.fillRect(0, 0, 2, VIEW.height);
    ctx.fillStyle = pal.wallShade;
    ctx.fillRect(W - 1, W, 1, INT.h);                        // ظل داخلي حول الأرضية
    ctx.fillRect(W, W - 1, INT.w, 1);
    ctx.fillRect(VIEW.width - W, W - 1, 1, INT.h + 1);
    ctx.fillRect(W - 1, VIEW.height - W, INT.w + 2, 1);
    ctx.fillRect(0, VIEW.height - 2, VIEW.width, 2);

    if (pal.night) { // نجوم صغيرة على الجدران ليلًا
        ctx.fillStyle = '#8a94c8';
        for (let i = 0; i < 10; i++) {
            const side = rng.int(0, 3);
            let x, y;
            if (side === 0) { x = rng.int(6, VIEW.width - 6); y = rng.int(1, W - 2); }
            else if (side === 1) { x = rng.int(6, VIEW.width - 6); y = VIEW.height - rng.int(1, W - 2); }
            else if (side === 2) { x = rng.int(1, W - 2); y = rng.int(6, VIEW.height - 6); }
            else { x = VIEW.width - rng.int(1, W - 2); y = rng.int(6, VIEW.height - 6); }
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// ---------------------------------------------------------------------------
// خبز الغرفة — bake one room background (cached forever)
// ---------------------------------------------------------------------------
const cache = new Map();

export function getRoomCanvas(room) {
    let cv = cache.get(room.id);
    if (cv) return cv;

    cv = document.createElement('canvas');
    cv.width = VIEW.width;
    cv.height = VIEW.height;
    const ctx = cv.getContext('2d');
    const rng = createRng(room.seed ?? 1);

    paintWalls(ctx, room, rng);
    const painter = floorPainters[ZONE_PAINTER[room.zoneId]] ?? floorPainters.desert;
    painter(ctx, room, rng);

    // الأبواب العادية تُرسم داخل الخلفية (البوابات الديناميكية يرسمها العارض)
    for (const door of room.doors) {
        const r = doorRect(door.edge, door.index);
        if (door.gate) continue; // بوابة: ترسم في الوقت الحقيقي حسب حالتها
        drawSprite(ctx, door.edge === 'top' || door.edge === 'bottom' ? 'door_h' : 'door_v', r.x + r.w / 2, r.y + r.h);
    }

    // العناصر الثابتة — static props
    for (const p of room.props) {
        const info = spriteInfo(p.name);
        if (!info) continue;
        drawSprite(ctx, p.name, p.x, p.y);
    }

    // تعتيم ليلي خفيف — subtle night ambience
    if (room.pal.night) {
        ctx.fillStyle = 'rgba(16,20,48,0.22)';
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }

    cache.set(room.id, cv);
    return cv;
}

export function clearRoomCache() { cache.clear(); }
