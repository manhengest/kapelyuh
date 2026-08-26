import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseWordsCsv, type CsvWord } from './words-csv';
import { normalizeTextKey } from './words-id';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, 'words-master.csv');
const OUT_PATH = join(__dirname, 'audit', 'word-conflict-picker.html');

type ClusterBucket = 'already_grouped' | 'phonetic' | 'family';

interface ClusterWord {
  id: string;
  text: string;
  difficulty: string;
  category: string;
  status: string;
  group: string;
}

interface Cluster {
  key: string;
  bucket: ClusterBucket;
  existingGroup?: string;
  words: ClusterWord[];
  pairHints: string[];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prevDiag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length]!;
}

const PREFIX_SUFFIXES = new Set(['и', 'і', 'ки', 'ка', 'ок', 'ик', 'ік', 'ко']);

const STEM_SUFFIXES = new Set([
  'ка',
  'ок',
  'ик',
  'ік',
  'инка',
  'енька',
  'ечка',
  'енько',
  'атко',
  'ар',
  'арка',
  'ист',
  'іст',
  'ник',
  'ець',
  'иця',
  'ство',
  'ення',
  'ики',
  'ці',
  'чик',
  'щик',
  'нка',
  'текар',
  'текарка',
]);

function isFamilyPair(aKey: string, bKey: string): boolean {
  if (aKey === bKey) return false;
  if (Math.max(aKey.length, bKey.length) < 5) return false;
  if (levenshtein(aKey, bKey) === 1) return false;

  const [shorter, longer] = aKey.length <= bKey.length ? [aKey, bKey] : [bKey, aKey];
  if (longer.startsWith(shorter) && shorter.length >= 5) {
    const suffix = longer.slice(shorter.length);
    if (suffix.length >= 1 && suffix.length <= 6) {
      if (PREFIX_SUFFIXES.has(suffix) || STEM_SUFFIXES.has(suffix)) {
        return true;
      }
    }
  }

  let lcp = 0;
  while (lcp < aKey.length && lcp < bKey.length && aKey[lcp] === bKey[lcp]) {
    lcp += 1;
  }
  if (lcp < 5) return false;

  const suffixA = aKey.slice(lcp);
  const suffixB = bKey.slice(lcp);
  if (suffixA.length < 2 || suffixB.length < 2) return false;
  if (suffixA.length > 6 || suffixB.length > 6) return false;

  return STEM_SUFFIXES.has(suffixA) && STEM_SUFFIXES.has(suffixB);
}

function clusterKeyFromTexts(texts: string[]): string {
  return [...texts].sort((a, b) => a.localeCompare(b, 'uk')).join('|');
}

function toClusterWord(word: CsvWord): ClusterWord {
  return {
    id: word.id,
    text: word.text.normalize('NFC'),
    difficulty: word.difficulty,
    category: word.category,
    status: word.status,
    group: word.group,
  };
}

class UnionFind {
  private parent = new Map<string, string>();

  add(id: string): void {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }

  find(id: string): string {
    const parent = this.parent.get(id);
    if (!parent || parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    this.add(a);
    this.add(b);
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }

  components(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      const list = groups.get(root) ?? [];
      list.push(id);
      groups.set(root, list);
    }
    return groups;
  }
}

function findPhoneticPairs(words: CsvWord[]): Array<[string, string, string]> {
  const pairs: Array<[string, string, string]> = [];
  const buckets = new Map<string, CsvWord[]>();

  for (const word of words) {
    const key = normalizeTextKey(word.text);
    if (key.length < 5) continue;
    const prefix = key.slice(0, 3);
    const list = buckets.get(prefix) ?? [];
    list.push(word);
    buckets.set(prefix, list);
  }

  const seen = new Set<string>();
  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      const a = bucket[i]!;
      const aKey = normalizeTextKey(a.text);
      for (let j = i + 1; j < bucket.length; j += 1) {
        const b = bucket[j]!;
        const bKey = normalizeTextKey(b.text);
        if (aKey === bKey) continue;
        if (Math.abs(aKey.length - bKey.length) > 1) continue;
        if (levenshtein(aKey, bKey) !== 1) continue;

        const pairKey = [a.id, b.id].sort().join('|');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        pairs.push([a.id, b.id, `${a.text} ↔ ${b.text}`]);
      }
    }
  }

  return pairs;
}

