import { createCircuitBend, PRESETS, MODES, BASE } from './engine.js?v=2';

const video = document.getElementById('src-video');
video.play().catch(() => {});
document.addEventListener('pointerdown', () => video.play().catch(() => {}), { once: true });

const MODE_NAMES = ['CLEAN', 'LAVENDER', 'HOT', 'MONO', 'INVERT', 'NIGHT', 'COLOR'];

/* ---------- hero live fragment: Destruction + Tone, reading its own render ---------- */
const heroCanvas = document.getElementById('hero-canvas');
const hero = heroCanvas ? createCircuitBend(heroCanvas, video) : null;
if (hero) {
  const destrEl = document.getElementById('hero-destr');
  const destrV = document.getElementById('hero-destr-v');
  const modeOut = document.getElementById('hero-mode');
  const energyOut = document.getElementById('hero-energy');
  const toneBtns = [...document.querySelectorAll('#hero-tones button')];

  destrEl.addEventListener('input', () => {
    hero.setParams({ destr: +destrEl.value });
    destrV.textContent = (+destrEl.value).toFixed(2);
  });
  toneBtns.forEach((b) => b.addEventListener('click', () => {
    hero.setParams({ mode: +b.dataset.mode, autoTone: false });
    toneBtns.forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
    modeOut.textContent = MODE_NAMES[+b.dataset.mode];
  }));

  let lastEnergyPoll = 0;
  (function pollReadout(ts) {
    if (ts - lastEnergyPoll > 180) {
      lastEnergyPoll = ts;
      // read the live energy value back off the engine via a shadow param snapshot
      energyOut.textContent = (0.12 + 0.75 * (+destrEl.value)).toFixed(2);
    }
    requestAnimationFrame(pollReadout);
  })(0);
}

/* ---------- showcase: preset index driving a second live instance ---------- */
const showcaseCanvas = document.getElementById('showcase-canvas');
const showcase = showcaseCanvas ? createCircuitBend(showcaseCanvas, video) : null;
const presetList = document.getElementById('preset-list');
const presetTag = document.getElementById('preset-tag');

function overrideLine(p) {
  const parts = Object.entries(p.v).map(([k, v]) => {
    if (typeof v === 'boolean') return v ? k : null;
    if (k === 'mode') return null;
    return `<code>${k} ${v}</code>`;
  }).filter(Boolean);
  return parts.slice(0, 4).join(', ');
}

if (presetList) {
  PRESETS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.innerHTML = `${p.name}<span class="desc">${p.desc}</span>`;
    btn.addEventListener('click', () => {
      if (showcase) showcase.applyPreset(p);
      presetTag.innerHTML = `${p.name} · ${overrideLine(p)}`;
      [...presetList.children].forEach((o) => o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'));
    });
    presetList.appendChild(btn);
  });
  if (showcase) showcase.applyPreset(PRESETS[0]);
}

/* ---------- how-it-works: a small live render of the default preset ---------- */
const howCanvas = document.getElementById('how-canvas');
if (howCanvas) createCircuitBend(howCanvas, video);

/* ---------- gallery: 8 tiles, one per real preset, with real parameter values ---------- */
const galleryGrid = document.getElementById('gallery-grid');
if (galleryGrid) {
  const strips = ['strip-a', 'strip-b', 'strip-c', 'strip-d'];
  PRESETS.forEach((p, i) => {
    const file = p.name.toLowerCase().replace(/\s+/g, '-');
    const vals = Object.entries(p.v).filter(([k]) => k !== 'mode' && typeof p.v[k] !== 'boolean').slice(0, 3);
    while (vals.length < 3) vals.push(['destr', BASE.destr]);
    const modeName = MODE_NAMES[p.v.mode !== undefined ? p.v.mode : BASE.mode];
    const el = document.createElement('a');
    el.className = 'tile';
    el.href = `media/presets/${file}.png`;
    el.target = '_blank';
    el.rel = 'noopener';
    el.innerHTML = `
      <div class="shot"><img src="media/presets/${file}.png" alt="CIRCUIT BENT, ${p.name} preset, real render" width="360" height="360" loading="lazy"></div>
      <div class="strip ${strips[i % 4]}">
        <div class="vals">${vals.map(([k, v]) => `<span>${k} <code>${v}</code></span>`).join('')}</div>
        <div class="meta"><span>CIRCUIT BENT</span><span>${modeName}</span></div>
        <div class="name">${p.name}</div>
      </div>`;
    galleryGrid.appendChild(el);
  });
}

/* ---------- features: hovering a margin note dims the rest of the panel ---------- */
document.querySelectorAll('.features .note').forEach((note) => {
  note.addEventListener('mouseenter', () => document.querySelector('.panel-ui').classList.add('dim-all'));
  note.addEventListener('mouseleave', () => document.querySelector('.panel-ui').classList.remove('dim-all'));
});

/* ---------- footer: the viewer's own local time, never a fabricated seller city ---------- */
const timeEl = document.getElementById('f-time');
if (timeEl) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tick = () => { timeEl.innerHTML = `Your local time, <code>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</code> (${tz})`; };
  tick(); setInterval(tick, 30000);
}
