// توليد العالم — procedural world generation.
// كل رحلة: خمس مناطق مبنية فوق بعضها، غرف متصلة تُولَّد عشوائيًا، بوابات مقفلة
// تحتاج مفاتيح، شخصيات أسئلة، وصناديق كنوز.
// Each run: five stacked zones of randomly grown rooms, keyed gates between
// them, NPC question-givers, chest rooms, and a final library.
import { ZONES, LIBRARY, RULES } from '../config.js';
import { createRng } from '../util/rng.js';
import { NPC_DEFS } from '../render/sprite-data.js';
import { spriteInfo } from '../render/sprites.js';
import { INT, doorInsidePoint } from '../render/rooms.js';

const T = 16;
const W = 8;

/** توزيع الأسئلة على المناطق بحيث تكفي مفاتيح كل منطقة لعبور بوابتها
 *  Distribute questions so each zone can supply the keys its gate needs. */
export function gateRequirements(questionCount) {
    const reqs = RULES.gateFractions.map((f) => Math.min(questionCount, Math.ceil(questionCount * f)));
    return reqs; // [r1..r4] — البوابة النهائية تحتاج كل المفاتيح
}

function zoneQuestionCounts(questionCount) {
    const reqs = gateRequirements(questionCount);
    const d = [];
    let prev = 0;
    for (const r of reqs) { d.push(Math.max(0, r - prev)); prev = Math.max(prev, r); }
    d.push(Math.max(0, questionCount - prev));
    return d; // 5 أعداد
}

/** نمو غرف منطقة: خلايا متصلة تبدأ من المدخل أسفل المنتصف
 *  Grow connected rooms from the bottom-center entry cell. */
function growZone(rng, count, w, h) {
    const cells = [];
    const inGrid = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    const entry = { x: Math.floor(w / 2), y: h - 1, parent: -1 };
    cells.push(entry);
    const has = (x, y) => cells.some((c) => c.x === x && c.y === y);
    while (cells.length < count) {
        const candidates = [];
        for (const c of cells) {
            for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                const nx = c.x + dx, ny = c.y + dy;
                if (inGrid(nx, ny) && !has(nx, ny)) candidates.push({ x: nx, y: ny, parent: cells.indexOf(c) });
            }
        }
        if (candidates.length === 0) break;
        // ميل للنمو للأعلى مع انتشار جانبي — grow upward with some spread
        const minY = Math.min(...candidates.map((c) => c.y));
        const preferred = candidates.filter((c) => c.y === minY);
        const pick = rng.chance(0.65) ? rng.pick(preferred) : rng.pick(candidates);
        cells.push(pick);
    }
    return cells; // كل خلية فيها parent (شجرة) — spanning tree by construction
}

let idCounter = 0;
const roomId = (zoneIndex) => `z${zoneIndex}r${idCounter++}`;

