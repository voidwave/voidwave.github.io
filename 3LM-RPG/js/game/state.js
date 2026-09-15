// حالة الرحلة — one run's live state: hearts, keys, score, movement, transitions.
import { RULES, TEXT } from '../config.js';
import { createRng } from '../util/rng.js';
import { generateWorld } from './world.js';
import { pickForRun, buildQuestion } from '../data/questions.js';
import { INT, doorInsidePoint } from '../render/rooms.js';
import { spriteSolid } from '../render/sprites.js';

export const state = {
    phase: 'boot', // boot | loading | title | play | quiz | faint | victory | error
    sheet: { source: 'sheet', skipped: 0, loaded: 0 },
    questions: [],
    world: null,
    rng: null,
    roomId: null,
    player: { x: 0, y: 0, dir: 'down', moving: false, walkPhase: 0 },
    hearts: RULES.hearts,
    keys: 0,
    score: 0,
    attempts: new Map(),  // رقم السؤال → محاولات خاطئة
    answered: new Set(),  // أرقام الأسئلة المجابة
    discovered: new Set(),
    visitedZones: new Set(),
    lastDoor: null,       // {edge, index} — مكان العودة عند الإغماء
    particles: [],
    transition: null,
    quiz: null,
    stats: { mistakes: 0, startedAt: 0, endedAt: 0 },
    gateToastAt: -999,
};

export const currentRoom = () => state.world.rooms.get(state.roomId);

const spawnPoint = () => ({ x: INT.x + INT.w / 2, y: INT.y + INT.h / 2 + 12 });

/** بدء رحلة جديدة من قائمة أسئلة محمّلة — start a fresh run */
export function startRun(questionResult, seed = (Math.random() * 2 ** 31) | 0) {
    const rng = createRng(seed);
    state.rng = rng;
    state.questions = pickForRun(questionResult.items, rng);
    state.sheet = {
        source: questionResult.source,
        skipped: questionResult.skipped ?? 0,
        loaded: questionResult.items.length,
    };
    state.world = generateWorld(state.questions, seed);
    state.roomId = state.world.startRoomId;
    state.hearts = RULES.hearts;
    state.keys = 0;
    state.score = 0;
    state.attempts = new Map();
    state.answered = new Set();
    state.discovered = new Set([state.roomId]);
    state.visitedZones = new Set([0]);
    state.lastDoor = null;
    state.particles = [];
    state.transition = null;
    state.quiz = null;
    state.stats = { mistakes: 0, startedAt: performance.now(), endedAt: 0 };
    state.gateToastAt = -999;
    const p = spawnPoint();
    state.player = { x: p.x, y: p.y, dir: 'up', moving: false, walkPhase: 0 };
    state.phase = 'play';
}

// ---------------------------------------------------------------------------
// الحركة والتصادم — movement & collision
// ---------------------------------------------------------------------------
const FEET = { w: 10, h: 8 };

function roomSolids(room) {
    if (room._solids) return room._solids;
    const list = [];
    for (const pr of room.props) {
        const s = spriteSolid(pr.name, pr.x, pr.y);
        if (s) list.push(s);
    }
    if (room.npc) {
        const s = spriteSolid(room.npc.sprite, room.npc.x, room.npc.y);
        if (s) list.push(s);
    }
    if (room.chest) {
        const s = spriteSolid(room.chest.opened ? 'chest_open' : 'chest_closed', room.chest.x, room.chest.y);
        if (s) list.push(s);
    }
    room._solids = list;
    return list;
}

function blocked(x, y) {
    const b = { x: x - FEET.w / 2, y: y - FEET.h, w: FEET.w, h: FEET.h };
    if (b.x < INT.x || b.y < INT.y || b.x + b.w > INT.x + INT.w || b.y + b.h > INT.y + INT.h) return true;
    for (const s of roomSolids(currentRoom())) {
        if (b.x < s.x + s.w && b.x + b.w > s.x && b.y < s.y + s.h && b.y + b.h > s.y) return true;
    }
    return false;
}