function findFamilyPairs(words: CsvWord[]): Array<[string, string, string]> {
  const pairs: Array<[string, string, string]> = [];
  const seen = new Set<string>();
  const buckets = new Map<string, CsvWord[]>();

  for (const word of words) {
    const key = normalizeTextKey(word.text);
    if (key.length < 5) continue;
    const prefix = key.slice(0, 4);
    const list = buckets.get(prefix) ?? [];
    list.push(word);
    buckets.set(prefix, list);
  }

  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      const a = bucket[i]!;
      const aKey = normalizeTextKey(a.text);
      for (let j = i + 1; j < bucket.length; j += 1) {
        const b = bucket[j]!;
        const bKey = normalizeTextKey(b.text);
        if (!isFamilyPair(aKey, bKey)) continue;

        const pairKey = [a.id, b.id].sort().join('|');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        pairs.push([a.id, b.id, `${a.text} ~ ${b.text}`]);
      }
    }
  }

  return pairs;
}

function buildClusters(words: CsvWord[]): Cluster[] {
  const live = words.filter((word) => word.status !== 'reject');
  const byId = new Map(live.map((word) => [word.id, word]));

  const groupedIds = new Set<string>();
  const alreadyGrouped: Cluster[] = [];

  const byGroup = new Map<string, CsvWord[]>();
  for (const word of live) {
    if (!word.group) continue;
    const list = byGroup.get(word.group) ?? [];
    list.push(word);
    byGroup.set(word.group, list);
  }

  for (const [group, members] of byGroup) {
    if (members.length < 2) continue;
    const clusterWords = members.map(toClusterWord);
    for (const word of members) groupedIds.add(word.id);
    alreadyGrouped.push({
      key: `group:${group}`,
      bucket: 'already_grouped',
      existingGroup: group,
      words: clusterWords,
      pairHints: [`existing group: ${group}`],
    });
  }

  const candidateWords = live.filter((word) => !groupedIds.has(word.id));

  const phoneticPairs = findPhoneticPairs(candidateWords);
  const familyPairs = findFamilyPairs(candidateWords);

  const phoneticEdgeIds = new Set<string>();
  for (const [a, b] of phoneticPairs) {
    phoneticEdgeIds.add(`${a}|${b}`);
    phoneticEdgeIds.add(`${b}|${a}`);
  }

  const uf = new UnionFind();
  const hintsByRoot = new Map<string, Set<string>>();
  const phoneticRoots = new Set<string>();

  const addPair = (a: string, b: string, hint: string, phonetic: boolean) => {
    uf.union(a, b);
    const root = uf.find(a);
    const hints = hintsByRoot.get(root) ?? new Set<string>();
    hints.add(hint);
    hintsByRoot.set(root, hints);
    if (phonetic) phoneticRoots.add(root);
  };

  for (const [a, b, hint] of phoneticPairs) addPair(a, b, hint, true);
  for (const [a, b, hint] of familyPairs) addPair(a, b, hint, false);

  const conflictClusters: Cluster[] = [];
  for (const memberIds of uf.components().values()) {
    if (memberIds.length < 2) continue;

    const clusterWords = memberIds
      .map((id) => byId.get(id))
      .filter((word): word is CsvWord => Boolean(word))
      .map(toClusterWord)
      .sort((a, b) => a.text.localeCompare(b.text, 'uk'));

    const root = uf.find(memberIds[0]!);
    const bucket: ClusterBucket = phoneticRoots.has(root) ? 'phonetic' : 'family';

    conflictClusters.push({
      key: clusterKeyFromTexts(clusterWords.map((word) => word.text)),
      bucket,
      words: clusterWords,
      pairHints: [...(hintsByRoot.get(root) ?? [])].sort(),
    });
  }

  conflictClusters.sort((a, b) => a.key.localeCompare(b.key, 'uk'));

  return [...alreadyGrouped.sort((a, b) => (a.existingGroup ?? '').localeCompare(b.existingGroup ?? '')), ...conflictClusters];
}

