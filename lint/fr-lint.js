#!/usr/bin/env node
/* ============================================================
   fr-lint.js — Fade Readers hard-rule linter
   Deterministic. Zero LLM. Rung 1 of the autonomy ladder.

     node fr-lint.js            run all checks
     node fr-lint.js --freeze   record current frozen-file hashes
     node fr-lint.js --json     machine output only

   Side effects (rung 1 also emits the manifest):
     letters.json      build manifest — what the panel cites
     lint-report.json  machine-readable result
   ============================================================ */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const ROOT = __dirname;
const P = f => path.join(ROOT, f);
const read = f => fs.readFileSync(P(f), 'utf8');
const exists = f => fs.existsSync(P(f));
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/* Comments are not shipped. Rules are checked against live code + markup only —
   otherwise a comment saying "no rewards, no streaks" fails the no-rewards check. */
function stripComments(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, ' ')      // html
    .replace(/\/\*[\s\S]*?\*\//g, ' ')    // css + js block
    .replace(/^\s*\/\/.*$/gm, ' ');        // js line comments (whole-line only)
}

const ARGS = process.argv.slice(2);
const JSON_ONLY = ARGS.includes('--json');
const FREEZE = ARGS.includes('--freeze');

// ---- config: the hard rules, as data -----------------------
const TEMPLATE = 'app-template-v9-linen.html';
const BUILD    = 'fade-readers-v9-linen.html';
const SHIPPED  = 'beta/index.html';
const FROZEN   = ['app-template-v8.html', 'fade-readers-v8.html',
                  'app-template-v9-kpop.html', 'fade-readers-v9-kpop.html',
                  'app-template.html', 'fade-readers-prototype.html'];
const CANVAS   = '#fffdf8';          // base-colour rung sits on this
const MIN_CONTRAST = 3.0;            // 2026-09-07 luminance floor
const BANNED_WORDS = ['the', 'a', 'to', 'off', 'has', 'is'];
const GAMIFY = [/\bstreak/i, /\bbadge/i, /\breward/i, /\btroph/i, /confetti/i,
                /\bleaderboard/i, /\bcoins?\b/i, /\b\d+\s*points\b/i, /\bstars? earned/i, /\bearn(ed|s)? (a|\d)/i,
                /\bunlocked!/i, /\bwell done!/i, /\bhigh ?score/i];
const FOOTPRINT_EXEMPT = { o: 'octopus tentacles — approved 2026-09-02' };

// ---- results ------------------------------------------------
const results = [];
const add = (id, group, ok, msg, detail) => results.push({ id, group, ok, msg, detail: detail || null });
const skip = (id, group, msg) => results.push({ id, group, ok: null, msg, detail: null });

// ---- load the letter library the way the build does ---------
let LETTERS = null, frLetterSVG = null, FR_INK = null, loadErr = null;
try {
  const code = 'const FR_GLYPHS = ' + read('andika-glyphs.json') + ';\n' + read('letters-src.js');
  const ctx = { module: { exports: {} }, console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 10000 });
  ({ FR_LETTERS: LETTERS, frLetterSVG, FR_INK } = ctx.module.exports);
} catch (e) { loadErr = e.message; }

