import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cardTokens, eliteShapeError, isContiguousSubset } from './validate-words';
import {
  loadBatch,
  parseSpotcheckArgs,
  selectSpotcheckCards,
  SPOTCHECK_PICKER_PATH,
} from './word-batches';
import { scorePlayability } from './word-playability';
import { parseWordsCsv, type CsvWord } from './words-csv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, 'words-master.csv');
const OUT_PATH = join(__dirname, 'audit', 'elite-review-picker.html');

interface PickerCard {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  status: string;
  kind: 'new-review' | 'hard-candidate' | 'hard-refill';
  alias: number;
  crocodile: number;
  association: number;
  pass: boolean;
  subsetOf: string | null;
  shapeError: string | null;
}

function subsetOf(word: CsvWord, others: CsvWord[]): string | null {
  const tokens = cardTokens(word.text);
  let best: CsvWord | undefined;
  let bestLen = 0;
  for (const other of others) {
    if (other.id === word.id || other.status === 'reject') {
      continue;
    }
    const otherTokens = cardTokens(other.text);
    if (isContiguousSubset(otherTokens, tokens) && otherTokens.length > bestLen) {
      best = other;
      bestLen = otherTokens.length;
    }
  }
  return best?.text ?? null;
}

function toCard(word: CsvWord, kind: PickerCard['kind'], all: CsvWord[]): PickerCard {
  const score = scorePlayability(word);
  return {
    id: word.id,
    text: word.text,
    category: word.category,
    difficulty: word.difficulty,
    status: word.status,
    kind,
    alias: score.alias,
    crocodile: score.crocodile,
    association: score.association,
    pass: score.pass,
    subsetOf: subsetOf(word, all),
    shapeError: word.difficulty === 'elite' ? eliteShapeError(word) : null,
  };
}

function isHardIdiomCandidate(word: CsvWord): boolean {
  if (word.status !== 'core' || word.difficulty !== 'hard') {
    return false;
  }
  if (cardTokens(word.text).length < 2) {
    return false;
  }
  return eliteShapeError({ ...word, difficulty: 'elite' }) === null;
}

function buildPayload(words: CsvWord[]): {
  generatedAt: string;
  cards: PickerCard[];
} {
  const newReview = words.filter((word) => word.status === 'review' && word.difficulty === 'elite');
  const hardRefill = words.filter((word) => word.status === 'review' && word.difficulty === 'hard');
  const hardCandidates = words.filter(isHardIdiomCandidate);

  const cards = [
    ...newReview.map((word) => toCard(word, 'new-review', words)),
    ...hardCandidates.map((word) => toCard(word, 'hard-candidate', words)),
    ...hardRefill.map((word) => toCard(word, 'hard-refill', words)),
  ];

  return { generatedAt: new Date().toISOString(), cards };
}