function renderHtml(clusters: Cluster[], generatedAt: string): string {
  const meta = {
    generatedAt,
    source: 'scripts/words-master.csv',
    clusterCount: clusters.length,
    byBucket: {
      already_grouped: clusters.filter((cluster) => cluster.bucket === 'already_grouped').length,
      phonetic: clusters.filter((cluster) => cluster.bucket === 'phonetic').length,
      family: clusters.filter((cluster) => cluster.bucket === 'family').length,
    },
  };

  const dataJson = JSON.stringify({ meta, clusters }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kapelyuh — Word Conflict Picker</title>
  <style>
    :root {
      --bg: #0f1419;
      --surface: #1a2332;
      --surface2: #243044;
      --border: #334155;
      --text: #e8edf4;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-dim: #0ea5e933;
      --keep: #22c55e;
      --keep-bg: #14532d66;
      --remove: #f87171;
      --warn: #fbbf24;
      --radius: 12px;
      --touch: 48px;
      font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.4;
    }
    .shell {
      max-width: 720px;
      margin: 0 auto;
      padding: 16px 16px 120px;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      background: linear-gradient(var(--bg) 70%, transparent);
      padding-bottom: 8px;
    }
    h1 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .sub { color: var(--muted); font-size: 0.85rem; margin: 0 0 12px; }
    .progress-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
      font-size: 0.85rem;
    }
    .pill {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 4px 10px;
      color: var(--muted);
    }
    .pill strong { color: var(--text); }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .chip {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 0.8rem;
      cursor: pointer;
      min-height: 32px;
    }
    .chip.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
    .search {
      width: 100%;
      min-height: var(--touch);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      padding: 0 14px;
      font-size: 1rem;
      margin-bottom: 12px;
    }
    .nav-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .btn {
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      border-radius: var(--radius);
      padding: 10px 14px;
      font-size: 0.9rem;
      cursor: pointer;
      min-height: var(--touch);
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #041018; font-weight: 700; }
    .btn.danger { border-color: #7f1d1d; color: var(--remove); }
    .btn.ghost { background: transparent; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .card.resolved { opacity: 0.55; }
    .bucket {
      display: inline-block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .hints { color: var(--muted); font-size: 0.8rem; margin: 0 0 12px; }
    .word-grid { display: grid; gap: 10px; }
    .word-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      width: 100%;
      min-height: var(--touch);
      padding: 12px 14px;
      border-radius: var(--radius);
      border: 2px solid var(--border);
      background: var(--surface2);
      color: var(--text);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .word-btn:hover { border-color: var(--accent); }
    .word-btn.selected {
      border-color: var(--keep);
      background: var(--keep-bg);
      box-shadow: inset 0 0 0 1px var(--keep);
    }
    .word-text {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .word-meta {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 4px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .actions .btn { min-height: 40px; font-size: 0.82rem; }
    .group-input {
      width: 100%;
      min-height: 40px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      padding: 0 10px;
      margin-top: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.85rem;
    }
    .footer-bar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      background: #0b1018ee;
      backdrop-filter: blur(8px);
      border-top: 1px solid var(--border);
      padding: 12px 16px;
    }
    .footer-inner {
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    .summary {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      font-size: 0.85rem;
      white-space: pre-wrap;
      color: var(--muted);
      max-height: 200px;
      overflow: auto;
    }
    .kbd { font-family: ui-monospace, monospace; background: var(--surface2); padding: 1px 5px; border-radius: 4px; }
    .status-done { color: var(--keep); font-weight: 600; }
    .status-skip { color: var(--warn); }
    .empty { text-align: center; color: var(--muted); padding: 48px 16px; }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <h1>Word Conflict Picker</h1>
      <p class="sub">Капелюх — review similar words. Click to <strong>keep</strong>; unclicked words are marked <strong>remove</strong> on confirm.</p>
      <div class="progress-row" id="progress"></div>
      <div class="chips" id="filters"></div>
      <input class="search" id="search" type="search" placeholder="Search Ukrainian text…" autocomplete="off" />
      <div class="nav-row">
        <button class="btn" id="prev" type="button">← Prev</button>
        <button class="btn" id="next" type="button">Next →</button>
        <button class="btn ghost" id="undo" type="button">Undo <span class="kbd">U</span></button>
      </div>
    </header>
    <main id="main"></main>
    <section style="margin-top:24px">
      <h2 style="font-size:0.95rem;margin:0 0 8px">Summary</h2>
      <div class="summary" id="summary">No decisions yet.</div>
    </section>
  </div>
  <div class="footer-bar">
    <div class="footer-inner">
      <span id="footer-status" class="sub" style="margin:0">Offline · decisions stay in browser until download</span>
      <button class="btn primary" id="download" type="button">Download decisions</button>
    </div>
  </div>

  <script type="application/json" id="cluster-data">${dataJson}</script>
  <script>
(function () {
  const STORAGE_KEY = 'kapelyuh-conflict-decisions-v1';
  const payload = JSON.parse(document.getElementById('cluster-data').textContent);
  const allClusters = payload.clusters;

  const state = {
    filter: 'all',
    search: '',
    index: 0,
    selected: new Map(),
    decisions: loadDecisions(),
    undoStack: [],
  };

  function loadDecisions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshDecisions();
      const parsed = JSON.parse(raw);
      return {
        keepIds: new Set(parsed.keepIds || []),
        removeIds: new Set(parsed.removeIds || []),
        groupAssignments: parsed.groupAssignments || [],
        skippedClusterKeys: new Set(parsed.skippedClusterKeys || []),
        alreadyGroupedConfirmed: new Set(parsed.alreadyGroupedConfirmed || []),
        ungroupRequested: new Set(parsed.ungroupRequested || []),
        resolved: parsed.resolved || {},
      };
    } catch {
      return freshDecisions();
    }
  }

  function freshDecisions() {
    return {
      keepIds: new Set(),
      removeIds: new Set(),
      groupAssignments: [],
      skippedClusterKeys: new Set(),
      alreadyGroupedConfirmed: new Set(),
      ungroupRequested: new Set(),
      resolved: {},
    };
  }

  function persist() {
    const d = state.decisions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      keepIds: [...d.keepIds],
      removeIds: [...d.removeIds],
      groupAssignments: d.groupAssignments,
      skippedClusterKeys: [...d.skippedClusterKeys],
      alreadyGroupedConfirmed: [...d.alreadyGroupedConfirmed],
      ungroupRequested: [...d.ungroupRequested],
      resolved: d.resolved,
    }));
  }

  function clusterStatus(cluster) {
    if (state.decisions.skippedClusterKeys.has(cluster.key)) return 'skipped';
    const r = state.decisions.resolved[cluster.key];
    if (r) return r.type;
    if (cluster.bucket === 'already_grouped' && state.decisions.alreadyGroupedConfirmed.has(cluster.existingGroup)) {
      return 'already_confirmed';
    }
    return 'unresolved';
  }

  function filteredClusters() {
    return allClusters.filter((cluster) => {
      if (state.filter === 'phonetic' && cluster.bucket !== 'phonetic') return false;
      if (state.filter === 'family' && cluster.bucket !== 'family') return false;
      if (state.filter === 'already_grouped' && cluster.bucket !== 'already_grouped') return false;
      if (state.filter === 'unresolved' && clusterStatus(cluster) === 'unresolved') return true;
      if (state.filter === 'unresolved') return false;
      if (!state.search.trim()) return true;
      const q = state.search.trim().toLowerCase();
      return cluster.words.some((w) => w.text.toLowerCase().includes(q));
    });
  }

  function currentCluster() {
    const list = filteredClusters();
    if (!list.length) return null;
    const idx = Math.min(state.index, list.length - 1);
    return list[idx];
  }

  function ensureSelection(cluster) {
    if (!state.selected.has(cluster.key)) {
      state.selected.set(cluster.key, new Set());
    }
    return state.selected.get(cluster.key);
  }

  function counts() {
    const d = state.decisions;
    return {
      keep: d.keepIds.size,
      remove: d.removeIds.size,
      group: d.groupAssignments.length,
      skip: d.skippedClusterKeys.size,
      confirmed: d.alreadyGroupedConfirmed.size,
    };
  }

  function suggestSlug(cluster) {
    const parts = cluster.words
      .map((w) => w.text.normalize('NFC').toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '').slice(0, 8))
      .sort();
    const slug = parts.join('_').replace(/[^a-z0-9_]/gi, '');
    return slug ? slug + '_root' : 'new_group_root';
  }

  function pushUndo(entry) {
    state.undoStack.push(entry);
    if (state.undoStack.length > 50) state.undoStack.shift();
  }

  function applyKeepRemove(cluster, keepSet) {
    const prev = snapshotCluster(cluster);
    const keepIds = [...keepSet];
    const removeIds = cluster.words.filter((w) => !keepSet.has(w.id)).map((w) => w.id);

    for (const id of cluster.words.map((w) => w.id)) {
      state.decisions.keepIds.delete(id);
      state.decisions.removeIds.delete(id);
    }
    state.decisions.groupAssignments = state.decisions.groupAssignments.filter(
      (g) => !cluster.words.some((w) => g.ids.includes(w.id)),
    );

    for (const id of keepIds) state.decisions.keepIds.add(id);
    for (const id of removeIds) state.decisions.removeIds.add(id);

    state.decisions.skippedClusterKeys.delete(cluster.key);
    state.decisions.resolved[cluster.key] = { type: 'keep_remove', keepIds, removeIds };
    pushUndo({ kind: 'cluster', prev, clusterKey: cluster.key });
    persist();
    render();
  }

  function applyGroup(cluster, groupSlug) {
    const prev = snapshotCluster(cluster);
    const ids = cluster.words.map((w) => w.id);

    for (const id of ids) {
      state.decisions.keepIds.add(id);
      state.decisions.removeIds.delete(id);
    }
    state.decisions.groupAssignments = state.decisions.groupAssignments.filter(
      (g) => !ids.some((id) => g.ids.includes(id)),
    );
    state.decisions.groupAssignments.push({ group: groupSlug, ids: [...ids] });
    state.decisions.skippedClusterKeys.delete(cluster.key);
    state.decisions.resolved[cluster.key] = { type: 'grouped', group: groupSlug, ids };
    pushUndo({ kind: 'cluster', prev, clusterKey: cluster.key });
    persist();
    render();
  }

  function applySkip(cluster) {
    const prev = snapshotCluster(cluster);
    for (const w of cluster.words) {
      state.decisions.keepIds.delete(w.id);
      state.decisions.removeIds.delete(w.id);
    }
    state.decisions.groupAssignments = state.decisions.groupAssignments.filter(
      (g) => !cluster.words.some((w) => g.ids.includes(w.id)),
    );
    state.decisions.skippedClusterKeys.add(cluster.key);
    delete state.decisions.resolved[cluster.key];
    pushUndo({ kind: 'cluster', prev, clusterKey: cluster.key });
    persist();
    render();
  }

  function applyConfirmExisting(cluster) {
    const prev = snapshotCluster(cluster);
    if (cluster.existingGroup) {
      state.decisions.alreadyGroupedConfirmed.add(cluster.existingGroup);
      state.decisions.ungroupRequested.delete(cluster.existingGroup);
    }
    state.decisions.resolved[cluster.key] = { type: 'already_confirmed' };
    pushUndo({ kind: 'cluster', prev, clusterKey: cluster.key });
    persist();
    render();
  }

  function applyUngroup(cluster) {
    const prev = snapshotCluster(cluster);
    if (cluster.existingGroup) {
      state.decisions.ungroupRequested.add(cluster.existingGroup);
      state.decisions.alreadyGroupedConfirmed.delete(cluster.existingGroup);
    }
    state.decisions.resolved[cluster.key] = { type: 'ungroup_requested' };
    pushUndo({ kind: 'cluster', prev, clusterKey: cluster.key });
    persist();
    render();
  }

  function snapshotCluster(cluster) {
    const d = state.decisions;
    return {
      resolved: d.resolved[cluster.key] ? { ...d.resolved[cluster.key] } : null,
      skipped: d.skippedClusterKeys.has(cluster.key),
      alreadyGrouped: cluster.existingGroup ? d.alreadyGroupedConfirmed.has(cluster.existingGroup) : false,
      ungroup: cluster.existingGroup ? d.ungroupRequested.has(cluster.existingGroup) : false,
      keepIds: cluster.words.filter((w) => d.keepIds.has(w.id)).map((w) => w.id),
      removeIds: cluster.words.filter((w) => d.removeIds.has(w.id)).map((w) => w.id),
      group: d.groupAssignments.find((g) => cluster.words.some((w) => g.ids.includes(w.id))) || null,
    };
  }

  function restoreSnapshot(cluster, snap) {
    const d = state.decisions;
    for (const w of cluster.words) {
      d.keepIds.delete(w.id);
      d.removeIds.delete(w.id);
    }
    d.groupAssignments = d.groupAssignments.filter(
      (g) => !cluster.words.some((w) => g.ids.includes(w.id)),
    );
    d.skippedClusterKeys.delete(cluster.key);
    if (cluster.existingGroup) d.alreadyGroupedConfirmed.delete(cluster.existingGroup);
    if (cluster.existingGroup) d.ungroupRequested.delete(cluster.existingGroup);
    delete d.resolved[cluster.key];

    if (snap.skipped) d.skippedClusterKeys.add(cluster.key);
    if (snap.alreadyGrouped && cluster.existingGroup) d.alreadyGroupedConfirmed.add(cluster.existingGroup);
    if (snap.ungroup && cluster.existingGroup) d.ungroupRequested.add(cluster.existingGroup);
    for (const id of snap.keepIds) d.keepIds.add(id);
    for (const id of snap.removeIds) d.removeIds.add(id);
    if (snap.group) d.groupAssignments.push({ ...snap.group, ids: [...snap.group.ids] });
    if (snap.resolved) d.resolved[cluster.key] = { ...snap.resolved };
    persist();
  }

  function undo() {
    const entry = state.undoStack.pop();
    if (!entry) return;
    const cluster = allClusters.find((c) => c.key === entry.clusterKey);
    if (!cluster) return;
    restoreSnapshot(cluster, entry.prev);
    render();
  }

  function exportDecisions() {
    const d = state.decisions;
    return {
      keepIds: [...d.keepIds].sort(),
      removeIds: [...d.removeIds].sort(),
      groupAssignments: d.groupAssignments.map((g) => ({ group: g.group, ids: [...g.ids].sort() })),
      skippedClusterKeys: [...d.skippedClusterKeys].sort(),
      alreadyGroupedConfirmed: [...d.alreadyGroupedConfirmed].sort(),
      ungroupRequested: [...d.ungroupRequested].sort(),
      exportedAt: new Date().toISOString(),
      meta: payload.meta,
    };
  }

  function idToText(id) {
    for (const c of allClusters) {
      const w = c.words.find((x) => x.id === id);
      if (w) return w.text;
    }
    return id;
  }

  function buildSummary() {
    const exp = exportDecisions();
    const removed = exp.removeIds.map(idToText).sort((a, b) => a.localeCompare(b, 'uk'));
    const grouped = exp.groupAssignments.map((g) => g.group + ': ' + g.ids.map(idToText).join(', '));
    const skipped = exp.skippedClusterKeys;
  const lines = [];
    if (removed.length) lines.push('REMOVED (' + removed.length + '):\\n' + removed.join(', '));
    if (grouped.length) lines.push('GROUPED:\\n' + grouped.join('\\n'));
    if (skipped.length) lines.push('SKIPPED clusters:\\n' + skipped.join('\\n'));
    if (exp.alreadyGroupedConfirmed.length) {
      lines.push('CONFIRMED existing groups:\\n' + exp.alreadyGroupedConfirmed.join(', '));
    }
    if (exp.ungroupRequested.length) {
      lines.push('UNGROUP requested:\\n' + exp.ungroupRequested.join(', '));
    }
    return lines.length ? lines.join('\\n\\n') : 'No decisions yet.';
  }

  function downloadDecisions() {
    const json = exportDecisions();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'word-conflict-decisions.json';
    a.click();
    URL.revokeObjectURL(a.href);

    const csvRows = ['type,key,group,id,text'];
    for (const id of json.removeIds) csvRows.push(['remove', '', '', id, idToText(id)].join(','));
    for (const g of json.groupAssignments) {
      for (const id of g.ids) csvRows.push(['group', '', g.group, id, idToText(id)].join(','));
    }
    for (const key of json.skippedClusterKeys) csvRows.push(['skip', key, '', '', ''].join(','));
    for (const g of json.alreadyGroupedConfirmed) csvRows.push(['confirm_existing', '', g, '', ''].join(','));
    for (const g of json.ungroupRequested) csvRows.push(['ungroup', '', g, '', ''].join(','));
    const csvBlob = new Blob([csvRows.join('\\n') + '\\n'], { type: 'text/csv' });
    const a2 = document.createElement('a');
    a2.href = URL.createObjectURL(csvBlob);
    a2.download = 'word-conflict-decisions.csv';
    a2.click();
    URL.revokeObjectURL(a2.href);
  }

  function bucketLabel(bucket) {
    if (bucket === 'already_grouped') return 'Already grouped';
    if (bucket === 'phonetic') return 'Phonetic / lookalike';
    return 'Family / stem';
  }

  function renderClusterCard(cluster) {
    const sel = ensureSelection(cluster);
    const status = clusterStatus(cluster);
    const resolved = status !== 'unresolved';
    const slug = suggestSlug(cluster);

    const wordsHtml = cluster.words.map((word, i) => {
      const selected = sel.has(word.id);
      const meta = [word.difficulty, word.category, word.status, word.id].filter(Boolean).join(' · ');
      const groupNote = word.group ? ' · group: ' + word.group : '';
      return '<button type="button" class="word-btn' + (selected ? ' selected' : '') + '" data-id="' + word.id + '" data-idx="' + i + '">' +
        '<span class="word-text">' + escapeHtml(word.text) + '</span>' +
        '<span class="word-meta">' + escapeHtml(meta + groupNote) + (i < 9 ? ' · <span class="kbd">' + (i + 1) + '</span>' : '') + '</span>' +
        '</button>';
    }).join('');

    let actions = '';
    if (cluster.bucket === 'already_grouped') {
      actions = '<div class="actions">' +
        '<button type="button" class="btn primary" data-action="confirm-existing">Confirm existing group</button>' +
        '<button type="button" class="btn ghost" data-action="ungroup">Ungroup (review later)</button>' +
        '<button type="button" class="btn ghost" data-action="skip">Skip</button>' +
        '</div>';
    } else {
      actions = '<div class="actions">' +
        '<button type="button" class="btn primary" data-action="confirm">Confirm cluster <span class="kbd">Enter</span></button>' +
        '<button type="button" class="btn" data-action="group">Keep all + assign group</button>' +
        '<button type="button" class="btn ghost" data-action="skip">Not a conflict</button>' +
        '</div>' +
        '<input class="group-input" id="group-slug" value="' + escapeAttr(slug) + '" aria-label="Group slug" />';
    }

    const statusLine = resolved
      ? '<p class="' + (status === 'skipped' ? 'status-skip' : 'status-done') + '">Resolved: ' + status + '</p>'
      : '<p class="sub" style="margin:0 0 8px">Click word(s) to keep. Unselected → remove on confirm.</p>';

    return '<article class="card' + (resolved ? ' resolved' : '') + '" data-key="' + escapeAttr(cluster.key) + '">' +
      '<div class="bucket">' + bucketLabel(cluster.bucket) + (cluster.existingGroup ? ' · ' + cluster.existingGroup : '') + '</div>' +
      statusLine +
      '<p class="hints">' + escapeHtml(cluster.pairHints.slice(0, 4).join(' · ')) + '</p>' +
      '<div class="word-grid">' + wordsHtml + '</div>' +
      actions +
      '</article>';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function render() {
    const list = filteredClusters();
    if (state.index >= list.length) state.index = Math.max(0, list.length - 1);

    const c = counts();
    const unresolved = allClusters.filter((cl) => clusterStatus(cl) === 'unresolved').length;

    document.getElementById('progress').innerHTML =
      '<span class="pill">Cluster <strong>' + (list.length ? state.index + 1 : 0) + '</strong> / ' + list.length + '</span>' +
      '<span class="pill">keep <strong>' + c.keep + '</strong></span>' +
      '<span class="pill">remove <strong>' + c.remove + '</strong></span>' +
      '<span class="pill">group <strong>' + c.group + '</strong></span>' +
      '<span class="pill">skip <strong>' + c.skip + '</strong></span>' +
      '<span class="pill">unresolved <strong>' + unresolved + '</strong></span>';

    const filters = [
      ['all', 'All'],
      ['phonetic', 'Phonetic'],
      ['family', 'Family'],
      ['already_grouped', 'Already grouped'],
      ['unresolved', 'Unresolved'],
    ];
    document.getElementById('filters').innerHTML = filters.map(([id, label]) =>
      '<button type="button" class="chip' + (state.filter === id ? ' active' : '') + '" data-filter="' + id + '">' + label + '</button>'
    ).join('');

    const main = document.getElementById('main');
    const cluster = currentCluster();
    if (!cluster) {
      main.innerHTML = '<div class="empty">No clusters match this filter.</div>';
    } else {
      main.innerHTML = renderClusterCard(cluster);
      bindClusterEvents(cluster);
    }

    document.getElementById('summary').textContent = buildSummary();
    document.getElementById('prev').disabled = state.index <= 0;
    document.getElementById('next').disabled = !list.length || state.index >= list.length - 1;
  }

  function bindClusterEvents(cluster) {
    const sel = ensureSelection(cluster);
    const card = document.querySelector('.card');
    if (!card) return;

    card.querySelectorAll('.word-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (sel.has(id)) sel.delete(id);
        else sel.add(id);
        render();
      });
    });

    card.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
      if (!sel.size) {
        alert('Select at least one word to keep, or use Keep all + assign group / Skip.');
        return;
      }
      applyKeepRemove(cluster, new Set(sel));
      goNext();
    });

    card.querySelector('[data-action="group"]')?.addEventListener('click', () => {
      const input = document.getElementById('group-slug');
      const slug = (input && input.value.trim()) || suggestSlug(cluster);
      applyGroup(cluster, slug);
      goNext();
    });

    card.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
      applySkip(cluster);
      goNext();
    });

    card.querySelector('[data-action="confirm-existing"]')?.addEventListener('click', () => {
      applyConfirmExisting(cluster);
      goNext();
    });

    card.querySelector('[data-action="ungroup"]')?.addEventListener('click', () => {
      applyUngroup(cluster);
      goNext();
    });
  }

  function goNext() {
    const list = filteredClusters();
    if (state.index < list.length - 1) state.index += 1;
    render();
  }

  function goPrev() {
    if (state.index > 0) state.index -= 1;
    render();
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

  document.getElementById('prev').addEventListener('click', goPrev);
  document.getElementById('next').addEventListener('click', goNext);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('download').addEventListener('click', downloadDecisions);

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    const cluster = currentCluster();
    if (!cluster) return;
    const sel = ensureSelection(cluster);

    if (e.key === 'u' || e.key === 'U') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cluster.bucket === 'already_grouped') {
        applyConfirmExisting(cluster);
        goNext();
      } else if (sel.size) {
        applyKeepRemove(cluster, new Set(sel));
        goNext();
      }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return; }

    const num = Number.parseInt(e.key, 10);
    if (num >= 1 && num <= 9) {
      const word = cluster.words[num - 1];
      if (!word) return;
      e.preventDefault();
      if (sel.has(word.id)) sel.delete(word.id);
      else sel.add(word.id);
      render();
    }
  });

  render();
})();
  </script>
</body>
</html>`;
}

function main(): void {
  const raw = readFileSync(CSV_PATH, 'utf8');
  const words = parseWordsCsv(raw);
  const clusters = buildClusters(words);
  const generatedAt = new Date().toISOString();

  writeFileSync(OUT_PATH, renderHtml(clusters, generatedAt), 'utf8');

  const byBucket = {
    already_grouped: clusters.filter((c) => c.bucket === 'already_grouped').length,
    phonetic: clusters.filter((c) => c.bucket === 'phonetic').length,
    family: clusters.filter((c) => c.bucket === 'family').length,
  };

  console.log('=== WORD CONFLICT PICKER ===');
  console.log(`Source: ${CSV_PATH}`);
  console.log(`Clusters: ${clusters.length}`);
  console.log(`  already_grouped: ${byBucket.already_grouped}`);
  console.log(`  phonetic: ${byBucket.phonetic}`);
  console.log(`  family: ${byBucket.family}`);
  console.log(`Wrote ${OUT_PATH}`);
}

const entry = process.argv[1];
if (typeof entry === 'string' && entry.endsWith('build-conflict-picker.ts')) {
  main();
}
