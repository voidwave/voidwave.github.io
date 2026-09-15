// الشاشات: التحميل، الخطأ، البداية، الإغماء، النصر
// Overlay screens: loading, error, title, faint, victory.
import { TEXT } from '../config.js';

const container = () => document.getElementById('screens');

export function showLoading() {
    container().innerHTML = `
    <div class="screen-card">
      <div class="screen-title">${TEXT.appTitle}</div>
      <div class="spinner"></div>
      <div class="screen-text">${TEXT.loading}</div>
      <div class="screen-hint">${TEXT.loadingHint}</div>
    </div>`;
    container().classList.remove('hidden');
}

export function showError(msg, onRetry) {
    container().innerHTML = `
    <div class="screen-card">
      <div class="screen-title">${TEXT.loadError}</div>
      <div class="screen-text">${msg ?? ''}</div>
      <button class="btn primary" id="retryBtn">${TEXT.retry}</button>
    </div>`;
    container().classList.remove('hidden');
    container().querySelector('#retryBtn').addEventListener('click', onRetry);
}

export function showTitle({ onStart, meta }) {
    const source = meta.source === 'fallback'
        ? `<div class="screen-hint warn">${TEXT.fallbackNotice}</div>`
        : '';
    container().innerHTML = `
    <div class="screen-card title-card">
      <div class="ornament">✦ ✦ ✦</div>
      <div class="screen-title big">${TEXT.appTitle}</div>
      <div class="screen-subtitle">${TEXT.appSubtitle}</div>
      <div class="ornament">۞</div>
      <div class="screen-text">${TEXT.startButton ? '' : ''}عدد الأسئلة المحمّلة: ${meta.loaded}</div>
      ${source}
      <button class="btn primary big" id="startBtn">${TEXT.startButton}</button>
      <div class="screen-hint">${TEXT.controlsDesktop}</div>
      <div class="screen-hint">${TEXT.controlsMobile}</div>
    </div>`;
    container().classList.remove('hidden');
    container().querySelector('#startBtn').addEventListener('click', onStart);
}

export function showFaint() {
    const div = document.createElement('div');
    div.className = 'faint-overlay';
    div.innerHTML = `<div class="screen-card faint-card">
      <div class="screen-title">${TEXT.faintTitle}</div>
      <div class="screen-text">${TEXT.faintText}</div>
    </div>`;
    container().appendChild(div);
    container().classList.remove('hidden');
    setTimeout(() => { div.remove(); if (!container().children.length) container().classList.add('hidden'); }, 1700);
}

export function showVictory({ onNewRun, stats }) {
    container().innerHTML = `
    <div class="screen-card victory-card">
      <div class="ornament">✦ ۞ ✦</div>
      <div class="screen-title big">${TEXT.victoryTitle}</div>
      <div class="screen-text">${TEXT.victoryText}</div>
      <div class="rank">${stats.rank}</div>
      <div class="stats-grid">
        <div class="stat"><span>${TEXT.statScore}</span><b>${stats.score}</b></div>
        <div class="stat"><span>${TEXT.statKeys}</span><b>${stats.keys}</b></div>
        <div class="stat"><span>${TEXT.statAccuracy}</span><b>${stats.accuracy}%</b></div>
        <div class="stat"><span>${TEXT.statMistakes}</span><b>${stats.mistakes}</b></div>
        <div class="stat"><span>${TEXT.statTime}</span><b>${stats.time}</b></div>
      </div>
      <button class="btn primary big" id="newRunBtn">${TEXT.newJourney}</button>
    </div>`;
    container().classList.remove('hidden');
    container().querySelector('#newRunBtn').addEventListener('click', onNewRun);
}

export function hide() {
    container().classList.add('hidden');
    container().innerHTML = '';
}

export const isVisible = () => !container().classList.contains('hidden');