function htmlPage(payloadJson: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Elite review picker</title>
  <style>
    :root {
      --bg: #0b1018; --surface: #151c28; --surface2: #1c2534; --border: #2a3548;
      --text: #e8eef7; --muted: #8b98ad; --accent: #6ee0c8; --keep: #4ade80;
      --remove: #f87171; --warn: #fbbf24; --touch: 44px; --radius: 10px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); }
    .shell { max-width: 760px; margin: 0 auto; padding: 20px 16px 120px; }
    h1 { font-size: 1.4rem; margin: 0 0 6px; }
    .sub { color: var(--muted); margin: 0 0 16px; font-size: 0.9rem; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px; font-size: 0.8rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .chip { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 999px; padding: 6px 12px; cursor: pointer; min-height: 32px; }
    .chip.active { border-color: var(--accent); color: var(--accent); }
    .search { width: 100%; min-height: var(--touch); border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); color: var(--text); padding: 0 14px; font-size: 1rem; margin-bottom: 12px; }
    .nav-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .btn { border: 1px solid var(--border); background: var(--surface2); color: var(--text); border-radius: var(--radius); padding: 10px 14px; cursor: pointer; min-height: var(--touch); }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #041018; font-weight: 700; }
    .btn.danger { border-color: #7f1d1d; color: var(--remove); }
    .btn.ghost { background: transparent; }
    .btn:disabled { opacity: 0.4; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .card.resolved { opacity: 0.6; }
    .kind { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--accent); margin-bottom: 8px; }
    .word { font-size: 2rem; font-weight: 800; margin: 0 0 8px; }
    .meta { color: var(--muted); font-size: 0.85rem; margin: 0 0 8px; }
    .scores { display: flex; gap: 10px; flex-wrap: wrap; margin: 0 0 12px; }
    .hint { color: var(--warn); font-size: 0.85rem; margin: 0 0 12px; }
    .fail { color: var(--remove); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .rewrite { width: 100%; min-height: 40px; margin-top: 10px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg); color: var(--text); padding: 0 10px; }
    .footer-bar { position: fixed; left: 0; right: 0; bottom: 0; background: #0b1018ee; border-top: 1px solid var(--border); padding: 12px 16px; }
    .footer-inner { max-width: 760px; margin: 0 auto; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .kbd { font-family: ui-monospace, monospace; background: var(--surface2); padding: 1px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>Elite review picker</h1>
      <p class="sub">A accept · R reject · ← move elite · → keep hard · H accept hard · W rewrite+accept</p>
      <div class="pills" id="progress"></div>
      <div class="chips" id="filters"></div>
      <input class="search" id="search" type="search" placeholder="Пошук…" autocomplete="off" />
      <div class="nav-row">
        <button class="btn" id="prev" type="button">← Prev</button>
        <button class="btn" id="next" type="button">Next →</button>
        <button class="btn ghost" id="undo" type="button">Undo</button>
      </div>
    </header>
    <main id="main"></main>
  </div>
  <div class="footer-bar">
    <div class="footer-inner">
      <span class="sub" id="footer-status" style="margin:0">Рішення в браузері, поки не завантажиш JSON</span>
      <button class="btn primary" id="download" type="button">Download decisions</button>
    </div>
  </div>
  <script type="application/json" id="payload">${payloadJson}</script>
  <script>
(function () {
  const STORAGE_KEY = 'kapelyuh-elite-review-v1';
  const payload = JSON.parse(document.getElementById('payload').textContent);
  const cards = payload.cards;
  const state = { filter: 'unresolved', search: '', index: 0, items: loadItems(), undo: [] };

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw).byId || {};
    } catch { return {}; }
  }
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ byId: state.items, exportedAt: new Date().toISOString() }));
  }
  function filtered() {
    const q = state.search.trim().toLowerCase();
    return cards.filter((card) => {
      if (state.filter === 'new-review' && card.kind !== 'new-review') return false;
      if (state.filter === 'hard-candidate' && card.kind !== 'hard-candidate') return false;
      if (state.filter === 'hard-refill' && card.kind !== 'hard-refill') return false;
      if (state.filter === 'unresolved' && state.items[card.id]) return false;
      if (state.filter === 'resolved' && !state.items[card.id]) return false;
      if (q && !card.text.toLowerCase().includes(q) && !card.category.includes(q)) return false;
      return true;
    });
  }
  function counts() {
    let accept = 0, reject = 0, move = 0, hard = 0, unresolved = 0;
    for (const card of cards) {
      const item = state.items[card.id];
      if (!item) unresolved += 1;
      else if (item.action === 'accept') accept += 1;
      else if (item.action === 'reject') reject += 1;
      else if (item.action === 'move-elite') move += 1;
      else if (item.action === 'accept-hard') hard += 1;
    }
    return { accept, reject, move, hard, unresolved };
  }
  function decide(card, item) {
    state.undo.push({ id: card.id, prev: state.items[card.id] ? { ...state.items[card.id] } : null });
    state.items[card.id] = item;
    persist();
    const list = filtered();
    const stillVisible = list.some((c) => c.id === card.id);
    if (stillVisible && state.index < list.length - 1) state.index += 1;
    render();
  }
  function kindLabel(kind) {
    if (kind === 'hard-candidate') return 'Hard → elite candidate';
    if (kind === 'hard-refill') return 'Hard refill review';
    return 'New elite review';
  }
  function renderCard(card) {
    const item = state.items[card.id];
    const scores = 'alias ' + card.alias + ' · crocodile ' + card.crocodile + ' · association ' + card.association +
      (card.pass ? ' · pass' : ' · FAIL');
    let actions = '';
    if (card.kind === 'new-review') {
      actions = '<button class="btn primary" data-act="accept">Accept <span class="kbd">A</span></button>' +
        '<button class="btn danger" data-act="reject">Reject <span class="kbd">R</span></button>' +
        '<button class="btn ghost" data-act="rewrite">Rewrite+accept <span class="kbd">W</span></button>';
    } else if (card.kind === 'hard-candidate') {
      actions = '<button class="btn primary" data-act="move-elite">Move elite <span class="kbd">←</span></button>' +
        '<button class="btn ghost" data-act="keep-hard">Keep hard <span class="kbd">→</span></button>';
    } else {
      actions = '<button class="btn primary" data-act="accept-hard">Accept hard <span class="kbd">H</span></button>' +
        '<button class="btn danger" data-act="reject">Reject <span class="kbd">R</span></button>';
    }
    const hints = [];
    if (card.subsetOf) hints.push('subset of «' + card.subsetOf + '»');
    if (card.shapeError) hints.push(card.shapeError);
    if (item) hints.push('decision: ' + item.action + (item.text ? ' → ' + item.text : ''));
    return '<article class="card' + (item ? ' resolved' : '') + '">' +
      '<div class="kind">' + kindLabel(card.kind) + '</div>' +
      '<p class="word"></p>' +
      '<p class="meta">' + card.category + ' · ' + card.difficulty + ' · ' + card.status + ' · ' + card.id + '</p>' +
      '<p class="meta scores' + (card.pass ? '' : ' fail') + '">' + scores + '</p>' +
      (hints.length ? '<p class="hint">' + hints.join(' · ') + '</p>' : '') +
      '<div class="actions">' + actions + '</div>' +
      '<input class="rewrite" id="rewrite" placeholder="Новий текст для rewrite" value="' + (item && item.text ? item.text : '') + '" />' +
      '</article>';
  }
  function bind(card) {
    const root = document.querySelector('.card');
    if (!root) return;
    root.querySelector('.word').textContent = card.text;
    root.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-act');
        if (action === 'rewrite') {
          const text = (document.getElementById('rewrite').value || '').trim();
          if (!text) { alert('Впиши новий текст'); return; }
          decide(card, { id: card.id, action: 'rewrite', text, accept: true });
          return;
        }
        decide(card, { id: card.id, action });
      });
    });
  }
  function exportDecisions() {
    const items = Object.values(state.items).sort((a, b) => a.id.localeCompare(b.id));
    return { items, exportedAt: new Date().toISOString(), meta: { generatedAt: payload.generatedAt, total: cards.length } };
  }
  function render() {
    const list = filtered();
    if (state.index >= list.length) state.index = Math.max(0, list.length - 1);
    const c = counts();
    document.getElementById('progress').innerHTML =
      '<span class="pill">' + (list.length ? state.index + 1 : 0) + ' / ' + list.length + '</span>' +
      '<span class="pill">accept ' + c.accept + '</span>' +
      '<span class="pill">reject ' + c.reject + '</span>' +
      '<span class="pill">move ' + c.move + '</span>' +
      '<span class="pill">hard ' + c.hard + '</span>' +
      '<span class="pill">open ' + c.unresolved + '</span>';
    const filters = [['unresolved','Open'],['new-review','New'],['hard-candidate','Hard→elite'],['hard-refill','Hard refill'],['resolved','Done'],['all','All']];
    document.getElementById('filters').innerHTML = filters.map(([id, label]) =>
      '<button type="button" class="chip' + (state.filter === id ? ' active' : '') + '" data-filter="' + id + '">' + label + '</button>'
    ).join('');
    const main = document.getElementById('main');
    const card = list[state.index];
    if (!card) {
      main.innerHTML = '<p class="sub">Немає карток у цьому фільтрі.</p>';
    } else {
      main.innerHTML = renderCard(card);
      bind(card);
    }
    document.getElementById('prev').disabled = state.index <= 0;
    document.getElementById('next').disabled = !list.length || state.index >= list.length - 1;
  }
  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    state.filter = btn.getAttribute('data-filter');
    state.index = 0;
    render();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    state.search = e.target.value;
    state.index = 0;
    render();
  });
  document.getElementById('prev').addEventListener('click', () => { if (state.index > 0) { state.index -= 1; render(); } });
  document.getElementById('next').addEventListener('click', () => {
    const list = filtered();
    if (state.index < list.length - 1) { state.index += 1; render(); }
  });
  document.getElementById('undo').addEventListener('click', () => {
    const entry = state.undo.pop();
    if (!entry) return;
    if (entry.prev) state.items[entry.id] = entry.prev;
    else delete state.items[entry.id];
    persist();
    render();
  });
  document.getElementById('download').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportDecisions(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'elite-review-decisions.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  let keyHeld = false;
  document.addEventListener('keyup', () => { keyHeld = false; });
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.repeat || keyHeld) return;
    const list = filtered();
    const card = list[state.index];
    if (!card) return;
    const key = e.key.toLowerCase();
    const decideOnce = (item) => {
      keyHeld = true;
      e.preventDefault();
      decide(card, item);
    };
    if (key === 'a' && card.kind === 'new-review') { decideOnce({ id: card.id, action: 'accept' }); return; }
    if (key === 'r' && card.kind !== 'hard-candidate') { decideOnce({ id: card.id, action: 'reject' }); return; }
    if ((key === 'm' || key === 'arrowleft') && card.kind === 'hard-candidate') {
      decideOnce({ id: card.id, action: 'move-elite' });
      return;
    }
    if ((key === 'k' || key === 'arrowright') && card.kind === 'hard-candidate') {
      decideOnce({ id: card.id, action: 'keep-hard' });
      return;
    }
    if (key === 'h' && card.kind === 'hard-refill') { decideOnce({ id: card.id, action: 'accept-hard' }); return; }
    if (key === 'arrowleft' && state.index > 0) { e.preventDefault(); state.index -= 1; render(); }
    if (key === 'arrowright' && state.index < list.length - 1) { e.preventDefault(); state.index += 1; render(); }
  });
  render();
})();
  </script>