export function generateWorld(questions, seed) {
    const rng = createRng(seed);
    idCounter = 0;
    const Q = questions.length;
    const reqs = gateRequirements(Q);
    const npcCounts = zoneQuestionCounts(Q);

    // توزيع الأسئلة عشوائيًا على المناطق
    const order = rng.shuffle([...questions.keys()]);
    const zones = [];
    const rooms = new Map();
    let qi = 0;

    for (let z = 0; z < ZONES.length; z++) {
        const zone = ZONES[z];
        const zoneQuestions = order.slice(qi, qi + npcCounts[z]);
        qi += npcCounts[z];

        // لا غرف فارغة أبدًا: مدخل (فيه صندوق) + غرف أسئلة + غرف كنوز
        const m = Math.max(3, 1 + npcCounts[z] + 1 + (rng.chance(0.5) ? 1 : 0));
        const w = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(m))));
        const h = Math.ceil(m / w);
        const cells = growZone(rng, m, w, h);
        const cellKey = (c) => `${c.x},${c.y}`;

        // بناء الغرف
        const zoneRooms = [];
        const kinds = [];
        for (let i = 0; i < npcCounts[z]; i++) kinds.push('npc');
        while (kinds.length < cells.length - 1) kinds.push('chest'); // كل غرفة إضافية تحمل كنزًا
        rng.shuffle(kinds);

        cells.forEach((cell, i) => {
            const id = roomId(z);
            const kind = i === 0 ? 'entry' : kinds[i - 1];
            const room = {
                id, zoneId: zone.id, zoneIndex: z, kind,
                pal: zone.pal,
                grid: { x: cell.x, y: cell.y },
                doors: [], props: [], npc: null, chest: null,
                seed: rng.int(1, 2 ** 31 - 1),
                questionIndex: null,
            };
            if (kind === 'npc') {
                room.questionIndex = zoneQuestions.shift() ?? null;
            }
            rooms.set(id, room);
            zoneRooms.push({ room, cell, index: i });
        });

        // أبواب الشجرة — doors from the spanning tree
        const doorPairs = new Set();
        cells.forEach((cell, i) => {
            if (cell.parent < 0) return;
            const p = cells[cell.parent];
            doorPairs.add(`${Math.min(i, cell.parent)}-${Math.max(i, cell.parent)}`);
            connectRooms(rng, zoneRooms[i].room, cell, zoneRooms[cell.parent].room, p);
        });
        // حلقات إضافية — a few extra loops between adjacent rooms
        for (let a = 0; a < cells.length; a++) {
            for (let b = a + 1; b < cells.length; b++) {
                const A = cells[a], B = cells[b];
                const adjacent = Math.abs(A.x - B.x) + Math.abs(A.y - B.y) === 1;
                if (!adjacent || doorPairs.has(`${a}-${b}`)) continue;
                if (rng.chance(0.2)) connectRooms(rng, zoneRooms[a].room, A, zoneRooms[b].room, B);
            }
        }

        zones.push({ id: zone.id, name: zone.name, enterText: zone.enterText, rooms: zoneRooms.map((r) => r.room.id), w, h });
    }

    // غرفة النصر — the library at the very top
    const libraryRoom = {
        id: 'library', zoneId: LIBRARY.id, zoneIndex: ZONES.length, kind: 'library',
        pal: LIBRARY.pal, grid: { x: 0, y: 0 }, doors: [], props: [], npc: null, chest: null,
        seed: rng.int(1, 2 ** 31 - 1), questionIndex: null,
    };
    rooms.set(libraryRoom.id, libraryRoom);

    // البوابات بين المناطق — gates between zones
    const gateInfo = [];
    for (let z = 0; z < ZONES.length; z++) {
        const zone = zones[z];
        const zoneRooms = zone.rooms.map((id) => rooms.get(id));
        const entry = zoneRooms[0];
        const exit = pickExit(zoneRooms, entry);
        const requires = reqs[z];

        if (z < ZONES.length - 1) {
            const nextEntry = rooms.get(zones[z + 1].rooms[0]);
            const gate = { requires, id: `gate${z + 1}` };
            addDoor(rng, exit, 'top', nextEntry, 'bottom', gate);
            gateInfo.push({ gate, fromRoom: exit.id, toZone: zones[z + 1].id });
        } else {
            const gate = { requires: Q, id: 'gate-final' };
            addDoor(rng, exit, 'top', libraryRoom, 'bottom', gate);
            gateInfo.push({ gate, fromRoom: exit.id, toZone: LIBRARY.id, final: true });
        }
    }

    // المحتوى: شخصيات، صناديق، زينة — populate content
    for (const zone of zones) {
        for (const id of zone.rooms) {
            const room = rooms.get(id);
            const zoneDef = ZONES[room.zoneIndex];
            fillRoom(rng, room, zoneDef);
        }
    }
    fillRoom(rng, libraryRoom, LIBRARY, { chapel: true });

    // مواقع الخريطة العامة — global map positions for the minimap
    const maxW = Math.max(...zones.map((z) => z.w), 1);
    let rowsBelow = 0;
    const heightOf = zones.map((z) => z.h);
    zones.forEach((zone, z) => {
        const colOffset = Math.floor((maxW - zone.w) / 2);
        for (const id of zone.rooms) {
            const room = rooms.get(id);
            room.mapCol = room.grid.x + colOffset;
            room.mapRow = rowsBelow + (zone.h - 1 - room.grid.y);
        }
        rowsBelow += zone.h;
    });
    libraryRoom.mapCol = Math.floor((maxW - 1) / 2);
    libraryRoom.mapRow = rowsBelow;

    const start = zones[0].rooms[0];
    return {
        seed, zones, rooms, reqs,
        startRoomId: start,
        libraryRoomId: libraryRoom.id,
        gateInfo,
        mapW: maxW + 2,
        mapH: rowsBelow + 2,
        totalQuestions: Q,
    };
}

/** اختيار غرفة الخروج: الأبعد في أعلى الصفوف — topmost room farthest from entry */
function pickExit(zoneRooms, entry) {
    const byId = new Map(zoneRooms.map((r) => [r.id, r]));
    const dist = new Map([[entry.id, 0]]);
    const queue = [entry];
    while (queue.length) {
        const r = queue.shift();
        for (const d of r.doors) {
            const t = byId.get(d.target);
            if (t && !dist.has(t.id)) { dist.set(t.id, dist.get(r.id) + 1); queue.push(t); }
        }
    }
    let best = entry, bestScore = -1;
    for (const r of zoneRooms) {
        const dy = -r.grid.y; // الأعلى أفضل
        const score = dy * 10 + (dist.get(r.id) ?? 0);
        if (score > bestScore) { bestScore = score; best = r; }
    }
    return best;
}

/** فتحة الباب الأمامية المقابلة — the matching door on the other side */
const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function connectRooms(rng, a, cellA, b, cellB) {
    if (cellA.x < cellB.x) {
        const idx = rng.int(1, INT.rows - 2);
        addDoor(rng, a, 'right', b, 'left', null, idx);
    } else if (cellA.x > cellB.x) {
        const idx = rng.int(1, INT.rows - 2);
        addDoor(rng, a, 'left', b, 'right', null, idx);
    } else if (cellA.y > cellB.y) {
        const idx = rng.int(1, INT.cols - 2);
        addDoor(rng, a, 'top', b, 'bottom', null, idx);
    } else {
        const idx = rng.int(1, INT.cols - 2);
        addDoor(rng, a, 'bottom', b, 'top', null, idx);
    }
}

