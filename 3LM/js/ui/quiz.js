// نافذة السؤال — the question modal (RTL, 4 answers, hearts, feedback)
import { TEXT } from '../config.js';
import { state } from '../game/state.js';
import { drawSprite } from '../render/sprites.js';

let root = null;
let handlers = {};
let els = {};

export function mountQuiz() {
    root = document.getElementById('quiz');
}

/** فتح نافذة السؤال — open the quiz modal for the current quiz state */
export function openQuizModal(callbacks) {
    handlers = callbacks;
    const quiz = state.quiz;
    const room = state.world.rooms.get(quiz.roomId);
    const npc = room.npc;

    root.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-head">
        <canvas class="npc-portrait" width="36" height="48"></canvas>
        <div class="npc-meta">
          <div class="npc-name">${npc.name}</div>
          <div class="npc-line">${quiz.greeting}</div>
        </div>
        <div class="quiz-hearts" id="quizHearts"></div>
      </div>
      <div class="quiz-q">${quiz.q}</div>
      <div class="quiz-answers" id="quizAnswers"></div>
      <div class="quiz-foot">
        <div class="quiz-progress">أجبت ${quiz.solvedCount} من ${quiz.total}</div>
        <button class="leave" id="quizLeave">${TEXT.leaveQuiz}</button>
      </div>
    </div>`;

    const portrait = root.querySelector('.npc-portrait');
    const pctx = portrait.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.save();
    pctx.scale(3, 3);
    drawSprite(pctx, npc.sprite, 6, 16);
    pctx.restore();

    els = {
        card: root.querySelector('.quiz-card'),
        answers: root.querySelector('#quizAnswers'),
        hearts: root.querySelector('#quizHearts'),
        leave: root.querySelector('#quizLeave'),
        foot: root.querySelector('.quiz-foot'),
    };

    quiz.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer';
        btn.textContent = opt;
        btn.addEventListener('click', () => handlers.onAnswer(i));
        els.answers.appendChild(btn);
    });
    els.leave.addEventListener('click', () => handlers.onLeave());
    renderHearts(quiz.total, state.hearts);
    root.classList.remove('hidden');
}

function renderHearts(total, hearts) {
    els.hearts.innerHTML = '';
    for (let i = 0; i < Math.max(3, hearts); i++) {
        const span = document.createElement('span');
        span.className = 'qh' + (i < hearts ? '' : ' empty');
        span.textContent = '♥';
        els.hearts.appendChild(span);
    }
}

/** إجابة صحيحة: تلوين الخيار + مكافأة — correct feedback */
export function showCorrect(result) {
    const buttons = [...els.answers.children];
    buttons[state.quiz.correctIndex].classList.add('correct');
    buttons.forEach((b, i) => { if (i !== state.quiz.correctIndex) b.classList.add('dim'); b.disabled = true; });
    const reward = document.createElement('div');
    reward.className = 'quiz-reward';
    reward.innerHTML = `<span class="chip gold">+${result.points} نقطة</span><span class="chip key">مفتاح +1</span>`;
    els.card.appendChild(reward);
    els.leave.textContent = 'متابعة';
    els.leave.classList.add('primary');
    root.classList.add('correct');
}

/** إجابة خاطئة: تعطيل الخيار ونقص قلب — wrong feedback */
export function showWrong(optionIndex, hearts) {
    const buttons = [...els.answers.children];
    const btn = buttons[optionIndex];
    btn.classList.add('wrong');
    btn.disabled = true;
    els.card.classList.remove('shake');
    void els.card.offsetWidth; // إعادة تشغيل الاهتزاز
    els.card.classList.add('shake');
    renderHearts(state.quiz.total, hearts);
}

export function closeQuizModal() {
    root.classList.add('hidden');
    root.classList.remove('correct');
    root.innerHTML = '';
}
