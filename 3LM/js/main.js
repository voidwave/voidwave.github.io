// نقطة البداية: التحميل، الحلقة الرئيسية، ربط الواجهة بالإدخال
// Boot & main loop: load questions, wire UI, run the game.
import { TEXT, text, VIEW, RULES, ZONES } from './config.js';
import { loadQuestions } from './data/questions.js';
import { bakeAll } from './render/sprites.js';
import { render } from './render/renderer.js';
import {
    state, startRun, movePlayer, touchingDoor, startTransition, updateTransition,
    findInteractable, openQuiz, answerQuiz, closeQuiz, openChest, gateOpen,
    updateParticles, accuracy, elapsedSeconds, currentRoom, unstickPlayer,
} from './game/state.js';
import { attachInput, input } from './engine/input.js';
import { initAudio, sfx, setMuted, isMuted } from './engine/audio.js';
import * as hud from './ui/hud.js';
import * as quizUI from './ui/quiz.js';
import * as screens from './ui/screens.js';

// أداة تطوير بسيطة: افحص الحالة من الكونسول عبر window.__rk
// Tiny dev hook: inspect state from the console via window.__rk
window.__rk = { state, input, RULES, touchingDoor, startTransition };

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
ctx.imageSmoothingEnabled = false;

let questionResult = null;
let interact = null;
let stepTimer = 0;
let faintShown = false;
let victoryHandled = false;

boot();

async function boot() {
    bakeAll();
    hud.mountHUD();
    quizUI.mountQuiz();
    hud.setMuteIcon(isMuted());
    attachInput({
        joyZone: document.getElementById('joyZone'),
        joyRing: document.getElementById('joyRing'),
        joyKnob: document.getElementById('joyKnob'),
        actionBtn: document.getElementById('actionBtn'),
        canvas,
        onMuteToggle: toggleMute,
    });
    wireButtons();
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 120));
    document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') document.body.classList.add('touch');
    }, { capture: true, once: true });

    screens.showLoading();
    await loadAndShowTitle();
    requestAnimationFrame(frame);
}

async function loadAndShowTitle() {
    try {
        questionResult = await loadQuestions();
        screens.showTitle({
            onStart: startGame,
            meta: { source: questionResult.source, loaded: questionResult.items.length },
        });
    } catch (err) {
        console.error('[questions]', err);
        screens.showError('', () => { screens.showLoading(); loadAndShowTitle(); });
    }
}

function startGame() {
    initAudio();
    sfx('click');
    victoryHandled = false;
    startRun(questionResult);
    screens.hide();
    hud.update(true);
    if (questionResult.source === 'fallback') hud.toast(TEXT.fallbackNotice, 4200);
    hud.toast(state.world.zones[0].enterText, 3200);
}

async function newJourney() {
    sfx('click');
    screens.showLoading();
    try {
        questionResult = await loadQuestions(); // إعادة جلب الجدول كل رحلة جديدة
    } catch (err) {
        console.error('[questions]', err); // نكمل بالنسخة السابقة
    }
    victoryHandled = false;
    startRun(questionResult);
    screens.hide();
    hud.update(true);
    if (questionResult.source === 'fallback') hud.toast(TEXT.fallbackNotice, 4200);
    hud.toast(state.world.zones[0].enterText, 3200);
}

// ---------------------------------------------------------------------------
// الإعدادات والأزرار — settings & buttons
// ---------------------------------------------------------------------------
function wireButtons() {
    document.getElementById('mapBtn').addEventListener('click', () => { sfx('click'); hud.toggleMap(); });
    document.getElementById('muteBtn').addEventListener('click', toggleMute);
    document.getElementById('fsBtn').addEventListener('click', async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch { /* غير مدعوم */ }
    });
}

function toggleMute() {
    const m = !isMuted();
    setMuted(m);
    hud.setMuteIcon(m);
    if (!m) sfx('click');
}

function fitCanvas() {
    const stage = document.getElementById('stage');
    const aw = Math.max(120, stage.clientWidth - 14);
    const ah = Math.max(140, stage.clientHeight - 14);
    let scale = Math.min(aw / VIEW.width, ah / VIEW.height);
    if (scale >= 2) scale = Math.floor(scale);
    else if (scale >= 1) scale = Math.floor(scale * 2) / 2;
    canvas.style.width = `${Math.round(VIEW.width * scale)}px`;
    canvas.style.height = `${Math.round(VIEW.height * scale)}px`;
}

// ---------------------------------------------------------------------------
// الحلقة — main loop
// ---------------------------------------------------------------------------
let last = performance.now();

function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now / 1000);
    if (state.world) render(ctx, interact, now / 1000);
    requestAnimationFrame(frame);
}