/** تحريك اللاعب مع انزلاق على الجدران + مغناطيس الأبواب — move with sliding + door magnet */
export function movePlayer(dx, dy, dt = 1 / 60) {
    const p = state.player;
    if (dx !== 0 && !blocked(p.x + dx, p.y)) p.x += dx;
    if (dy !== 0 && !blocked(p.x, p.y + dy)) p.y += dy;
    doorMagnet(dx, dy, dt);
}

const MAGNET_SPEED = 60; // سرعة الانجذاب لمحاذاة الباب (بكسل/ثانية)

/** عند الاقتراب من الجدار: يسحب اللاعب بلطف نحو أقرب باب — soft door magnetism */
function doorMagnet(dx, dy, dt) {
    const p = state.player;
    const room = currentRoom();
    if (dy < 0 && p.y - INT.y < DOOR_REACH + 10) magnetAxis('top', p, room, dt);
    else if (dy > 0 && INT.y + INT.h - p.y < DOOR_REACH + 10) magnetAxis('bottom', p, room, dt);
    if (dx < 0 && p.x - INT.x < DOOR_REACH + 10) magnetAxis('left', p, room, dt);
    else if (dx > 0 && INT.x + INT.w - p.x < DOOR_REACH + 10) magnetAxis('right', p, room, dt);
}

function magnetAxis(edge, p, room, dt) {
    const horizontal = edge === 'top' || edge === 'bottom';
    let target = null;
    let bestD = 28; // أقصى مسافة محاذاة للجذب
    for (const door of room.doors) {
        if (door.edge !== edge) continue;
        const c = doorInsidePoint(door.edge, door.index);
        const along = horizontal ? Math.abs(p.x - c.x) : Math.abs(p.y - c.y);
        if (along < bestD) { bestD = along; target = c; }
    }
    if (!target) return;
    const step = MAGNET_SPEED * dt;
    if (horizontal) {
        const mx = Math.max(-step, Math.min(step, target.x - p.x));
        if (mx !== 0 && !blocked(p.x + mx, p.y)) p.x += mx;
    } else {
        const my = Math.max(-step, Math.min(step, target.y - p.y));
        if (my !== 0 && !blocked(p.x, p.y + my)) p.y += my;
    }
}

/** شبكة أمان: إن وجد اللاعب نفسه داخل صندوق صلب (تغيّر فيزياء/انتقال) يُدفع للخارج
 *  بأقصر مسار بدل أن يتجمد — safety net: push the player out instead of freezing */
export function unstickPlayer() {
    const p = state.player;
    const clampX = (x) => Math.max(INT.x + FEET.w / 2, Math.min(INT.x + INT.w - FEET.w / 2, x));
    const clampY = (y) => Math.max(INT.y + FEET.h, Math.min(INT.y + INT.h, y));
    for (let pass = 0; pass < 2; pass++) {
        const b = { x: p.x - FEET.w / 2, y: p.y - FEET.h, w: FEET.w, h: FEET.h };
        let hit = null;
        for (const s of roomSolids(currentRoom())) {
            if (b.x < s.x + s.w && b.x + b.w > s.x && b.y < s.y + s.h && b.y + b.h > s.y) { hit = s; break; }
        }
        if (!hit) return;
        // اختر أقصر مخرج من الصناديق الأربعة — shortest way out of the box
        const outs = [
            { dx: hit.x - (b.x + b.w) - 0.5, dy: 0 },
            { dx: hit.x + hit.w - b.x + 0.5, dy: 0 },
            { dx: 0, dy: hit.y - (b.y + b.h) - 0.5 },
            { dx: 0, dy: hit.y + hit.h - b.y + 0.5 },
        ];
        outs.sort((a, c) => (Math.abs(a.dx) + Math.abs(a.dy)) - (Math.abs(c.dx) + Math.abs(c.dy)));
        p.x = clampX(p.x + outs[0].dx);
        p.y = clampY(p.y + outs[0].dy);
    }
}

// ---------------------------------------------------------------------------
// الانتقال بين الغرف — room transitions
// ---------------------------------------------------------------------------
const inwardDir = { top: 'down', bottom: 'up', left: 'right', right: 'left' };