// ============================================================
// A. BUILD INTEGRITY — never hand-edit a build
// ============================================================
function rebuild() {
  const glyphs = read('andika-glyphs.json');
  const src = read('letters-src.js').replace(/\nif \(typeof module[\s\S]*$/, '\n');
  const lettersJs = 'const FR_GLYPHS = ' + glyphs + ';\n' + src;
  return read(TEMPLATE)
    .replace('/*__LETTERS_JS__*/', () => lettersJs)
    .replace('/*__FINALES_JS__*/', () => read('finales-src.js'));
}

if (!exists(TEMPLATE) || !exists(BUILD)) {
  add('A1', 'build', false, 'template or build missing', `${TEMPLATE} / ${BUILD}`);
} else {
  const built = read(BUILD);
  let expected = null, err = null;
  try { expected = rebuild(); } catch (e) { err = e.message; }

  if (err) {
    add('A1', 'build', false, 'could not reproduce the build from sources', err);
  } else if (expected === built) {
    add('A1', 'build', true, 'build reproduces exactly from template + sources');
  } else {
    // Locate the divergence and name the likely culprit.
    let i = 0; const n = Math.min(expected.length, built.length);
    while (i < n && expected[i] === built[i]) i++;
    const line = built.slice(0, i).split('\n').length;
    const srcMtime = f => exists(f) ? fs.statSync(P(f)).mtimeMs : 0;
    const buildMtime = srcMtime(BUILD);
    const newer = ['letters-src.js', 'finales-src.js', 'andika-glyphs.json', TEMPLATE]
      .filter(f => srcMtime(f) > buildMtime);
    const why = newer.length
      ? `STALE — edited after the last build: ${newer.join(', ')}. Rebuild.`
      : `HAND-EDITED — no source is newer than the build, so the build diverged on its own.`;
    add('A1', 'build', false, why,
        `first divergence at build line ${line}\n` +
        `  expected: …${expected.slice(Math.max(0, i - 50), i + 50).replace(/\n/g, '⏎')}…\n` +
        `  actual:   …${built.slice(Math.max(0, i - 50), i + 50).replace(/\n/g, '⏎')}…`);
  }

  if (exists(SHIPPED)) {
    add('A2', 'build', read(SHIPPED) === built,
        read(SHIPPED) === built ? 'beta/index.html matches the build'
                                : 'beta/index.html is out of sync with the build — recopy and bump CACHE');
  } else skip('A2', 'build', 'beta/index.html not found');
}

// A3 — frozen files
const BASELINE = '.fr-lint-baseline.json';
if (FREEZE) {
  const b = {};
  FROZEN.forEach(f => { if (exists(f)) b[f] = sha(read(f)); });
  fs.writeFileSync(P(BASELINE), JSON.stringify(b, null, 2));
  console.log(`frozen ${Object.keys(b).length} files → ${BASELINE}`);
  process.exit(0);
}
if (exists(BASELINE)) {
  const base = JSON.parse(read(BASELINE));
  const moved = Object.keys(base).filter(f => exists(f) && sha(read(f)) !== base[f]);
  add('A3', 'build', moved.length === 0,
      moved.length ? `frozen file changed: ${moved.join(', ')}` : 'frozen reference builds untouched');
} else {
  skip('A3', 'build', 'no baseline yet — run: node fr-lint.js --freeze');
}

// A4 — service worker cache bumped
if (exists('beta/sw.js') && exists(SHIPPED)) {
  const m = read('beta/sw.js').match(/const CACHE\s*=\s*['"]([^'"]+)['"]/);
  const swM = fs.statSync(P('beta/sw.js')).mtimeMs, ixM = fs.statSync(P(SHIPPED)).mtimeMs;
  add('A4', 'build', swM >= ixM - 5000,
      swM >= ixM - 5000 ? `CACHE current (${m ? m[1] : '?'})`
                        : `beta/index.html is newer than sw.js — bump CACHE (${m ? m[1] : '?'})`);
}

// ============================================================
// B. LETTER RULES
// ============================================================
function lum(hex) {
  const c = hex.replace('#', '');
  const v = [0, 2, 4].map(i => {
    const x = parseInt(c.substr(i, 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

let manifest = {};
if (loadErr || !LETTERS) {
  add('B0', 'letters', false, 'could not load letters-src.js', loadErr);
} else {
  const keys = Object.keys(LETTERS);
  add('B0', 'letters', keys.length === 26, `${keys.length} letters loaded`,
      keys.length === 26 ? null : `missing: ${'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !keys.includes(c)).join(' ')}`);

  // B1 — unique colour per letter
  const seen = {}, dupes = [];
  keys.forEach(ch => {
    const c = (LETTERS[ch].c0 || LETTERS[ch].color || '').toLowerCase();
    if (!c || c === 'grad') return;
    if (seen[c]) dupes.push(`${seen[c]} / ${ch} both ${c}`); else seen[c] = ch;
  });
  add('B1', 'letters', dupes.length === 0,
      dupes.length ? `duplicate letter colours: ${dupes.join('; ')}` : 'every letter colour is unique');

  // B2 — base-colour rung ≥ 3:1 on the canvas
  const dim = [];
  keys.forEach(ch => {
    const cb = LETTERS[ch].cBase;
    if (!cb) return;
    const r = contrast(cb, CANVAS);
    if (r < MIN_CONTRAST) dim.push(`${ch} ${cb} = ${r.toFixed(2)}:1`);
  });
  add('B2', 'letters', dim.length === 0,
      dim.length ? `cBase under ${MIN_CONTRAST}:1 on ${CANVAS}: ${dim.join(', ')}`
                 : `every cBase clears ${MIN_CONTRAST}:1 on ${CANVAS}`);

  // B3 — word starts with its letter
  const bad = keys.filter(ch => !(LETTERS[ch].word || '').toLowerCase().startsWith(ch));
  add('B3', 'letters', bad.length === 0,
      bad.length ? `word does not start with its letter: ${bad.map(c => c + '→' + LETTERS[c].word).join(', ')}`
                 : 'every word starts with its letter');

  // B4 — letter frame + B5 — plain ink is plain
  if (frLetterSVG) {
    const frameBad = [], inkBad = [], floatBad = [];
    keys.forEach(ch => {
      for (const stage of [0, 1, 2, 3]) {
        let svg; try { svg = frLetterSVG(ch, stage); } catch (e) { frameBad.push(`${ch}@${stage} threw`); continue; }
        if (!/viewBox="0 0 [\d.]+ 135"/.test(svg)) frameBad.push(`${ch}@${stage}`);
        if (stage === 2) {
          const fills = [...svg.matchAll(/fill="(#[0-9a-fA-F]{3,8})"/g)].map(m => m[1].toLowerCase());
          const off = fills.filter(f => f !== (FR_INK || '').toLowerCase());
          if (off.length) inkBad.push(`${ch}: ${[...new Set(off)].join(',')}`);
        }
        if (stage === 0 && !FOOTPRINT_EXEMPT[ch]) {
          const ys = [...svg.matchAll(/\scy="(-?[\d.]+)"/g)].map(m => parseFloat(m[1]));
          const out = ys.filter(y => y < -2 || y > 137);
          if (out.length) floatBad.push(`${ch} (y=${out.join(',')})`);
        }
      }
    });
    add('B4', 'letters', frameBad.length === 0,
        frameBad.length ? `frame is not "0 0 W 135": ${frameBad.join(', ')}` : 'every letter renders in the 0 0 W 135 frame');
    add('B5', 'letters', inkBad.length === 0,
        inkBad.length ? `fade 3 / plain ink is not plain: ${inkBad.join('; ')}` : 'plain ink renders in FR_INK only');
    add('B6', 'letters', floatBad.length === 0,
        floatBad.length ? `geometry outside the letter footprint: ${floatBad.join(', ')}`
                        : 'nothing floats outside a letter footprint (exempt: ' + Object.keys(FOOTPRINT_EXEMPT).join(',') + ')');
  }

  // ---- emit the manifest (rung 1's other half) --------------
  keys.sort().forEach(ch => {
    const L = LETTERS[ch];
    manifest[ch] = {
      word: L.word, color: L.color, c0: L.c0 || null, cBase: L.cBase || null,
      contrastOnCanvas: L.cBase ? +contrast(L.cBase, CANVAS).toFixed(2) : null,
      hasPattern: !!L.pattern, hasDecor: !!L.decor, survivesFade1: !!L.decor1,
      font: 'Andika-Bold'
    };
  });
}

// ============================================================
// C. SOUND — phonetic only, Angela's recordings present
// ============================================================
const AZ = 'abcdefghijklmnopqrstuvwxyz'.split('');
const missingSound = AZ.filter(ch => !['m4a', 'mp3', 'wav'].some(ext => exists(`sounds/${ch}.${ext}`)));
add('C1', 'sound', missingSound.length === 0,
    missingSound.length ? `no audio file for: ${missingSound.join(' ')}` : 'all 26 letter sounds present');

if (exists(TEMPLATE)) {
  const t = read(TEMPLATE);
  const pm = t.match(/const PHONICS\s*=\s*\{([\s\S]*?)\};/);
  if (pm) {
    const map = {};
    [...pm[1].matchAll(/([a-z])\s*:\s*'([^']*)'/g)].forEach(m => map[m[1]] = m[2]);
    const miss = AZ.filter(c => !map[c]);
    const NAMES = { a:'ay', b:'bee', c:'see', d:'dee', e:'ee', f:'ef', g:'gee', h:'aitch', i:'eye',
                    j:'jay', k:'kay', l:'el', m:'em', n:'en', o:'oh', p:'pee', q:'cue', r:'ar',
                    s:'ess', t:'tee', u:'you', v:'vee', w:'double-u', x:'ex', y:'why', z:'zee' };
    const named = AZ.filter(c => map[c] && map[c].toLowerCase() === NAMES[c]);
    add('C2', 'sound', miss.length === 0 && named.length === 0,
        miss.length ? `PHONICS missing: ${miss.join(' ')}`
        : named.length ? `PHONICS uses the letter NAME for: ${named.join(' ')}`
        : 'PHONICS is phonetic for all 26 — no letter names');
  } else skip('C2', 'sound', 'PHONICS map not found in template');

  const isFor = stripComments(t).match(/\b[a-z] is for [a-z]{2,}/i);
  add('C3', 'sound', !isFor, isFor ? `"c is for cat" phrasing found: "${isFor[0]}"` : 'no "X is for Y" phrasing');

  const ph = stripComments(t).match(/_placeholder-words-DO-NOT-SHIP/);
  add('C4', 'sound', !ph, ph ? 'template references _placeholder-words-DO-NOT-SHIP' : 'no placeholder audio referenced');
}

// ============================================================
// D. NO GAMIFICATION — ever
// ============================================================
if (exists(TEMPLATE)) {
  const t = stripComments(read(TEMPLATE));
  const hits = [];
  GAMIFY.forEach(re => { const m = t.match(re); if (m) {
    const line = t.slice(0, m.index).split('\n').length;
    hits.push(`"${m[0]}" at line ${line}`);
  }});
  add('D1', 'values', hits.length === 0,
      hits.length ? `reward / gamification markup: ${hits.join('; ')}` : 'no reward, streak, badge or confetti markup');
}

// ============================================================
// E. DECODABILITY + LADDER SHAPE
// ============================================================
if (exists(TEMPLATE)) {
  const t = read(TEMPLATE);
  const lm = t.match(/const LEVELS\s*=\s*(\[[\s\S]*?\n\];)/);
  if (!lm) skip('E1', 'books', 'LEVELS not found in template');
  else {
    let LEVELS = null;
    try { LEVELS = vm.runInNewContext('(' + lm[1].replace(/;$/, '') + ')', {}, { timeout: 5000 }); } catch (e) {}
    if (!LEVELS) skip('E1', 'books', 'could not parse LEVELS');
    else {
      const banned = [], shape = [];
      const RANGE = [[1,1],[1,1],[1,2],[2,3],[3,4]];   // words per page, per level
      LEVELS.forEach((lv, li) => {
        (lv.books || []).forEach(bk => {
          (bk.pages || []).forEach((pg, pi) => {
            const words = String(pg.text || '').trim().split(/\s+/).filter(Boolean);
            words.forEach(w => { if (BANNED_WORDS.includes(w.toLowerCase())) banned.push(`L${li+1} ${bk.title} p${pi+1}: "${w}"`); });
            const [lo, hi] = RANGE[li] || [1, 9];
            if (words.length < lo || words.length > hi) shape.push(`L${li+1} ${bk.title} p${pi+1}: ${words.length} words (expected ${lo}–${hi})`);
          });
        });
      });
      add('E1', 'books', banned.length === 0,
          banned.length ? `non-decodable word: ${banned.join('; ')}` : `no banned words (${BANNED_WORDS.join(', ')}) in any page`);
      add('E2', 'books', shape.length === 0,
          shape.length ? `words-per-page off the ladder: ${shape.slice(0,6).join('; ')}${shape.length>6?` (+${shape.length-6} more)`:''}`
                       : 'every page sits inside its level’s word count');
      const counts = LEVELS.map(l => (l.books || []).length);
      const pagesOK = LEVELS.every(l => (l.books||[]).every(b => (b.pages||[]).length === 5));
      add('E3', 'books', LEVELS.length === 5 && counts.every(c => c === 5) && pagesOK,
          `${LEVELS.length} levels × [${counts.join(',')}] books × 5 pages` +
          (LEVELS.length === 5 && counts.every(c => c === 5) && pagesOK ? '' : ' — expected 5 × 5 × 5'));
    }
  }
}

// ============================================================
// F. FONT — Andika Bold for everything the child reads
// ============================================================
if (exists(TEMPLATE)) {
  const t = read(TEMPLATE);
  const decl = /--read:\s*'Andika'/.test(t);
  const linked = /fonts\.googleapis\.com[^"']*Andika/.test(t);
  add('F1', 'font', decl && linked,
      decl && linked ? "--read is Andika and the face is linked"
                     : `${decl ? '' : '--read is not Andika. '}${linked ? '' : 'Andika is not linked from the font stylesheet.'}`);
  const readers = ['.hint-letter', '.abc-one', '.wp-list', '.page-word'];
  const wrong = readers.filter(sel => {
    const m = t.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{[^}]*font-family:\\s*([^;]+);'));
    return m && !/var\(--read\)|Andika/.test(m[1]);
  });
  add('F2', 'font', wrong.length === 0,
      wrong.length ? `child-read text not in Andika: ${wrong.join(', ')}` : 'child-read selectors all resolve to Andika');
}

// ============================================================
// REPORT
// ============================================================
const fails = results.filter(r => r.ok === false);
const skips = results.filter(r => r.ok === null);
const pass  = results.filter(r => r.ok === true);

if (Object.keys(manifest).length) fs.writeFileSync(P('letters.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(P('lint-report.json'), JSON.stringify({
  ranAt: new Date().toISOString(), ok: fails.length === 0,
  counts: { pass: pass.length, fail: fails.length, skip: skips.length }, results
}, null, 2) + '\n');

if (JSON_ONLY) { console.log(JSON.stringify({ ok: fails.length === 0, results }, null, 2)); process.exit(fails.length ? 1 : 0); }

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' };
const GROUPS = { build: 'BUILD INTEGRITY', letters: 'LETTER RULES', sound: 'SOUND', values: 'VALUES', books: 'BOOKS', font: 'FONT' };
console.log(`\n${C.b}Fade Readers — hard-rule lint${C.x}  ${C.d}${new Date().toLocaleString()}${C.x}\n`);
Object.keys(GROUPS).forEach(g => {
  const rows = results.filter(r => r.group === g);
  if (!rows.length) return;
  console.log(`${C.d}${GROUPS[g]}${C.x}`);
  rows.forEach(r => {
    const mark = r.ok === true ? `${C.g}✓${C.x}` : r.ok === false ? `${C.r}✗${C.x}` : `${C.y}–${C.x}`;
    console.log(`  ${mark} ${C.d}${r.id}${C.x} ${r.msg}`);
    if (r.detail) r.detail.split('\n').forEach(l => console.log(`      ${C.d}${l}${C.x}`));
  });
  console.log('');
});
console.log(fails.length === 0
  ? `${C.g}${C.b}PASS${C.x} — ${pass.length} checks${skips.length ? `, ${skips.length} skipped` : ''}. Hard rules held; the panel can start on judgment.\n`
  : `${C.r}${C.b}FAIL${C.x} — ${fails.length} of ${results.length} checks. ${C.d}Fix these before spending a token on the panel.${C.x}\n`);
console.log(`${C.d}wrote letters.json (${Object.keys(manifest).length} letters) + lint-report.json${C.x}\n`);
process.exit(fails.length ? 1 : 0);
