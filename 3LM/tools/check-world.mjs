// أداة فحص العالم المولَّد (تعمل في Node بدون متصفح) — offline world sanity checker.
// ‏الاستخدام: node tools/check-world.mjs [عدد البذور]
// تتحقق من: الاتصال، المحتوى في كل غرفة، خلوص الزينة عن الأبواب، البوابات والمفاتيح،
// وأبواب كل غرفة (زوج مقابل + فهرس صالح + لا تكرار).
import { generateWorld, gateRequirements } from '../js/game/world.js';
import { INT, doorInsidePoint } from '../js/render/rooms.js';
import { spriteInfo } from '../js/render/sprites.js';
import { ZONES } from '../js/config.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SEEDS = Number(process.argv[2] || 40);
const questions = JSON.parse(
    readFileSync(fileURLToPath(new URL('../js/data/fallback-questions.json', import.meta.url)), 'utf8')
).items;

const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function checkWorld(seed) {
    const problems = [];
    const world = generateWorld(questions, seed);
    const rooms = [...world.rooms.values()];
    const Q = world.totalQuestions;

    // 1) الاتصال: كل الغرف تُبلَغ من غرفة البداية
    const seen = new Set([world.startRoomId]);
    const queue = [world.startRoomId];
    while (queue.length) {
        const room = world.rooms.get(queue.shift());
        for (const d of room.doors) {
            if (!seen.has(d.target)) { seen.add(d.target); queue.push(d.target); }
        }
    }
    if (seen.size !== rooms.length) problems.push(`connectivity: ${seen.size}/${rooms.length} reachable`);

    // 2) كل غرفة فيها محتوى (عدا المكتبة) + كل سؤال مستخدم مرة واحدة
    const usedQuestions = [];
    for (const room of rooms) {
        if (room.kind === 'library') continue;
        if (!room.npc && !room.chest) problems.push(`${room.id}: empty room (kind=${room.kind})`);
        if (room.kind === 'npc' && room.questionIndex === null) problems.push(`${room.id}: npc room without a question`);
        if (room.npc) usedQuestions.push(room.npc.questionIndex);
    }
    const unique = new Set(usedQuestions);
    if (usedQuestions.length !== Q) problems.push(`question assignment: ${usedQuestions.length} npc rooms for ${Q} questions`);
    if (unique.size !== usedQuestions.length) problems.push('question assigned to more than one npc');

    // 3) خلوص الزينة عن الأبواب ونقطة البداية والصناديق/الشخصيات
    for (const room of rooms) {
        const zones = room.doors.map((d) => {
            const p = doorInsidePoint(d.edge, d.index);
            return { x: p.x - 13, y: p.y - 11, w: 26, h: 22 };
        });
        if (room.kind === 'entry') zones.push({ x: INT.x + INT.w / 2 - 16, y: INT.y + INT.h / 2 - 2, w: 32, h: 22 });
        if (room.npc) zones.push({ x: room.npc.x - 10, y: room.npc.y - 17, w: 20, h: 18 });
        if (room.chest) zones.push({ x: room.chest.x - 10, y: room.chest.y - 16, w: 20, h: 18 });
        for (const pr of room.props) {
            const info = spriteInfo(pr.name);
            if (!info) { problems.push(`${room.id}: unknown prop "${pr.name}"`); continue; }
            const s = info.solid ?? { x: 0, y: 0, w: info.w, h: info.h };
            const box = { x: pr.x - info.w / 2 + s.x, y: pr.y - info.h + s.y, w: s.w, h: s.h };
            if (zones.some((z) => hits(box, z))) problems.push(`${room.id}: prop ${pr.name} overlaps a door/spawn/entity zone`);
        }
    }

    // 4) الأبواب: زوج مقابل + فهرس صالح + لا تكرار على نفس الحافة
    for (const room of rooms) {
        const seenKeys = new Set();
        for (const d of room.doors) {
            const horizontal = d.edge === 'top' || d.edge === 'bottom';
            const max = (horizontal ? INT.cols : INT.rows) - 1;
            if (d.index < 0 || d.index > max) problems.push(`${room.id}: door index ${d.index} out of range`);
            const key = `${d.edge}:${d.index}`;
            if (seenKeys.has(key)) problems.push(`${room.id}: duplicate door on ${key}`);
            seenKeys.add(key);
            const target = world.rooms.get(d.target);
            if (!target) { problems.push(`${room.id}: door target ${d.target} missing`); continue; }
            if (!target.doors.some((td) => td.target === room.id)) problems.push(`${room.id} → ${target.id}: no mirror door`);
        }
    }

    // 5) البوابات: متطلبات متزايدة + إمكانية التقدم (أسئلة كل منطقة تكفي للخروج منها)
    const reqs = gateRequirements(Q);
    for (let i = 1; i < reqs.length; i++) {
        if (reqs[i] < reqs[i - 1]) problems.push(`gate requirements not monotonic at ${i}`);
    }
    const finalGate = world.gateInfo.find((g) => g.final);
    if (!finalGate || finalGate.gate.requires !== Q) problems.push('final gate does not require every key');
    let cumulative = 0;
    world.zones.forEach((zone, z) => {
        const npcs = zone.rooms.filter((id) => world.rooms.get(id).npc).length;
        cumulative += npcs;
        if (z < reqs.length && cumulative < reqs[z]) {
            problems.push(`zone ${z} too few questions: ${cumulative} < ${reqs[z]}`);
        }
    });

    return { seed, rooms: rooms.length, problems };
}

let failed = 0;
for (let i = 0; i < SEEDS; i++) {
    const seed = 1000 + i * 7919;
    const { rooms, problems } = checkWorld(seed);
    if (problems.length) {
        failed++;
        console.log(`❌ seed ${seed} (${rooms} rooms)`);
        for (const p of problems.slice(0, 8)) console.log(`   - ${p}`);
    }
}
console.log(failed === 0
    ? `✅ ${SEEDS} عوالم سليمة — all ${SEEDS} worlds passed (rooms, content, props clearance, doors, gates)`
    : `⚠️ فشل ${failed} من ${SEEDS} — ${failed}/${SEEDS} worlds had problems`);
process.exit(failed === 0 ? 0 : 1);