</body>
</html>
`;
}

function spotcheckHtmlPage(payloadJson: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Spot-check picker</title>
  <style>
    :root {
      --bg: #0b1018; --surface: #151c28; --surface2: #1c2534; --border: #2a3548;
      --text: #e8eef7; --muted: #8b98ad; --accent: #6ee0c8; --keep: #4ade80;
      --remove: #f87171; --warn: #fbbf24; --touch: 44px; --radius: 10px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); }
    .shell { max-width: 760px; margin: 0 auto; padding: 20px 16px 120px; }
    h1 { font-size: 1.4rem; margin: 0 0 6px; }
    .sub { color: var(--muted); margin: 0 0 16px; font-size: 0.9rem; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px; font-size: 0.8rem; }
    .btn { border: 1px solid var(--border); background: var(--surface2); color: var(--text); border-radius: var(--radius); padding: 10px 14px; cursor: pointer; min-height: var(--touch); }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #041018; font-weight: 700; }
    .btn.danger { border-color: #7f1d1d; color: var(--remove); }
    .btn.ghost { background: transparent; }
    .btn:disabled { opacity: 0.4; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .card.resolved { opacity: 0.6; }
    .kind { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--accent); margin-bottom: 8px; }
    .word { font-size: 2rem; font-weight: 800; margin: 0 0 8px; }
    .meta { color: var(--muted); font-size: 0.85rem; margin: 0 0 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .nav-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .footer-bar { position: fixed; left: 0; right: 0; bottom: 0; background: #0b1018ee; border-top: 1px solid var(--border); padding: 12px 16px; }
    .footer-inner { max-width: 760px; margin: 0 auto; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .kbd { font-family: ui-monospace, monospace; background: var(--surface2); padding: 1px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>Spot-check picker</h1>
      <p class="sub">A accept · R reject · 10% seeded sample. &gt;5% reject flips the whole batch to review.</p>
      <div class="pills" id="progress"></div>
      <div class="nav-row">
        <button class="btn" id="prev" type="button">← Prev</button>
        <button class="btn" id="next" type="button">Next →</button>
        <button class="btn ghost" id="undo" type="button">Undo</button>
      </div>
    </header>
    <main id="main"></main>
  </div>
  <div class="footer-bar">
    <div class="footer-inner">
      <span class="sub" id="footer-status" style="margin:0">Рішення в браузері, поки не завантажиш JSON</span>
      <button class="btn primary" id="download" type="button">Download decisions</button>
    </div>
  </div>
  <script type="application/json" id="payload">${payloadJson}</script>
  <script>
(function () {
  const payload = JSON.parse(document.getElementById('payload').textContent);
  const STORAGE_KEY = 'kapelyuh-spotcheck-' + payload.batch;
  const cards = payload.cards;
  const state = { index: 0, items: loadItems(), undo: [] };

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw).byId || {};
    } catch { return {}; }
  }
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ byId: state.items, exportedAt: new Date().toISOString() }));
  }
  function counts() {
    let accept = 0, reject = 0, unresolved = 0;
    for (const card of cards) {
      const item = state.items[card.id];
      if (!item) unresolved += 1;
      else if (item.action === 'accept') accept += 1;
      else if (item.action === 'reject') reject += 1;
    }
    return { accept, reject, unresolved };
  }
  function decide(card, item) {
    state.undo.push({ id: card.id, prev: state.items[card.id] ? { ...state.items[card.id] } : null });
    state.items[card.id] = item;
    persist();
    if (state.index < cards.length - 1) state.index += 1;
    render();
  }
  function render() {
    const c = counts();
    document.getElementById('progress').innerHTML =
      '<span class="pill">' + (cards.length ? state.index + 1 : 0) + ' / ' + cards.length + '</span>' +
      '<span class="pill">accept ' + c.accept + '</span>' +
      '<span class="pill">reject ' + c.reject + '</span>' +
      '<span class="pill">open ' + c.unresolved + '</span>' +
      '<span class="pill">' + payload.batch + '</span>';
    const main = document.getElementById('main');
    const card = cards[state.index];
    if (!card) {
      main.innerHTML = '<p class="sub">Немає карток у вибірці.</p>';
    } else {
      const item = state.items[card.id];
      main.innerHTML = '<article class="card' + (item ? ' resolved' : '') + '">' +
        '<div class="kind">Spot-check</div>' +
        '<p class="word"></p>' +
        '<p class="meta">' + card.category + ' · ' + card.difficulty + ' · ' + card.id + '</p>' +
        '<div class="actions">' +
          '<button class="btn primary" data-act="accept">Accept <span class="kbd">A</span></button>' +
          '<button class="btn danger" data-act="reject">Reject <span class="kbd">R</span></button>' +
        '</div></article>';
      main.querySelector('.word').textContent = card.text;
      main.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('click', () => decide(card, { id: card.id, action: btn.getAttribute('data-act') }));
      });
    }
    document.getElementById('prev').disabled = state.index <= 0;
    document.getElementById('next').disabled = !cards.length || state.index >= cards.length - 1;
    document.getElementById('footer-status').textContent = c.unresolved
      ? ('Залишилось ' + c.unresolved)
      : 'Вибірку закрито — завантаж JSON';
  }
  document.getElementById('prev').addEventListener('click', () => { if (state.index > 0) { state.index -= 1; render(); } });
  document.getElementById('next').addEventListener('click', () => {
    if (state.index < cards.length - 1) { state.index += 1; render(); }
  });
  document.getElementById('undo').addEventListener('click', () => {
    const entry = state.undo.pop();
    if (!entry) return;
    if (entry.prev) state.items[entry.id] = entry.prev;
    else delete state.items[entry.id];
    persist();
    render();
  });
  document.getElementById('download').addEventListener('click', () => {
    const items = Object.values(state.items).sort((a, b) => a.id.localeCompare(b.id));
    const blob = new Blob([JSON.stringify({ batch: payload.batch, items, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spotcheck-decisions.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const card = cards[state.index];
    if (!card) return;
    const key = e.key.toLowerCase();
    if (key === 'a') { e.preventDefault(); decide(card, { id: card.id, action: 'accept' }); return; }
    if (key === 'r') { e.preventDefault(); decide(card, { id: card.id, action: 'reject' }); return; }
    if (key === 'arrowleft' && state.index > 0) { e.preventDefault(); state.index -= 1; render(); }
    if (key === 'arrowright' && state.index < cards.length - 1) { e.preventDefault(); state.index += 1; render(); }
  });
  render();
})();
  </script>
</body>
</html>
`;
}

