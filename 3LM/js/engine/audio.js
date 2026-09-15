// الأصوات: مُولَّد نغمي بالكامل عبر WebAudio — لا ملفات صوتية إطلاقًا.
// Audio: tiny WebAudio synth — zero sound assets, works offline.
const MUTE_KEY = 'rihlat.muted';

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';

export const isMuted = () => muted;

export function setMuted(value) {
    muted = value;
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
    if (master) master.gain.value = value ? 0 : 0.26;
}

/** يبدأ الصوت عند أول تفاعل من المستخدم — must be called from a user gesture */
export function initAudio() {
    if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.26;
    master.connect(ctx.destination);
    // ضجيج أبيض جاهز للاستخدام — reusable white noise
    const len = Math.floor(ctx.sampleRate * 0.4);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

function tone(freq, dur, { type = 'triangle', gain = 0.5, slideTo = null, delay = 0 } = {}) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

function noise(dur, { freq = 900, q = 1.2, gain = 0.4, delay = 0 } = {}) {
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
}

const sounds = {
    step: () => noise(0.05, { freq: 700, q: 0.9, gain: 0.16 }),
    click: () => tone(760, 0.05, { type: 'square', gain: 0.18 }),
    correct: () => {
        tone(660, 0.12, { gain: 0.4 });
        tone(880, 0.12, { gain: 0.4, delay: 0.09 });
        tone(1320, 0.2, { gain: 0.35, delay: 0.18 });
    },
    wrong: () => {
        tone(240, 0.22, { type: 'sawtooth', gain: 0.22, slideTo: 150 });
    },
    key: () => {
        tone(990, 0.1, { gain: 0.4 });
        tone(1480, 0.18, { gain: 0.32, delay: 0.08 });
    },
    chest: () => {
        tone(1180, 0.08, { gain: 0.35 });
        tone(1560, 0.08, { gain: 0.32, delay: 0.07 });
        tone(1980, 0.16, { gain: 0.3, delay: 0.14 });
    },
    heart: () => {
        tone(520, 0.12, { gain: 0.35 });
        tone(780, 0.16, { gain: 0.35, delay: 0.1 });
    },
    door: () => {
        noise(0.16, { freq: 320, q: 0.7, gain: 0.35 });
        tone(120, 0.1, { type: 'square', gain: 0.16 });
    },
    locked: () => {
        tone(110, 0.16, { type: 'square', gain: 0.3 });
        noise(0.08, { freq: 500, q: 1.5, gain: 0.2, delay: 0.02 });
    },
    unlock: () => {
        tone(520, 0.1, { gain: 0.35 });
        tone(780, 0.12, { gain: 0.35, delay: 0.09 });
        tone(1040, 0.22, { gain: 0.4, delay: 0.18 });
    },
    faint: () => {
        tone(420, 0.7, { type: 'sine', gain: 0.35, slideTo: 70 });
    },
    victory: () => {
        const notes = [523, 659, 784, 1046, 1318];
        notes.forEach((f, i) => tone(f, 0.22, { gain: 0.4, delay: i * 0.12 }));
        tone(784, 0.6, { gain: 0.22, delay: 0.62 });
        tone(1046, 0.6, { gain: 0.2, delay: 0.62 });
    },
};

/** تشغيل مؤثر صوتي — play a sound effect by name */
export function sfx(name) {
    if (!ctx || muted) return;
    const fn = sounds[name];
    if (fn) {
        try { fn(); } catch { /* تجاهل أخطاء الصوت */ }
    }
}

// إيقاف الصوت عند إخفاء التبويب — pause audio when the tab is hidden
document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
});
