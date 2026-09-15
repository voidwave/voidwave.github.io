// الإدخال: لوحة المفاتيح + مقبض افتراضي للمس + زر التفاعل
// Input: keyboard, dynamic on-screen joystick (touch), action button.
export const input = {
    x: 0,
    y: 0,
    actionEdge: false,
    cancelEdge: false,
    enabled: true,
    consumeAction() { const a = input.actionEdge; input.actionEdge = false; return a; },
    consumeCancel() { const a = input.cancelEdge; input.cancelEdge = false; return a; },
};

const keys = new Set();
const MAX_PUSH = 44; // أقصى مدى للمقبض — joystick radius (px)
const DEADZONE = 0.16;

function keyboardVector() {
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const up = keys.has('ArrowUp') || keys.has('KeyW');
    const down = keys.has('ArrowDown') || keys.has('KeyS');
    let x = (right ? 1 : 0) - (left ? 1 : 0);
    let y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    input.x = x;
    input.y = y;
}

export function attachInput({ joyZone, joyRing, joyKnob, actionBtn, canvas, onMuteToggle }) {
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        keys.add(e.code);
        keyboardVector();
        if (['Space', 'Enter', 'KeyE'].includes(e.code)) input.actionEdge = true;
        if (e.code === 'Escape') input.cancelEdge = true;
        if (e.code === 'KeyM') onMuteToggle?.();
    });
    window.addEventListener('keyup', (e) => { keys.delete(e.code); keyboardVector(); });
    window.addEventListener('blur', () => { keys.clear(); keyboardVector(); });

    // -------------------------------------------------------------------------
    // المقبض الافتراضي — dynamic joystick: يظهر حيث يلمس اللاعب
    // -------------------------------------------------------------------------
    let joyId = null;
    let origin = { x: 0, y: 0 };

    const showRing = (x, y) => {
        joyRing.style.display = 'block';
        joyRing.style.transform = `translate(${Math.round(x - MAX_PUSH - 12)}px, ${Math.round(y - MAX_PUSH - 12)}px)`;
        joyKnob.style.transform = 'translate(0px, 0px)';
    };
    const hideRing = () => {
        joyRing.style.display = 'none';
        input.x = 0;
        input.y = 0;
        keyboardVector(); // العودة لأي مفاتيح مضغوطة
    };

    joyZone.addEventListener('pointerdown', (e) => {
        if (joyId !== null) return;
        joyId = e.pointerId;
        origin = { x: e.clientX, y: e.clientY };
        try { joyZone.setPointerCapture(e.pointerId); } catch { /* بعض المتصفحات/الأحداث الاصطناعية */ }
        showRing(origin.x, origin.y);
        e.preventDefault();
    });
    joyZone.addEventListener('pointermove', (e) => {
        if (e.pointerId !== joyId) return;
        let dx = e.clientX - origin.x;
        let dy = e.clientY - origin.y;
        const len = Math.hypot(dx, dy);
        const clamped = Math.min(len, MAX_PUSH);
        if (len > 0) { dx = (dx / len) * clamped; dy = (dy / len) * clamped; }
        joyKnob.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
        const nx = dx / MAX_PUSH, ny = dy / MAX_PUSH;
        if (Math.hypot(nx, ny) < DEADZONE) { input.x = 0; input.y = 0; }
        else { input.x = nx; input.y = ny; }
        e.preventDefault();
    });
    const endTouch = (e) => {
        if (e.pointerId !== joyId) return;
        joyId = null;
        hideRing();
    };
    joyZone.addEventListener('pointerup', endTouch);
    joyZone.addEventListener('pointercancel', endTouch);

    // -------------------------------------------------------------------------
    actionBtn.addEventListener('pointerdown', (e) => {
        input.actionEdge = true;
        actionBtn.classList.add('pressed');
        e.preventDefault();
    });
    const release = () => actionBtn.classList.remove('pressed');
    actionBtn.addEventListener('pointerup', release);
    actionBtn.addEventListener('pointercancel', release);

    // لمس اللوحة نفسها = محاولة تفاعل أيضًا — tapping the canvas also interacts
    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') input.actionEdge = true;
    });

    // منع قوائم اللمس الطويل والتكبير المزدوج — no context menu / dbl-tap zoom
    window.addEventListener('contextmenu', (e) => {
        if (e.target.closest?.('#game')) e.preventDefault();
    });
}