function writeSpotcheckPicker(words: CsvWord[], batchName: string, pct: number): void {
  const batch = loadBatch(batchName);
  const sampled = selectSpotcheckCards(words, batch.ids, batch.name, pct);
  const cards = sampled.map((word) => ({
    id: word.id,
    text: word.text,
    category: word.category,
    difficulty: word.difficulty,
  }));
  const payload = {
    generatedAt: new Date().toISOString(),
    batch: batch.name,
    pct,
    totalCore: words.filter((word) => batch.ids.includes(word.id) && word.status === 'core').length,
    cards,
  };
  mkdirSync(dirname(SPOTCHECK_PICKER_PATH), { recursive: true });
  writeFileSync(
    SPOTCHECK_PICKER_PATH,
    spotcheckHtmlPage(JSON.stringify(payload).replace(/</g, '\\u003c')),
    'utf8',
  );
  console.log(`Wrote ${SPOTCHECK_PICKER_PATH}`);
  console.log(`Spot-check ${batch.name}: ${cards.length} of ${payload.totalCore} core (${pct}%)`);
}

function main(): void {
  const words = parseWordsCsv(readFileSync(CSV_PATH, 'utf8'));
  const spotcheck = parseSpotcheckArgs(process.argv);
  if (spotcheck) {
    if (!spotcheck.batch) {
      console.error('Usage: npm run words:spotcheck-html -- <batch> [--pct 10]');
      process.exit(1);
    }
    if (!Number.isFinite(spotcheck.pct) || spotcheck.pct <= 0) {
      console.error('--pct must be a positive number');
      process.exit(1);
    }
    writeSpotcheckPicker(words, spotcheck.batch, spotcheck.pct);
    return;
  }

  const payload = buildPayload(words);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, htmlPage(JSON.stringify(payload).replace(/</g, '\\u003c')), 'utf8');
  const byKind = payload.cards.reduce<Record<string, number>>((counts, card) => {
    counts[card.kind] = (counts[card.kind] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`Wrote ${OUT_PATH}`);
  console.log(
    `Cards: ${payload.cards.length} (new ${byKind['new-review'] ?? 0}, hard-candidates ${byKind['hard-candidate'] ?? 0}, hard-refill ${byKind['hard-refill'] ?? 0})`,
  );
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('build-elite-picker.ts')) {
  main();
}