function addDoor(rng, room, edge, target, targetEdge, gate, index) {
    const horizontal = edge === 'top' || edge === 'bottom';
    const maxIdx = horizontal ? INT.cols - 1 : INT.rows - 1;
    const idx = index ?? rng.int(horizontal ? 1 : 1, maxIdx - 1);
    room.doors.push({ edge, index: idx, target: target.id, targetEdge, gate: gate ?? null });
    const tHorizontal = targetEdge === 'top' || targetEdge === 'bottom';
    const tIdx = tHorizontal === horizontal ? idx : Math.min(idx, (tHorizontal ? INT.cols - 1 : INT.rows - 1));
    target.doors.push({ edge: targetEdge, index: tIdx, target: room.id, targetEdge: opposite[edge], gate: gate ?? null });
}

/** تعبئة الغرفة: زينة + شخصية/صندوق — decorate + place NPC/chest */
function fillRoom(rng, room, zoneDef, opts = {}) {
    const occupied = new Set();
    const block = (px, py, w, h) => {
        const x0 = Math.floor((px - w / 2 - W) / T), x1 = Math.floor((px + w / 2 - W) / T);
        const y0 = Math.floor((py - h - W) / T), y1 = Math.floor((py - W) / T);
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) occupied.add(`${x},${y}`);
    };
    // امنع الاقتراب من الأبواب — keep doors reachable
    const doorCells = new Set();
    for (const door of room.doors) {
        const p = doorInsidePoint(door.edge, door.index);
        const cx = Math.floor((p.x - W) / T), cy = Math.floor((p.y - W) / T);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) doorCells.add(`${cx + dx},${cy + dy}`);
    }

    if (room.questionIndex !== null) {
        const def = NPC_DEFS[rng.int(0, NPC_DEFS.length - 1)];
        const px = W + INT.w / 2, py = W + INT.h / 2 + 16;
        room.npc = { sprite: def.sprite, name: def.name, questionIndex: room.questionIndex, done: false, x: px, y: py };
        block(px, py, 14, 16);
    }
    if (room.kind === 'chest' || room.kind === 'entry') {
        const right = rng.chance(0.5);
        const px = W + (right ? INT.w * 0.68 : INT.w * 0.32), py = W + INT.h * 0.55;
        room.chest = { opened: false, kind: rng.chance(RULES.chestHeartChance) ? 'heart' : 'points', amount: RULES.scoreGem, x: px, y: py };
        block(px, py, 16, 14);
    }

    // مناطق تبقى خالية: حول الأبواب والنقطة البداية وشخصية/صندوق — keep-clear zones
    const keepClear = [];
    for (const door of room.doors) {
        const pt = doorInsidePoint(door.edge, door.index);
        keepClear.push({ x: pt.x - 13, y: pt.y - 11, w: 26, h: 22 });
    }
    if (room.kind === 'entry') {
        keepClear.push({ x: INT.x + INT.w / 2 - 16, y: INT.y + INT.h / 2 - 2, w: 32, h: 22 }); // نقطة البداية
    }
    if (room.npc) keepClear.push({ x: room.npc.x - 10, y: room.npc.y - 17, w: 20, h: 18 });
    if (room.chest) keepClear.push({ x: room.chest.x - 10, y: room.chest.y - 16, w: 20, h: 18 });

    const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const boxOf = (name, px, py) => {
        const info = spriteInfo(name);
        if (!info) return null;
        const s = info.solid;
        // عناصر مسطّحة بلا تصادم: نستخدم حجمها الفعلي للتحقق فقط
        return s
            ? { x: px - info.w / 2 + s.x, y: py - info.h + s.y, w: s.w, h: s.h }
            : { x: px - info.w / 2, y: py - info.h, w: info.w, h: info.h };
    };

    // زينة — props
    const count = opts.chapel ? 3 : rng.int(3, 6);
    for (let i = 0; i < count; i++) {
        const name = rng.weighted(zoneDef.props);
        const info = spriteInfo(name);
        if (!info) continue;
        const pw = info.w, ph = info.h;
        for (let tries = 0; tries < 14; tries++) {
            const tx = rng.int(1, INT.cols - 2);
            const ty = rng.int(1, INT.rows - 2);
            const px = W + tx * T + T / 2;
            const py = W + ty * T + 14;
            if (occupied.has(`${tx},${ty}`)) continue;
            if (doorCells.has(`${tx},${ty}`) || doorCells.has(`${tx},${ty - 1}`)) continue;
            const box = boxOf(name, px, py);
            if (!box || keepClear.some((r) => hits(box, r))) continue;
            room.props.push({ name, x: px, y: py });
            block(px, py, pw, ph);
            break;
        }
    }
}
