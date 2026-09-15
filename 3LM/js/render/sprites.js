// نظام رسم الرموز: كل رسمة تُخبَز مرة واحدة إلى لوحة مستقلة، ثم تُرسم لاحقًا
// بـ drawImage فقط — سريع جدًا على الجوال.
// Sprite bake system: every sprite is pre-rendered once into its own canvas,
// so per-frame drawing is a single fast drawImage call.
import { ART } from './sprite-data.js';

const baked = new Map(); // name -> { canvas, w, h, solid, anchor, glow }

function bakeOne(name, def, flip = false) {
    const w = def.w ?? (def.px ? def.px[0].length : 16);
    const h = def.h ?? (def.px ? def.px.length : 16);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (def.px) {
        const pal = def.pal ?? {};
        for (let y = 0; y < def.px.length; y++) {
            const row = def.px[y];
            for (let x = 0; x < row.length; x++) {
                const ch = row[x];
                if (ch === '.' || ch === ' ') continue;
                const col = pal[ch];
                if (!col) continue;
                ctx.fillStyle = col;
                ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
            }
        }
    } else if (def.draw) {
        ctx.save();
        if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
        def.draw(ctx, def.pal ?? {}, w, h, def);
        ctx.restore();
    }

    const solid = def.solid ? { x: def.solid[0], y: def.solid[1], w: def.solid[2], h: def.solid[3] } : null;
    baked.set(name, { canvas, w, h, solid, anchor: def.anchor ?? 'feet', glow: def.glow ?? null });
}

/** خبز كل الرسومات (+ النسخ المعكوسة) — bake everything, call once at boot */
export function bakeAll() {
    for (const [name, def] of Object.entries(ART)) bakeOne(name, def);
    for (const [name, def] of Object.entries(ART)) {
        if (def.mirror) bakeOne(name + '_l', def, true);
    }
}

export const hasSprite = (name) => baked.has(name) || !!ART[name];

/** بيانات الرمز (أو بياناته الوصفية قبل الخبز — مفيد للاختبار في Node)
 *  Sprite entry; falls back to ART metadata when nothing is baked (Node tools). */
export const spriteInfo = (name) => baked.get(name) ?? artMeta(name);

function artMeta(name) {
    const def = ART[name];
    if (!def) return undefined;
    const w = def.w ?? (def.px ? def.px[0].length : 16);
    const h = def.h ?? (def.px ? def.px.length : 16);
    const solid = def.solid ? { x: def.solid[0], y: def.solid[1], w: def.solid[2], h: def.solid[3] } : null;
    return { canvas: null, w, h, solid, anchor: def.anchor ?? 'feet', glow: def.glow ?? null };
}

/** رسم رمز بنقطة ارتكاز عند القدمين ثم تمديد نصف العرض لليسار — draw at feet anchor */
export function drawSprite(ctx, name, x, y, flip = false) {
    const key = flip && baked.has(name + '_l') ? name + '_l' : name;
    const s = baked.get(key) ?? baked.get(name);
    if (!s) return;
    ctx.drawImage(s.canvas, Math.round(x - s.w / 2), Math.round(y - s.h));
}

/** مستطيل التصادم لعنصر مرسوم عند (x, y) — collision box for a sprite drawn at x,y */
export function spriteSolid(name, x, y) {
    const s = baked.get(name);
    if (!s || !s.solid) return null;
    return { x: Math.round(x - s.w / 2 + s.solid.x), y: Math.round(y - s.h + s.solid.y), w: s.solid.w, h: s.solid.h };
}

/** أيقونة DOM من رمز مخبوز — small data-URL icon for the HTML HUD */
export function iconDataUrl(name, scale = 3) {
    const s = baked.get(name);
    if (!s) return '';
    const c = document.createElement('canvas');
    c.width = s.w * scale;
    c.height = s.h * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
}