/** الباب الذي يقف عنده اللاعب وناويًا عبوره — door detection: قرب من الجدار +
 *  محاذاة عمود الباب + الدفع باتجاهه. الوصول وحده لا يكفي، لذا يمكن الرجوع فورًا. */
const DOOR_REACH = 30;  // مدى الاقتراب من الجدار (بكسل)
const DOOR_ALIGN = 15;  // نصف عرض التسامح على محور الباب

export function touchingDoor(intentX = 0, intentY = 0) {
    const p = state.player;
    const room = currentRoom();
    let found = null;
    let bestDepth = Infinity;
    for (const door of room.doors) {
        const horizontal = door.edge === 'top' || door.edge === 'bottom';
        // نية العبور: يلزم دفع المحور الغالب باتجاه الباب
        // Intent: you must push toward the door; merely arriving never triggers it
        const intent = horizontal
            ? (door.edge === 'top' ? -intentY : intentY)
            : (door.edge === 'left' ? -intentX : intentX);
        const lateral = horizontal ? Math.abs(intentX) : Math.abs(intentY);
        if (intent < 0.35 || intent <= lateral) continue;
        const c = doorInsidePoint(door.edge, door.index);
        const along = horizontal ? Math.abs(p.x - c.x) : Math.abs(p.y - c.y);
        if (along > DOOR_ALIGN) continue;
        const depth = horizontal
            ? (door.edge === 'top' ? p.y - INT.y : INT.y + INT.h - p.y)
            : (door.edge === 'left' ? p.x - INT.x : INT.x + INT.w - p.x);
        if (depth > DOOR_REACH) continue;
        if (depth < bestDepth) { bestDepth = depth; found = door; }
    }
    return found;
}

export function startTransition(door) {
    state.phase = 'transition';
    state.transition = {
        door, fromRoomId: state.roomId, toRoomId: door.target,
        t: 0, duration: RULES.doorTransitionMs / 1000,
    };
}

export function updateTransition(dt) {
    const tr = state.transition;
    if (!tr) return;
    tr.t += dt;
    if (tr.t < tr.duration) return;
    const fromId = tr.fromRoomId;
    state.roomId = tr.toRoomId;
    const room = currentRoom();
    const backDoor = room.doors.find((d) => d.target === fromId);
    state.lastDoor = backDoor ? { edge: backDoor.edge, index: backDoor.index } : null;
    const p = backDoor ? doorInsidePoint(backDoor.edge, backDoor.index) : spawnPoint();
    state.player.x = p.x;
    state.player.y = p.y;
    state.player.dir = backDoor ? inwardDir[backDoor.edge] : 'up';
    state.discovered.add(room.id);
    state.transition = null;
    state.phase = room.kind === 'library' ? 'victory' : 'play';
    if (state.phase === 'victory') state.stats.endedAt = performance.now();
}

// ---------------------------------------------------------------------------
// الأسئلة — quiz flow
// ---------------------------------------------------------------------------
export function openQuiz(room) {
    const idx = room.npc.questionIndex;
    const item = state.questions[idx];
    const q = buildQuestion(item, state.rng);
    state.quiz = {
        roomId: room.id,
        questionIndex: idx,
        greeting: state.rng.pick(TEXT.npcGreetings),
        q: q.q,
        options: q.options,
        correctIndex: q.correctIndex,
        wrongPicked: new Set(),
        lastResult: null,
        points: 0,
        total: state.questions.length,
        solvedCount: state.answered.size,
    };
    state.phase = 'quiz';
}