function update(dt, now) {
    updateParticles(dt);
    if (!state.world) return;

    // إشعار فتح بوابة جديدة — celebrate newly unlocked gates
    for (const info of state.world.gateInfo) {
        if (!info.notified && state.keys >= info.gate.requires) {
            info.notified = true;
            if (state.phase !== 'boot') { sfx('unlock'); hud.toast(TEXT.gateUnlockedToast, 3000); }
        }
    }

    if (state.phase === 'play') {
        unstickPlayer(); // لا يبقى اللاعب عالقًا داخل أي صندوق — never freeze inside a solid
        updatePlayer(dt);
        interact = findInteractable();
        const door = touchingDoor(input.x, input.y);
        if (door) {
            if (door.gate && !gateOpen(door.gate)) {
                if (now - state.gateToastAt > 2.2) {
                    state.gateToastAt = now;
                    sfx('locked');
                    hud.toast(text(TEXT.gateLockedToast, { n: door.gate.requires }), 2400);
                }
            } else {
                sfx('door');
                startTransition(door);
                interact = null;
            }
        }
    } else {
        state.player.moving = false;
    }

    if (state.phase === 'transition') {
        updateTransition(dt);
        if (state.phase === 'play' || state.phase === 'victory') {
            hud.update(true);
            const room = currentRoom();
            if (!state.visitedZones.has(room.zoneIndex)) {
                state.visitedZones.add(room.zoneIndex);
                const zoneDef = ZONES[room.zoneIndex];
                if (zoneDef) hud.toast(zoneDef.enterText, 3000);
            }
            if (state.phase === 'victory' && !victoryHandled) {
                victoryHandled = true;
                sfx('victory');
                showVictoryScreen();
            }
        }
    }

    if (state.phase === 'faint' && !faintShown) {
        faintShown = true;
        sfx('faint');
        screens.showFaint();
        setTimeout(() => { state.phase = 'play'; faintShown = false; hud.update(true); }, 1650);
    }

    if (input.consumeAction() && state.phase === 'play' && interact) {
        if (interact.type === 'npc') {
            sfx('click');
            openQuiz(currentRoom());
            quizUI.openQuizModal({ onAnswer, onLeave: leaveQuiz });
        } else if (interact.type === 'chest') {
            const res = openChest();
            if (res) {
                sfx(res.kind === 'heart' ? 'heart' : 'chest');
                hud.toast(res.kind === 'heart' ? TEXT.heartFound : TEXT.chestOpened, 2200);
                hud.update(true);
            }
        } else if (interact.type === 'gate') {
            sfx('locked');
            hud.toast(text(TEXT.gateLockedToast, { n: interact.door.gate.requires }), 2400);
        } else if (interact.type === 'npcDone') {
            sfx('click');
            hud.toast(TEXT.thanksAgain, 2000);
        }
    }
    if (input.consumeCancel() && state.phase === 'quiz') leaveQuiz();
}

function updatePlayer(dt) {
    const p = state.player;
    const spd = RULES.playerSpeed;
    const moving = Math.abs(input.x) + Math.abs(input.y) > 0.06;
    p.moving = moving;
    if (!moving) { p.walkPhase = 0; stepTimer = 0; return; }
    if (Math.abs(input.x) > Math.abs(input.y)) p.dir = input.x > 0 ? 'right' : 'left';
    else p.dir = input.y > 0 ? 'down' : 'up';
    movePlayer(input.x * spd * dt, input.y * spd * dt, dt);
    p.walkPhase += dt * 6;
    stepTimer -= dt;
    if (stepTimer <= 0) { sfx('step'); stepTimer = 0.32; }
    hud.hideMapOnMove();
}

// ---------------------------------------------------------------------------
// الأسئلة — quiz callbacks
// ---------------------------------------------------------------------------
function onAnswer(optionIndex) {
    const res = answerQuiz(optionIndex);
    if (!res) return;
    if (res.correct) {
        sfx('correct');
        quizUI.showCorrect(res);
        hud.update(true);
    } else if (res.faint) {
        sfx('wrong');
        quizUI.closeQuizModal();
        hud.update(true);
    } else {
        sfx('wrong');
        quizUI.showWrong(optionIndex, res.hearts);
        hud.update(true);
    }
}

function leaveQuiz() {
    quizUI.closeQuizModal();
    closeQuiz();
}

// ---------------------------------------------------------------------------
// النصر — victory
// ---------------------------------------------------------------------------
function showVictoryScreen() {
    const acc = Math.round(accuracy() * 100);
    const secs = Math.round(elapsedSeconds());
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const rank = acc >= 90 ? TEXT.rankHigh : acc >= 70 ? TEXT.rankMid : TEXT.rankLow;
    screens.showVictory({
        stats: { score: state.score, keys: state.keys, accuracy: acc, mistakes: state.stats.mistakes, time, rank },
        onNewRun: newJourney,
    });
}
