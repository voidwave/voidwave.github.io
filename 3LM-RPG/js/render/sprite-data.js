// ملف الرسومات — كل رسمات البكسل في مكان واحد ليسهل تعديلها.
// The art file: every pixel sprite lives here for easy editing.
//
// طريقتان للرسم:
//   px   : صفوف نصية، كل حرف لون من pal والنقطة شفافية (للشخصيات والأشياء الصغيرة)
//   draw : دالة ترسم بمستطيلات فقط (بلا تنعيم) للأشياء الكبيرة المتكررة
// px = character grids; draw = procedural fillRect art.

// ---------------------------------------------------------------------------
// الشخصيات التي تسأل — the question-giving characters
// ---------------------------------------------------------------------------
export const NPC_DEFS = [
    { sprite: 'n_elder', name: 'الحكيم' },
    { sprite: 'n_merchant', name: 'التاجر' },
    { sprite: 'n_teacher', name: 'المعلّمة' },
    { sprite: 'n_traveler', name: 'المسافر' },
    { sprite: 'n_learner', name: 'طالب العلم' },
];

// ---------------------------------------------------------------------------
// لوحات ألوان مشتركة — shared palettes
// ---------------------------------------------------------------------------
const OUT = '#241a12'; // لون الحدود الداكن — outline
const SHOE = '#5b3f28';

const P_PLAYER = {
    o: OUT, c: '#f6f3ea', d: '#d8d2c0', f: '#efc39b', e: '#2e2118', k: '#d5a273',
    t: '#3f9b73', u: '#2e7053', b: '#8a5a33', p: '#e6dabc', s: SHOE,
};
const P_ELDER = { o: OUT, c: '#e9e5d6', h: '#c9bfa4', f: '#e8c69c', e: '#241a12', b: '#f4f1e8', r: '#4a6fa8', k: '#8a8a92', s: SHOE };
const P_MERCHANT = { o: OUT, g: '#d9a441', r: '#a83b3b', f: '#c98b5e', e: '#241a12', b: '#3a2a1e', v: '#7a2f2f', w: '#e8dcc0', k: '#b8863b', p: '#4a4a6a', x: '#3a2a1e' };
const P_TEACHER = { o: OUT, h: '#8a5aa8', f: '#efc39b', e: '#241a12', t: '#2e6a66', g: '#d9a441' };
const P_TRAVELER = { o: OUT, h: '#6b4f35', f: '#d9a97a', e: '#241a12', c: '#8a6a44', k: '#9a6a3a', x: '#3a2a1e' };
const P_LEARNER = { o: OUT, c: '#3f8fa8', d: '#2e6f88', f: '#efc39b', e: '#241a12', w: '#e8dcc0', k: '#8a5a33', l: '#f4ecd0', p: '#5a7a9a', s: SHOE };
const P_WOOD = { o: OUT, w: '#a8703c', d: '#8a5a2c', k: '#6a4426', g: '#d9a441' };
const P_STONE = { o: OUT, G: '#a8a094', g: '#8a8278', d: '#6a6258' };
const P_DOOR = { l: '#cbb389', k: '#9a7f57', p: '#1d1626', g: '#d9a441', i: '#6a6a78' };

// ---------------------------------------------------------------------------
// أدوات رسم برمجية — crisp procedural drawing helpers (fillRect only)
// ---------------------------------------------------------------------------
const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const HL = (ctx, c, x0, x1, y) => R(ctx, c, x0, y, Math.max(0, x1 - x0 + 1), 1);
const DISC = (ctx, c, cx, cy, r) => {
    for (let dy = -r; dy <= r; dy++) {
        const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
        HL(ctx, c, cx - w, cx + w, cy + dy);
    }
};
function frond(ctx, c, x, y, dir, lift, droop, len) {
    for (let i = 0; i < len; i++) {
        const fx = Math.round(x + dir * i * 1.2);
        const fy = Math.round(y - lift * i + droop * i * i);
        R(ctx, c, fx, fy, 2, 1);
    }
}