/** إجابة اللاعب — player answered */
export function answerQuiz(optionIndex) {
    const quiz = state.quiz;
    if (!quiz || quiz.lastResult === 'correct') return null;
    if (quiz.wrongPicked.has(optionIndex)) return null;

    if (optionIndex === quiz.correctIndex) {
        const priorWrong = state.attempts.get(quiz.questionIndex) ?? 0;
        const tier = Math.min(priorWrong, RULES.scoreByAttempt.length - 1);
        const points = RULES.scoreByAttempt[tier];
        state.score += points;
        state.keys += 1;
        state.answered.add(quiz.questionIndex);
        quiz.points = points;
        quiz.lastResult = 'correct';
        const room = currentRoom();
        if (room.npc) {
            room.npc.done = true;
            spawnSparkles(room.npc.x, room.npc.y - 12, 12);
        }
        return { correct: true, points, keys: state.keys, answered: state.answered.size, total: state.questions.length };
    }

    const priorWrong = state.attempts.get(quiz.questionIndex) ?? 0;
    state.attempts.set(quiz.questionIndex, priorWrong + 1);
    state.stats.mistakes += 1;
    quiz.wrongPicked.add(optionIndex);
    quiz.lastResult = 'wrong';
    state.hearts -= 1;
    const room = currentRoom();
    if (room.npc) spawnSparkles(room.npc.x, room.npc.y - 12, 5, ['#e05454', '#8a2f2f']);
    if (state.hearts <= 0) {
        faint();
        return { correct: false, faint: true, hearts: 0 };
    }
    return { correct: false, faint: false, hearts: state.hearts };
}

export function closeQuiz() {
    state.quiz = null;
    if (state.phase === 'quiz') state.phase = 'play';
}

/** الإغماء: فقد كل القلوب — faint when hearts run out */
export function faint() {
    state.hearts = RULES.hearts;
    state.quiz = null;
    state.phase = 'faint';
    const p = state.lastDoor ? doorInsidePoint(state.lastDoor.edge, state.lastDoor.index) : spawnPoint();
    state.player.x = p.x;
    state.player.y = p.y;
}

// ---------------------------------------------------------------------------
// الكنوز والبوابات — chests & gates
// ---------------------------------------------------------------------------
export function openChest() {
    const room = currentRoom();
    const c = room.chest;
    if (!c || c.opened) return null;
    c.opened = true;
    room._solids = null;
    spawnSparkles(c.x, c.y - 10, 14);
    if (c.kind === 'heart') {
        if (state.hearts < RULES.hearts) {
            state.hearts += 1;
            return { kind: 'heart', hearts: state.hearts };
        }
        state.score += 50; // القلب ممتلئ: نقاط إضافية
        return { kind: 'points', points: 50 };
    }
    state.score += c.amount;
    return { kind: 'points', points: c.amount };
}

export const gateOpen = (gate) => !gate || state.keys >= gate.requires;

/** أقرب عنصر تفاعلي — nearest interactable in front of the player */
export function findInteractable() {
    const room = currentRoom();
    const p = state.player;
    const RANGE = 30;
    let best = null;
    const consider = (item, x, y) => {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < RANGE && (!best || d < best.dist)) best = { ...item, dist: d, x, y };
    };
    if (room.npc) {
        consider(room.npc.done ? { type: 'npcDone', npc: room.npc } : { type: 'npc', npc: room.npc }, room.npc.x, room.npc.y);
    }
    if (room.chest && !room.chest.opened) consider({ type: 'chest', chest: room.chest }, room.chest.x, room.chest.y);
    for (const door of room.doors) {
        if (door.gate && !gateOpen(door.gate)) {
            const pt = doorInsidePoint(door.edge, door.index);
            consider({ type: 'gate', door }, pt.x, pt.y);
        }
    }
    return best;
}

// ---------------------------------------------------------------------------
// الجزيئات — particles
// ---------------------------------------------------------------------------
export function spawnSparkles(x, y, count = 10, colors = ['#ffe9a8', '#ffd76a', '#fff2c0']) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 10 + Math.random() * 26;
        state.particles.push({
            x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 14,
            life: 0.5 + Math.random() * 0.4,
            color: colors[(Math.random() * colors.length) | 0],
            size: Math.random() < 0.3 ? 2 : 1,
        });
    }
}

export function updateParticles(dt) {
    const list = state.particles;
    for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= dt;
        p.vy += 60 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) list.splice(i, 1);
    }
}

/** نسبة الدقة للشاشة النهائية — accuracy for the victory screen */
export function accuracy() {
    const solved = state.answered.size;
    const total = solved + state.stats.mistakes;
    return total === 0 ? 1 : solved / total;
}

export function elapsedSeconds() {
    const end = state.stats.endedAt || performance.now();
    return Math.max(0, (end - state.stats.startedAt) / 1000);
}