// ---------------------------------------------------------------------------
// الرسومات — the sprites
// ---------------------------------------------------------------------------
export const ART = {
    // ===== اللاعب — player (12×16) =====
    p_down0: {
        pal: P_PLAYER, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occddcco..',
            '..offffffo..', '..ofeffefo..', '..offffffo..', '...offffo...',
            '..ottuutto..', '..otttttto..', '..otttttto..', '..obbbbbbo..',
            '..oppppppo..', '..opp..ppo..', '..oso..oso..', '..oso..oso..',
        ]
    },
    p_down1: {
        pal: P_PLAYER, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occddcco..',
            '..offffffo..', '..ofeffefo..', '..offffffo..', '...offffo...',
            '..ottuutto..', '..otttttto..', '..otttttto..', '..obbbbbbo..',
            '..oppppppo..', '..oppppppo..', '...osooso...', '...osooso...',
        ]
    },
    p_up0: {
        pal: P_PLAYER, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occcccco..',
            '..occcccco..', '...offffo...', '...okkkko...', '..ottuutto..',
            '..otttttto..', '..otttttto..', '..otuuuuto..', '..otttttto..',
            '..obbbbbbo..', '..oppppppo..', '..opp..ppo..', '..oso..oso..',
        ]
    },
    p_up1: {
        pal: P_PLAYER, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occcccco..',
            '..occcccco..', '...offffo...', '...okkkko...', '..ottuutto..',
            '..otttttto..', '..otttttto..', '..otuuuuto..', '..otttttto..',
            '..obbbbbbo..', '..oppppppo..', '...osooso...', '...osooso...',
        ]
    },
    // رسمة الجانب تنظر لليسار — يُعكس اتجاهها للّاعب المتجه لليمين
    // Side-view art faces LEFT; the renderer mirrors it for 'right'.
    p_side0: {
        pal: P_PLAYER, mirror: true, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occddcco..',
            '..offffffo..', '..offefffo..', '..offffffo..', '...offffo...',
            '..ottuutto..', '..otttttto..', '..otttttto..', '..otttttto..',
            '..obbbbbbo..', '..oppppppo..', '...opppo....', '...oosso....',
        ]
    },
    p_side1: {
        pal: P_PLAYER, mirror: true, px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occddcco..',
            '..offffffo..', '..offefffo..', '..offffffo..', '...offffo...',
            '..ottuutto..', '..otttttto..', '..otttttto..', '..otttttto..',
            '..obbbbbbo..', '..oppppppo..', '...opppo....', '..osso......',
        ]
    },

    // ===== الشخصيات — NPCs (12×16) =====
    n_elder: {
        pal: P_ELDER, solid: [4, 9, 4, 7], px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occhhcco..',
            '..offffffo..', '..ofeffefo..', '..obbbbbbok.', '..obbbbbbok.',
            '...obbbbo.k.', '..orrrrrrok.', '..orrrrrrok.', '..orrrrrrok.',
            '..orrrrrrok.', '.oorrrrrrok.', '.oorrrrrrok.', '.oossso.....',
        ]
    },
    n_merchant: {
        pal: P_MERCHANT, solid: [4, 9, 4, 7], px: [
            '....oooo....', '...oggggo...', '..oggggggo..', '..orggggro..',
            '..offffffo..', '..ofeffefo..', '..obbbbbbo..', '..ovvvvvvo..',
            '..ovwwwwvo..', '..ovwwwwvo..', '..ovwwwwvo..', '..ovvvvvvo..',
            '..okkkkkko..', '..oppppppo..', '..opp..ppo..', '..oxo..oxo..',
        ]
    },
    n_teacher: {
        pal: P_TEACHER, solid: [4, 9, 4, 7], px: [
            '....oooo....', '...ohhhho...', '..ohhhhhho..', '..ohhhhhho..',
            '..ohffffho..', '..ohfeffho..', '..ohffffho..', '..ohhhhhho..',
            '.ohhhhhhhho.', '..otttttto..', '..otttttto..', '..otttttto..',
            '..oggggggo..', '..otttttto..', '..otttttto..', '.otttttttto.',
        ]
    },
    n_traveler: {
        pal: P_TRAVELER, solid: [4, 9, 4, 7], px: [
            '....oooo....', '...ohhhho...', '..ohhhhhho..', '..ohhhhhho..',
            '..ohffffhok.', '..ohfeffhok.', '..offffffok.', '..occccccck.',
            '..occccccck.', '..occccccck.', '..ockkkkkck.', '..occccccck.',
            '..occccccck.', '..occccccck.', '..occc..cck.', '..oxo...xok.',
        ]
    },
    n_learner: {
        pal: P_LEARNER, solid: [4, 9, 4, 7], px: [
            '....oooo....', '...occcco...', '..occcccco..', '..occddcco..',
            '..offffffo..', '..ofeffefo..', '..offffffo..', '...offffo...',
            '..owwwwwwo..', '..owwwwwwo..', '..okkkkkko..', '..okllllko..',
            '..okkkkkko..', '..owwwwwwo..', '..opp..ppo..', '..oso..oso..',
        ]
    },

    // ===== الصحراء — desert props =====
    rock1: {
        pal: P_STONE, solid: [2, 4, 12, 5], px: [
            '................', '......oooo......', '....ooGGGGoo....', '...oGGggggGGo...',
            '..oGgggggggggo..', '..oggggggggddo..', '..oggggggdddddo.', '.oggggggddddddo.',
            '.oggggddddddddo.', '.oooooooooooooo.',
        ]
    },
    rock2: {
        pal: P_STONE, solid: [2, 6, 10, 5], px: [
            '..............', '.....oooo.....', '....oGGGGo....', '...oGGggggo...',
            '..oGggggggo...', '..ogggggggo...', '..oggdgggggo..', '..ogdddggggo..',
            '..ogddddgggo..', '...ogdddggo...', '....oggggo....', '.....oooo.....',
        ]
    },
    stones: {
        pal: P_STONE, px: [
            '................', '................', '...oo.....ooo...', '..oGGo..oGGGGo..',
            '.oggggo.ogggggo.', '.oooooo..ooooo..',
        ]
    },
    shrubDry: {
        pal: { o: OUT, b: '#8a6a3a', d: '#6a4f2a', g: '#7a8a4a' }, solid: [3, 6, 10, 5], px: [
            '................', '.......dd.......', '....d.dbbd.d....', '....ddbbbbdd....',
            '...dbbbbbbbbd...', '..dbbbbbbbbbbd..', '..dbbbgbbgbbbd..', '..dbbbgggbgbbd..',
            '..dbdbgbbgbdbd..', '...dbdbbbbdbd...', '....ddbbddb.....', '.....d....d.....',
        ]
    },

    // ===== الواحة — oasis plants (procedural) =====
    palmTall: {
        w: 18, h: 30, solid: [7, 25, 4, 5],
        pal: { trunk: '#8a5a33', trunkDark: '#6a4426', leaf: '#4f9a45', leafDark: '#3d7c36', leafLight: '#63ac52' },
        draw(ctx, c) {
            R(ctx, c.trunk, 8, 9, 3, 20);
            for (let y = 10; y < 29; y += 3) HL(ctx, c.trunkDark, 8, 10, y);
            R(ctx, c.trunkDark, 8, 28, 3, 2);
            const cx = 9, cy = 9;
            frond(ctx, c.leafDark, cx, cy, -1, 1.0, 0.05, 8);
            frond(ctx, c.leaf, cx, cy, -1, 0.5, 0.10, 7);
            frond(ctx, c.leafDark, cx, cy, -1, 0.0, 0.14, 6);
            frond(ctx, c.leafDark, cx, cy, 1, 1.0, 0.05, 8);
            frond(ctx, c.leaf, cx, cy, 1, 0.5, 0.10, 7);
            frond(ctx, c.leafDark, cx, cy, 1, 0.0, 0.14, 6);
            R(ctx, c.leafLight, cx, cy - 5, 2, 5);
            R(ctx, c.leaf, cx - 1, cy - 3, 4, 3);
            R(ctx, c.leafDark, cx - 2, cy, 5, 2);
        },
    },
    palm: {
        w: 16, h: 20, solid: [6, 15, 4, 4],
        pal: { trunk: '#8a5a33', trunkDark: '#6a4426', leaf: '#4f9a45', leafDark: '#3d7c36' },
        draw(ctx, c) {
            R(ctx, c.trunk, 7, 7, 3, 12);
            for (let y = 8; y < 18; y += 3) HL(ctx, c.trunkDark, 7, 9, y);
            const cx = 8, cy = 7;
            frond(ctx, c.leafDark, cx, cy, -1, 0.8, 0.07, 6);
            frond(ctx, c.leaf, cx, cy, -1, 0.2, 0.13, 5);
            frond(ctx, c.leafDark, cx, cy, 1, 0.8, 0.07, 6);
            frond(ctx, c.leaf, cx, cy, 1, 0.2, 0.13, 5);
            R(ctx, c.leaf, cx - 1, cy - 4, 3, 4);
        },
    },
    bush: {
        w: 16, h: 12, solid: [2, 6, 12, 5],
        pal: { leaf: '#4f9a45', leafDark: '#3d7c36', leafLight: '#63ac52' },
        draw(ctx, c) {
            DISC(ctx, c.leafDark, 5, 8, 4);
            DISC(ctx, c.leafDark, 11, 8, 4);
            DISC(ctx, c.leaf, 8, 7, 5);
            R(ctx, c.leafLight, 6, 3, 3, 2);
            R(ctx, c.leafLight, 10, 5, 2, 2);
        },
    },
    reeds: {
        w: 16, h: 14, solid: [4, 9, 8, 5],
        pal: { g: '#6aa84f', gd: '#4f8a3c', head: '#c9a45a' },
        draw(ctx, c) {
            for (const [x, h, col] of [[4, 8, c.gd], [6, 11, c.g], [8, 9, c.gd], [10, 12, c.g], [12, 7, c.gd]]) {
                R(ctx, col, x, 14 - h, 1, h);
                R(ctx, c.head, x - 0, 14 - h - 2, 1, 2);
            }
        },
    },
    flowers: {
        w: 16, h: 7,
        pal: { a: '#e07a9a', b: '#f2d06a', c: '#f6f3ea', d: '#5a9a4a' },
        draw(ctx, c) {
            const spots = [[2, 0, c.a], [6, 1, c.b], [9, 0, c.c], [13, 1, c.a], [4, 1, c.c], [11, 1, c.b]];
            for (const [x, y, col] of spots) {
                R(ctx, c.d, x + 1, y + 2, 1, 3);
                R(ctx, col, x, y + 1, 3, 2);
            }
        },
    },
    pool: {
        w: 32, h: 24, solid: [2, 5, 28, 17],
        pal: { sand: '#d8b36a', edge: '#c9a45a', water: '#3f8fce', waterDark: '#3577b0', waterLight: '#6ab4e8' },
        draw(ctx, c, w, h) {
            DISC(ctx, c.sand, 16, 13, 15);
            DISC(ctx, c.edge, 16, 13, 13);
            DISC(ctx, c.waterDark, 16, 13, 11);
            DISC(ctx, c.water, 16, 13, 9);
            HL(ctx, c.waterLight, 9, 14, 9);
            HL(ctx, c.waterLight, 13, 20, 14);
            R(ctx, c.waterLight, 7, 16, 3, 1);
            R(ctx, c.waterLight, 22, 11, 3, 1);
        },
    },

    // ===== البلدة — town props =====
    crate: {
        pal: P_WOOD, solid: [1, 0, 14, 13], px: [
            '..oooooooooooo..', '..owwwwwwwwwwdo.', '..odwwwwwwwwddo.', '..odwwwwwwwwddo.',
            '..owddwwwwddwdo.', '..owwddwwddwwdo.', '..owwwddddwwwwd.', '..owwwwddwwwwwd.',
            '..owwwdddddwwwd.', '..owwddwwddwwdo.', '..owddwwwwddwdo.', '..odwwwwwwwwddo.',
            '..odwwwwwwwwddo.', '..oooooooooooo..',
        ]
    },
    pot: {
        pal: { o: OUT, g: '#b8863b', d: '#8a5a2c', l: '#d9a45a' }, solid: [2, 5, 12, 10], px: [
            '................', '......oooo......', '.....ogggllo....', '.....oggggdo....',
            '......oggoo.....', '.....ogggggo....', '....ogggggggo...', '....oggglgggo...',
            '...ogggglggggo..', '...ogggggggggo..', '...ogggggggdgo..', '....ogggggggo...',
            '....ogggggdgo...', '.....ogggggo....', '......oooooo....', '................',
        ]
    },
    barrel: {
        pal: { o: OUT, w: '#a8703c', d: '#8a5a2c', i: '#6a6a78' }, solid: [1, 0, 14, 18], px: [
            '...oooooooooo...', '..owwwwwwwwwwo..', '..owwwwwwwwwwo..', '..oiiiiiiiiiio..',
            '..owwwwwwwwwwo..', '..owwwwwwwwwwo..', '..owwwwddwwwwo..', '..owwwddddwwwo..',
            '..owwddddddwwo..', '..owwddddddwwo..', '..owwwddddwwwo..', '..owwwwddwwwwo..',
            '..owwwwwwwwwwo..', '..oiiiiiiiiiio..', '..owwwwwwwwwwo..', '..owwwwwwwwwwo..',
            '..owwwwwwwwwwo..', '...oooooooooo...',
        ]
    },
    sack: {
        pal: { o: OUT, s: '#c9a45a', d: '#a8854a' }, solid: [2, 4, 12, 10], px: [
            '................', '......oooo......', '.....odooso.....', '.....ossoos.....',
            '....oosssssoo...', '...osssssssso...', '..osssssssssd...', '..ossssssssdo...',
            '..osssssssddo...', '..ossdssssddo...', '..osddssssddo...', '...ossssssdd....',
            '...oosssssdo....', '.....oooooo.....',
        ]
    },
    lampPost: {
        w: 12, h: 28, solid: [3, 21, 6, 7], glow: [5, 6],
        pal: { m: '#3a3a48', md: '#2a2a36', gold: '#d9a441', warm: '#ffd98a', flame: '#fff2c0' },
        draw(ctx, c) {
            R(ctx, c.m, 5, 10, 2, 16);
            R(ctx, c.md, 4, 25, 4, 3);
            R(ctx, c.m, 6, 8, 6, 2);
            R(ctx, c.m, 2, 2, 8, 8);
            R(ctx, c.md, 3, 3, 6, 6);
            R(ctx, c.warm, 4, 4, 4, 4);
            R(ctx, c.flame, 5, 5, 2, 2);
            R(ctx, c.gold, 3, 1, 6, 1);
            R(ctx, c.gold, 2, 2, 1, 8);
            R(ctx, c.gold, 9, 2, 1, 8);
        },
    },
    stall: {
        w: 32, h: 26, solid: [2, 6, 28, 19],
        pal: { post: '#8a5a33', postD: '#6a4426', red: '#b8453c', cream: '#efe6d0', wood: '#a8703c', jar: '#3f8fce', jar2: '#d9a441' },
        draw(ctx, c, w, h) {
            R(ctx, c.post, 3, 6, 2, 19);
            R(ctx, c.post, 27, 6, 2, 19);
            R(ctx, c.postD, 3, 24, 2, 2);
            R(ctx, c.postD, 27, 24, 2, 2);
            for (let x = 0, i = 0; x < 32; x += 4, i++) R(ctx, i % 2 ? c.cream : c.red, x, 0, 4, 7);
            R(ctx, c.postD, 0, 7, 32, 1);
            R(ctx, c.wood, 2, 17, 28, 8);
            R(ctx, c.postD, 2, 17, 28, 1);
            R(ctx, c.postD, 2, 24, 28, 1);
            R(ctx, c.jar, 6, 12, 4, 5);
            R(ctx, c.jar2, 13, 13, 4, 4);
            R(ctx, c.jar, 20, 12, 4, 5);
        },
    },
    bench: {
        pal: P_WOOD, solid: [1, 4, 18, 7], px: [
            '....................', '....................', '..oooooooooooooooo..',
            '..owwwwwwwwwwwwwwo..', '..oooooooooooooooo..', '..odwwwwwwwwwwwwdo..',
            '..oooooooooooooooo..', '..oo............oo..', '..oo............oo..',
            '..oo............oo..', '..oo............oo..', '..oo............oo..',
        ]
    },

    // ===== الحدائق والليل — garden & night props =====
    oliveTree: {
        w: 20, h: 30, solid: [6, 25, 6, 5],
        pal: { trunk: '#7a5a36', trunkD: '#5a3f26', leaf: '#5a7a3c', leafD: '#465f2e', leafL: '#7a9a52' },
        draw(ctx, c) {
            R(ctx, c.trunk, 8, 16, 4, 13);
            R(ctx, c.trunkD, 8, 16, 1, 13);
            DISC(ctx, c.leafD, 10, 12, 8);
            DISC(ctx, c.leaf, 7, 10, 5);
            DISC(ctx, c.leaf, 13, 11, 5);
            DISC(ctx, c.leafL, 9, 7, 4);
            R(ctx, c.leafL, 5, 6, 3, 2);
        },
    },
    fountain: {
        w: 32, h: 28, solid: [2, 8, 28, 18],
        pal: { stone: '#c9bfa4', stoneD: '#a89a7c', stoneL: '#e0d6bb', water: '#4f9ade', waterL: '#8cc8f0' },
        draw(ctx, c) {
            DISC(ctx, c.stoneD, 16, 18, 14);
            DISC(ctx, c.stone, 16, 18, 12);
            DISC(ctx, c.stoneD, 16, 18, 10);
            DISC(ctx, c.water, 16, 18, 8);
            R(ctx, c.water, 14, 8, 3, 12);
            DISC(ctx, c.stoneL, 16, 7, 4);
            R(ctx, c.stoneL, 14, 1, 4, 3);
            R(ctx, c.waterL, 10, 16, 4, 1);
            R(ctx, c.waterL, 19, 13, 4, 1);
            R(ctx, c.waterL, 14, 22, 5, 1);
        },
    },
    flowerBed: {
        w: 32, h: 10, solid: [0, 3, 32, 6],
        pal: { border: '#a89a7c', soil: '#6a4f2a', a: '#e07a9a', b: '#f2d06a', d: '#5a9a4a' },
        draw(ctx, c) {
            R(ctx, c.border, 0, 4, 32, 5);
            R(ctx, c.soil, 1, 5, 30, 3);
            for (let x = 2; x < 30; x += 4) {
                const col = [c.a, c.b][(x / 4) % 2 | 0];
                R(ctx, c.d, x + 1, 3, 1, 2);
                R(ctx, col, x, 2, 3, 2);
            }
            R(ctx, c.border, 0, 8, 32, 1);
        },
    },
    brazier: {
        w: 14, h: 18, solid: [2, 11, 10, 6], glow: [7, 6],
        pal: { m: '#4a4a58', md: '#33333f', f1: '#ff9a3c', f2: '#ffd06a', f3: '#fff2c0' },
        draw(ctx, c) {
            R(ctx, c.md, 2, 16, 10, 2);
            R(ctx, c.m, 3, 13, 8, 4);
            R(ctx, c.md, 1, 11, 12, 3);
            R(ctx, c.f1, 4, 6, 6, 5);
            R(ctx, c.f2, 5, 3, 4, 5);
            R(ctx, c.f3, 6, 1, 2, 4);
            R(ctx, c.f1, 3, 8, 2, 2);
            R(ctx, c.f1, 9, 7, 2, 3);
        },
    },
    medallion: {
        w: 32, h: 32,
        pal: { sand: '#b8863b', deep: '#2c3152', gold: '#d9a441', cream: '#efe2c0' },
        draw(ctx, c) {
            DISC(ctx, c.deep, 16, 16, 15);
            DISC(ctx, c.sand, 16, 16, 14);
            DISC(ctx, c.deep, 16, 16, 12);
            DISC(ctx, c.gold, 16, 16, 9);
            DISC(ctx, c.deep, 16, 16, 7);
            DISC(ctx, c.cream, 13, 16, 5);
            DISC(ctx, c.deep, 16, 16, 5);
            R(ctx, c.cream, 22, 14, 2, 4);
            R(ctx, c.cream, 21, 15, 4, 2);
            R(ctx, c.cream, 24, 15, 2, 2);
        },
    },
    pedestal: {
        w: 24, h: 24, solid: [2, 10, 20, 13],
        pal: { stone: '#d9cfae', stoneD: '#a89a7c', gold: '#d9a441', book: '#3f8fce', pages: '#f6f3ea', glow: '#ffe9a8' },
        draw(ctx, c) {
            DISC(ctx, c.stoneD, 12, 21, 10);
            DISC(ctx, c.stone, 12, 20, 8);
            R(ctx, c.stone, 8, 10, 8, 10);
            R(ctx, c.stoneD, 8, 10, 2, 10);
            R(ctx, c.gold, 6, 7, 12, 3);
            R(ctx, c.pages, 7, 4, 10, 3);
            R(ctx, c.book, 7, 5, 10, 2);
            R(ctx, c.glow, 10, 1, 4, 2);
        },
    },

    // ===== الأبواب — doors & gates =====
    door_h: {
        pal: P_DOOR, px: [
            'llllllllllllllll', 'lkkkkkkkkkkkkkkl', 'lkppppppppppppkl', 'lkppppppppppppkl',
            'lkppppppppppppkl', 'lkppppppppppppkl', 'lkppppppppppppkl', 'lkppppppppppppkl',
        ]
    },
    door_v: {
        pal: P_DOOR, px: [
            'llllllll', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl',
            'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkppppkl',
            'lkppppkl', 'llllllll',
        ]
    },
    gate_h: {
        pal: P_DOOR, px: [
            'lggggggggggggggl', 'lkppippippipppkl', 'lkppippippipppkl', 'lkppippippipppkl',
            'lkppippippipppkl', 'lkppippippipppkl', 'lkppippippipppkl', 'lkppippippipppkl',
        ]
    },
    gate_v: {
        pal: P_DOOR, px: [
            'lggggggl', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkiiiiik', 'lkppppkl',
            'lkppppkl', 'lkppppkl', 'lkiiiiik', 'lkppppkl', 'lkppppkl', 'lkppppkl', 'lkiiiiik',
            'lkppppkl', 'lkppppkl', 'lggggggl',
        ]
    },
    // الباب العظيم النهائي (مرسوم برمجيًا) — the great final gate facade
    gate_facade_locked: {
        w: 48, h: 44,
        pal: { stone: '#c9bfa4', stoneD: '#a89a7c', stoneL: '#e0d6bb', wood: '#8a5a33', woodD: '#6a4426', gold: '#d9a441', deep: '#1d1626', stud: '#e8c76a' },
        draw(ctx, c) {
            R(ctx, c.stoneD, 0, 0, 48, 44);
            R(ctx, c.stone, 1, 1, 46, 42);
            R(ctx, c.deep, 8, 8, 32, 36);
            R(ctx, c.wood, 9, 9, 15, 35);
            R(ctx, c.wood, 24, 9, 15, 35);
            for (let y = 12; y < 42; y += 6) { R(ctx, c.woodD, 9, y, 15, 1); R(ctx, c.woodD, 24, y, 15, 1); }
            R(ctx, c.gold, 23, 9, 2, 35);
            for (let y = 11; y < 43; y += 5) { R(ctx, c.stud, 12, y, 2, 2); R(ctx, c.stud, 34, y, 2, 2); }
            R(ctx, c.stoneL, 0, 0, 48, 3);
            R(ctx, c.stoneL, 0, 41, 48, 3);
            R(ctx, c.stoneL, 0, 0, 3, 44);
            R(ctx, c.stoneL, 45, 0, 3, 44);
            DISC(ctx, c.gold, 24, 6, 5);
            DISC(ctx, c.deep, 26, 6, 4);
        },
    },
    gate_facade_open: {
        w: 48, h: 44,
        pal: { stone: '#c9bfa4', stoneD: '#a89a7c', stoneL: '#e0d6bb', wood: '#8a5a33', gold: '#d9a441', light: '#ffe9a8', glow: '#fff2c0' },
        draw(ctx, c) {
            R(ctx, c.stoneD, 0, 0, 48, 44);
            R(ctx, c.stone, 1, 1, 46, 42);
            R(ctx, c.deep ? c.deep : '#1d1626', 8, 8, 32, 36);
            R(ctx, c.light, 10, 10, 28, 34);
            R(ctx, c.glow, 14, 14, 20, 30);
            R(ctx, c.wood, 8, 8, 3, 36);
            R(ctx, c.wood, 37, 8, 3, 36);
            R(ctx, c.stoneL, 0, 0, 48, 3);
            R(ctx, c.stoneL, 0, 41, 48, 3);
            R(ctx, c.stoneL, 0, 0, 3, 44);
            R(ctx, c.stoneL, 45, 0, 3, 44);
            DISC(ctx, c.gold, 24, 6, 5);
            DISC(ctx, c.light, 24, 6, 3);
        },
    },

    // ===== الصندوق والكنوز — chest =====
    chest_closed: {
        pal: { o: OUT, B: '#c98b3c', b: '#a8703c', G: '#d9a441', k: '#6a4426' }, solid: [1, 3, 14, 10], px: [
            '....oooooooo....', '...oBBBBBBBBo...', '..oBbbbbbbbbBo..', '..obbbbbbbbbbo..',
            '..oBBBBBBBBBBo..', '..oGGGGGGGGGGo..', '..oBbbbbbbbbBo..', '..oBbbbbbbbbBo..',
            '..oGGGGbbGGGGo..', '..oGGGGbbGGGGo..', '..oBbbbbbbbbBo..', '..oBbbbbbbbbBo..',
            '..obbbbbbbbbbo..', '..oooooooooooo..',
        ]
    },
    chest_open: {
        // الصندوق المفتوح يبدو أطول بـ2px، لذا نُزيح صندوق التصادم ليبقى مطابقًا تمامًا
        // للمغلق فلا تتغير الفيزياء عند الفتح — same world collision box as closed
        pal: { o: OUT, B: '#c98b3c', b: '#a8703c', G: '#d9a441', k: '#6a4426', g: '#ffe9a8' }, solid: [1, 5, 14, 10], px: [
            '...ooooooooo....', '..oBBbbbbbBo....', '..oBbbbbbbBo....', '..oBGGGGGGGo....',
            '..oBgggggggo....', '..oGGGGGGGGo....', '..oBbbbbbbBBo...', '..obbbbbbbbbo...',
            '..oBbbbbbbBBo...', '..oBbbbbbbBBo...', '..oGGGGbbGGGo...', '..oGGGGbbGGGo...',
            '..oBbbbbbbBBo...', '..obbbbbbbbbo...', '..obbbbbbbbbo...', '..ooooooooooo...',
        ]
    },

    // ===== علامات التفاعل والأيقونات — interaction markers & HUD icons =====
    marker_talk: {
        pal: { o: '#241a12', w: '#f6f3ea', d: '#241a12' }, px: [
            '..oooooooo..', '.owwwwwwwwo.', 'owwwwwwwwwwo', 'owdwwdwwdwwo', 'owwwwwwwwwwo',
            'owwwwwwwwwwo', '.owwwwwwwwo.', '..owwwwwwo..', '...owwwwo...', '...owwo.....',
            '...oo.......', '............',
        ]
    },
    marker_open: {
        pal: { o: '#8a5a2c', g: '#ffd76a', l: '#fff2c0' }, px: [
            '.....oo.....', '.....gg.....', '..o..gl..o..', '..og.gl.go..', '...ogglgo...',
            '..oggggggo..', '.oggglggggo.', 'ogggllgggggo', '.oggggggggo.', '..oggggggo..',
            '...oggggo...', '.....oo.....',
        ]
    },
    marker_lock: {
        pal: { o: '#241a12', g: '#e8b13c', d: '#8a5a2c', k: '#241a12' }, px: [
            '...oooooo...', '...ok..ko...', '...ok..ko...', '..oooooooo..', '..oggggggo..',
            '..oggggggo..', '..oggkkggo..', '..oggkkggo..', '..oggkgggo..', '..oggggggo..',
            '..oooooooo..', '............',
        ]
    },
    icon_heart: {
        pal: { o: '#5a1f1f', r: '#e05454', h: '#f28a8a' }, px: [
            '.oo..oo.', 'orhoorro', 'orrrrrro', 'orrrrrro', '.orrro..', '..orro..',
            '...oo...', '........',
        ]
    },
    icon_heart_empty: {
        pal: { o: '#2a2a32', r: '#4a4a55', h: '#5a5a66' }, px: [
            '.oo..oo.', 'orhoorro', 'orrrrrro', 'orrrrrro', '.orrro..', '..orro..',
            '...oo...', '........',
        ]
    },
    icon_key: {
        pal: { o: '#6a4a10', g: '#e8b13c', l: '#ffe9a8' }, px: [
            '..oooo..', '.oggggo.', '.og..go.', '.oggggo.', '..oggo..', '...gg...',
            '...gg...', '...ogg..',
        ]
    },
    icon_gem: {
        pal: { o: '#14323a', c: '#52d0d8', l: '#a8f0f2' }, px: [
            '..oooo..', '.occcco.', 'occllcco', 'occcccco', '.occcco.', '..occo..',
            '...oo...', '........',
        ]
    },
};
