// The Research Shop — interactions. No build step; Three.js is vendored locally.
import { initViz } from './viz.js?v=17';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ?still in the URL gives the same settled, motion-free page as the reduced-motion setting.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('still');
if (reduced) document.documentElement.classList.add('still');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

$('#year').textContent = new Date().getFullYear();

/* ── hero: split into letters so each flips up in 3D ── */
let charIndex = 0;
$$('.hero__title .line').forEach((line) => {
  const inner = line.firstElementChild;
  const words = inner.textContent.trim().split(/\s+/);
  inner.innerHTML = words.map((w) =>
    `<span class="wd">${[...w].map((c) => `<span class="ch" style="--c:${charIndex++}">${c}</span>`).join('')}</span>`).join(' ');
  line.classList.add('is-split');
});
const h1 = $('.hero__title');
h1.setAttribute('aria-label', 'We provide answers to your questions. It’s that simple.');
$$('.line', h1).forEach((l) => l.setAttribute('aria-hidden', 'true'));

/* ── headings: split into words so each rises on its own ── */
$$('[data-split]').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w, i) =>
    `<span class="w" aria-hidden="true"><span style="--d:${i}">${w}</span></span>`).join(' ');
});

/* ── reveal on scroll ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    setTimeout(() => e.target.classList.add('is-done'), 1500);
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal], [data-split]').forEach((el) => io.observe(el));

/* ── nav: hide on scroll down, mark the current section, mobile menu ── */
const nav = $('#nav'), menu = $('#menu'), toggle = $('.nav__toggle');
const setMenu = (open) => {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
};
toggle.addEventListener('click', () => setMenu(menu.hidden));
$$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

const navLinks = $$('.nav__links a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach((s) => spy.observe(s));

/* ── services accordion; each panel holds a small 3D figure (see viz.js) ── */
$$('.svc__item').forEach((item) => {
  const row = $('.svc__row', item);
  row.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', String(open));
  });
});
initViz({ reduced, finePointer });

/* ── start here: pick a kind of question, see the services we would use, ask for a quote ── */
const askOpts = $('#askOpts'), askResult = $('#askResult'), askLinks = $('#askLinks');
const svcItems = $$('.svc__item');
let askLabel = '';
function openService(n) {
  const item = svcItems[n - 1];
  item.classList.add('is-open');
  $('.svc__row', item).setAttribute('aria-expanded', 'true');
  item.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
}
$$('.chip', askOpts).forEach((chip) => chip.addEventListener('click', () => {
  $$('.chip', askOpts).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  askLabel = chip.textContent.trim();
  askLinks.innerHTML = '';
  chip.dataset.svc.split(',').map(Number).forEach((n) => {
    const a = document.createElement('a');
    a.href = '#services';
    a.textContent = $('.svc__t', svcItems[n - 1]).textContent;
    a.addEventListener('click', (e) => { e.preventDefault(); openService(n); });
    askLinks.append(a);
  });
  askResult.hidden = false;
  askResult.classList.remove('is-new');
  void askResult.offsetWidth;
  askResult.classList.add('is-new');
}));
$('#askQuote').addEventListener('click', () => {
  const box = $('#form textarea');
  if (!box.value.trim()) box.value = `My question is about: ${askLabel}\n\n`;
});

/* ── quote bar: shown after the hero, hidden once the contact section is on screen ── */
const dock = $('#dock'), contactEl = $('#contact');
function updateDock() {
  const pastHero = scrollY > innerHeight * 0.7;
  const atContact = contactEl.getBoundingClientRect().top < innerHeight * 0.75;
  dock.classList.toggle('is-on', pastHero && !atContact && menu.hidden);
}

/* ── testimonials: a three-card deck that rotates in 3D ── */
const deck = $('#deck'), deckCards = $$('.quote', deck), deckNow = $('#deckNow');
let deckIndex = 0;
function setDeck(i) {
  const n = deckCards.length;
  deckIndex = (i + n) % n;
  deckCards.forEach((card, k) => {
    let o = k - deckIndex;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    card.style.setProperty('--o', o);
    card.style.setProperty('--a', Math.abs(o));
    card.classList.toggle('is-active', o === 0);
  });
  deckNow.textContent = deckIndex + 1;
}
setDeck(0);
$$('.deck__btn', deck).forEach((b) => b.addEventListener('click', () => setDeck(deckIndex + Number(b.dataset.dir))));
deckCards.forEach((card, k) => card.addEventListener('click', () => { if (!card.classList.contains('is-active')) setDeck(k); }));
let swipeX = null;
const deckStage = $('.deck__stage', deck);
deckStage.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
addEventListener('pointerup', (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 45) setDeck(deckIndex + (dx < 0 ? 1 : -1));
});

/* ── 3D tilt on cards (mouse only) ── */
if (finePointer && !reduced) {
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(14px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ── contact form: hands the message to the visitor's email app ── */
const form = $('#form'), formError = $('#formError');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(form);
  const name = d.get('name').trim(), email = d.get('email').trim(), message = d.get('message').trim();
  let problem = '';
  if (!name) problem = 'Add your name so we know who to reply to.';
  else if (!/^\S+@\S+\.\S+$/.test(email)) problem = 'Add an email address we can reply to, like name@example.com.';
  else if (!message) problem = 'Write your question or message before sending.';
  formError.hidden = !problem;
  formError.textContent = problem;
  if (problem) return;
  const subject = encodeURIComponent(`A question from ${name}`);
  const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
  location.href = `mailto:nath@theresearchshop.co.nz?subject=${subject}&body=${body}`;
});

/* ── scroll-driven depth: theme shifts, parallax planes, tilting scenes, folding sheets ── */
const bar = $('.progress span');
const themed = $$('main [data-theme]');
const parallax = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed), z: parseFloat(el.dataset.z || 0) }));
const tilts = $$('[data-tilt3d]').map((el) => ({ el, deg: parseFloat(el.dataset.tilt3d) * (el.closest('.person--flip') ? -1 : 1) }));
const folds = $$('[data-fold]');
const steps = $$('.step');
let lastY = scrollY, ticking = false;
let station = themed[0];
let howStep = 1; // which of the four steps is in view (1–4)

function onScroll() {
  const y = scrollY, vh = innerHeight, mid = vh * 0.5;
  bar.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - vh))})`;
  if (menu.hidden) nav.classList.toggle('is-hidden', y > lastY && y > 300);
  lastY = y;
  updateDock();

  for (const s of themed) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { station = s; break; }
  }
  if (document.body.dataset.theme !== station.dataset.theme) document.body.dataset.theme = station.dataset.theme;
  // a step counts once its card is most of the way to where it pins
  const pinLine = parseFloat(getComputedStyle(steps[0]).top) + vh * 0.3;
  howStep = Math.max(1, steps.filter((el) => el.getBoundingClientRect().top < pinLine).length);

  if (!reduced) {
    parallax.forEach(({ el, speed, z }) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - mid) * speed).toFixed(1)}px, ${z}px)`;
    });
    tilts.forEach(({ el, deg }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const n = clamp((r.top + r.height / 2 - mid) / mid, -1, 1);
      el.style.transform = `perspective(1100px) rotateY(${(n * deg).toFixed(2)}deg) rotateX(${(n * -deg * 0.35).toFixed(2)}deg)`;
    });
    folds.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      const p = clamp((top - vh * 0.4) / (vh * 0.6));
      el.style.transform = p > 0.001 ? `perspective(1800px) rotateX(${(p * 10).toFixed(2)}deg) scale(${(1 - p * 0.06).toFixed(4)})` : '';
    });
    steps.forEach((s, i) => {
      const next = steps[i + 1];
      if (!next) return;
      const a = s.getBoundingClientRect(), b = next.getBoundingClientRect();
      const covered = clamp((a.bottom - b.top) / a.height);
      s.style.transform = covered > 0.001 ? `perspective(1400px) rotateX(${(-covered * 7).toFixed(2)}deg) scale(${(1 - covered * 0.06).toFixed(4)})` : '';
    });
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* ── the 3D stage ──
   One dataset of points that keeps re-forming to show what research does:
   hero         scattered data → a trend with its fitted line → the logo triangle (the answer)
   how it works a question mark → a scoped sample → analysis bars → the answer
   Elsewhere it rests as the logo triangle. Loose pieces and dust belong to the other sections. */
const canvas = $('#stage');
const forced = new URLSearchParams(location.search).get('form'); // e.g. ?still&form=trend, for checking a single formation

async function initStage() {
  const THREE = await import('../assets/vendor/three.module.min.js');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = innerWidth < 760;
  const pr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const FOV = 35, CAM = 6;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.z = CAM;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a6, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(3, 5, 6);
  scene.add(sun);

  const rnd = Math.random;
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.87; // roughly normal, sd ≈ 0.5
  const GREY = [0.66, 0.68, 0.72], TEAL = [0, 0.655, 0.616], MINT = [0.22, 0.776, 0.584], CORAL = [0.988, 0.373, 0.27], CHAR = [0.25, 0.26, 0.28];
  const mixPick = (table) => { let r = rnd(); for (const [w, c] of table) { if ((r -= w) <= 0) return c; } return table[0][1]; };

  /* ── formations: each is a list of positions + colours for the same N points ── */
  const N = small ? 800 : 1600;
  const F = {};
  const make = (fn) => {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const [p, c] = fn(i); pos.set(p, i * 3); col.set(c, i * 3); }
    return { pos, col };
  };

  // scattered, unsorted data: the question before anyone has looked at it
  F.cloud = make(() => {
    const r = Math.cbrt(rnd()), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    return [[r * 1.7 * Math.sin(ph) * Math.cos(th), r * 1.25 * Math.cos(ph), r * 1.0 * Math.sin(ph) * Math.sin(th)], mixPick([[0.72, GREY], [0.28, TEAL]])];
  });

  // a scatter plot with a clear relationship
  const SLOPE = 0.55;
  F.trend = make(() => {
    const x = -1.5 + rnd() * 3;
    return [[x, SLOPE * x + gauss() * 0.5, gauss() * 0.45], mixPick([[0.6, TEAL], [0.3, MINT], [0.1, CHAR]])];
  });

  // a question mark, sampled from rendered text
  {
    const c = document.createElement('canvas'); c.width = c.height = 240;
    const g = c.getContext('2d');
    g.font = '700 230px "Bricolage Grotesque", "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', 120, 128);
    const d = g.getImageData(0, 0, 240, 240).data, hits = [];
    for (let y = 0; y < 240; y += 2) for (let x = 0; x < 240; x += 2) if (d[(y * 240 + x) * 4 + 3] > 128) hits.push([x, y]);
    F.q = make(() => {
      const [x, y] = hits.length ? hits[(rnd() * hits.length) | 0] : [120, 120];
      return [[(x + rnd() * 2 - 120) / 86, (120 - y - rnd() * 2) / 86, gauss() * 0.16], mixPick([[0.74, TEAL], [0.2, MINT], [0.06, CORAL]])];
    });
  }

  // an ordered population with one block picked out and framed: the scoped job
  const cols = Math.round(Math.sqrt(N * 1.6)), rows = Math.ceil(N / cols);
  const GW = 3.0, GH = 1.9, bx0 = Math.round(cols * 0.1), bx1 = Math.round(cols * 0.5), by0 = Math.round(rows * 0.3), by1 = Math.round(rows * 0.85);
  const gx = (cx) => -GW / 2 + (cx / (cols - 1)) * GW, gy = (cy) => -GH / 2 + (cy / (rows - 1)) * GH;
  F.grid = make((i) => {
    const cx = i % cols, cy = (i / cols) | 0;
    const inBlock = cx >= bx0 && cx <= bx1 && cy >= by0 && cy <= by1;
    return [[gx(cx), gy(cy), inBlock ? 0.22 : 0], inBlock ? TEAL : GREY];
  });

  // sorted into bars: the analysis
  const heights = [0.3, 0.42, 0.38, 0.58, 0.7, 0.84, 1], BASE = -1.25, BMAX = 2.35, BW = 0.3, BGAP = 0.44;
  const total = heights.reduce((a, b) => a + b, 0);
  const barOf = (i) => { let r = (i / N) * total; for (let b = 0; b < heights.length; b++) { if ((r -= heights[b]) < 0) return b; } return heights.length - 1; };
  F.bars = make((i) => {
    const b = barOf(i);
    const x = (b - (heights.length - 1) / 2) * BGAP;
    return [[x + (rnd() - 0.5) * BW, BASE + rnd() * heights[b] * BMAX, (rnd() - 0.5) * BW], b === heights.length - 1 ? CORAL : b % 2 ? MINT : TEAL];
  });

  // the logo: a triangle made of triangles, in three dimensions (chaos game on a tetrahedron)
  const S = 1.55;
  const V = [[0, 1, 0], [Math.sqrt(8 / 9), -1 / 3, 0], [-Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3)], [-Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3)]].map((v) => v.map((n) => n * S));
  let cg = [0, 0, 0];
  for (let i = 0; i < 20; i++) { const v = V[(rnd() * 4) | 0]; cg = cg.map((n, k) => (n + v[k]) / 2); }
  F.tri = make(() => {
    const v = V[(rnd() * 4) | 0];
    cg = cg.map((n, k) => (n + v[k]) / 2);
    return [[cg[0], cg[1] - 0.25, cg[2]], mixPick([[0.56, TEAL], [0.27, MINT], [0.12, CHAR], [0.05, CORAL]])];
  });

  const cur = { pos: Float32Array.from(F.cloud.pos), col: Float32Array.from(F.cloud.col) };
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) seed[i] = rnd();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(cur.pos, 3));
  geo.setAttribute('aCol', new THREE.BufferAttribute(cur.col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const U = { uPR: { value: pr }, uScale: { value: 1 }, uAlpha: { value: 1 }, uLight: { value: 0 }, uCoral: { value: 0 }, uSize: { value: small ? 5.2 : 5.6 } };
  const data = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aCol; attribute float aSeed;
      uniform float uPR, uScale, uSize;
      varying vec3 vCol; varying float vFog;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * uScale * (0.7 + aSeed * 0.6) * (6.0 / -mv.z);
        vCol = aCol;
        vFog = smoothstep(8.5, 4.6, -mv.z);
      }`,
    fragmentShader: `
      precision mediump float;
      uniform float uAlpha, uLight, uCoral;
      varying vec3 vCol; varying float vFog;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(vCol, vec3(0.96), uLight * 0.55);
        col = mix(col, vec3(0.13, 0.13, 0.17), uCoral * 0.85);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.36, d) * (0.45 + 0.55 * vFog) * uAlpha);
      }`,
  }));

  /* ── chart furniture: axes, the fitted line, the sample frame ── */
  const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0);
  const up = new THREE.Vector3(0, 1, 0);
  function rod(a, b, color, radius) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A);
    const mesh = new THREE.Mesh(rodGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    mesh.position.copy(A);
    mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    mesh.userData = { len: dir.length(), radius, grow: 0 };
    return mesh;
  }
  const AX = -1.68;
  const axes = [rod([AX, BASE, 0], [1.72, BASE, 0], 0x404248, 0.008), rod([AX, BASE, 0], [AX, 1.3, 0], 0x404248, 0.008)];
  const fit = [rod([-1.55, SLOPE * -1.55, 0], [1.6, SLOPE * 1.6, 0], 0xfc5f45, 0.02)];
  const m = 0.07, fx0 = gx(bx0) - m, fx1 = gx(bx1) + m, fy0 = gy(by0) - m, fy1 = gy(by1) + m, fz = 0.22;
  const frame = [rod([fx0, fy0, fz], [fx1, fy0, fz], 0xfc5f45, 0.012), rod([fx1, fy0, fz], [fx1, fy1, fz], 0xfc5f45, 0.012), rod([fx1, fy1, fz], [fx0, fy1, fz], 0xfc5f45, 0.012), rod([fx0, fy1, fz], [fx0, fy0, fz], 0xfc5f45, 0.012)];
  const furniture = [[axes, ['trend', 'bars'], 0.55], [fit, ['trend'], 1], [frame, ['grid'], 1]];

  const group = new THREE.Group();
  group.add(data, ...axes, ...fit, ...frame);
  scene.add(group);

  /* ── loose pieces and dust: kept for the sections that have not been redesigned yet ── */
  const tri3 = [];
  [[0, 2, 1], [0, 3, 2], [0, 1, 3], [1, 2, 3]].forEach((f) => f.forEach((i) => tri3.push(...V[i])));
  const tetGeo = new THREE.BufferGeometry();
  tetGeo.setAttribute('position', new THREE.Float32BufferAttribute(tri3, 3));
  tetGeo.computeVertexNormals();
  const FLOAT = small ? 12 : 30, floatMax = small ? 0.45 : 0.7;
  const floatMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.4, metalness: 0.08, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const floaters = new THREE.InstancedMesh(tetGeo, floatMat, FLOAT);
  const drift = [];
  for (let i = 0; i < FLOAT; i++) {
    const z = -5 + rnd() * (small ? 5 : 7.5);
    drift.push({ nx: rnd() * 2 - 1, ny: rnd(), z, size: 0.035 + rnd() * 0.075, speed: 0.35 + (z + 5) / 7.5, spin: 0.2 + rnd() * 0.6, ph: rnd() * 6 });
    floaters.setColorAt(i, new THREE.Color([0x00a79d, 0x38c695, 0x00a79d, 0xfc5f45][i % 4]));
  }
  scene.add(floaters);

  const DUST = small ? 700 : 2200;
  const dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) { dustPos.set([(rnd() - 0.5) * 16, (rnd() - 0.5) * 10, -6 + rnd() * 9], i * 3); dustSeed[i] = rnd(); }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  const dustU = { uTime: { value: 0 }, uPR: { value: pr }, uLight: { value: 0 }, uAlpha: { value: 0 } };
  scene.add(new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false,
    vertexShader: `
      attribute float aSeed; uniform float uTime, uPR; varying float vSeed;
      void main() {
        vec3 p = position + vec3(sin(uTime * 0.3 + aSeed * 40.0), cos(uTime * 0.25 + aSeed * 27.0), 0.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPR * (1.0 + aSeed * 2.4) * (6.0 / -mv.z);
        vSeed = aSeed;
      }`,
    fragmentShader: `
      precision mediump float; uniform float uLight, uAlpha; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(vec3(0.25, 0.26, 0.28), vec3(0.0, 0.655, 0.616), step(0.6, vSeed));
        col = mix(col, vec3(1.0), uLight);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.15, d) * 0.55 * uAlpha);
      }`,
  })));

  let W = 0, H = 0, viewW = 0, viewH = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    viewH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM;
    viewW = viewH * camera.aspect;
  }
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) addEventListener('pointermove', (ev) => { mouse.tx = ev.clientX / W - 0.5; mouse.ty = ev.clientY / H - 0.5; });

  const state = { x: 0, y: 0, s: 0.6, a: 1, tilt: 0, dark: 0, coral: 0, calm: 1, first: true };
  const dummy = new THREE.Object3D();
  const start = performance.now();
  const HOW = ['q', 'grid', 'bars', 'tri'];
  let raf = 0;

  function formation(t) {
    if (forced && F[forced]) return forced;
    if (station.id === 'top') return reduced ? 'tri' : t < 1.3 ? 'cloud' : t < 6 ? 'trend' : 'tri';
    if (station.id === 'focus') return HOW[howStep - 1];
    return 'tri';
  }

  function frameLoop(now) {
    raf = 0;
    const t = reduced ? 20 : (now - start) / 1000;
    const portrait = camera.aspect < 0.9;
    const spec = (portrait && station.dataset.stageM ? station.dataset.stageM : station.dataset.stage).split(' ').map(Number);
    const theme = station.dataset.theme;
    const snap = reduced || state.first;
    const k = snap ? 1 : 0.075;
    state.first = false;
    state.x += (spec[0] * viewW / 2 - state.x) * k;
    state.y += (spec[1] * viewH / 2 - state.y) * k;
    state.s += (spec[2] - state.s) * k;
    state.a += (spec[3] - state.a) * k;
    state.tilt += (spec[4] - state.tilt) * k;
    state.dark += ((theme === 'dark' ? 1 : 0) - state.dark) * k;
    state.coral += ((theme === 'coral' ? 1 : 0) - state.coral) * k;
    const calm = 1; // loose pieces and dust are switched off site-wide; the data points are the only 3D
    state.calm += (calm - state.calm) * k;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

    // move every point toward its place in the current formation
    const name = formation(t), target = F[name];
    const p = cur.pos, c = cur.col, tp = target.pos, tc = target.col;
    for (let i = 0; i < N; i++) {
      const e = snap ? 1 : 0.035 + seed[i] * 0.075, j = i * 3;
      p[j] += (tp[j] - p[j]) * e; p[j + 1] += (tp[j + 1] - p[j + 1]) * e; p[j + 2] += (tp[j + 2] - p[j + 2]) * e;
      c[j] += (tc[j] - c[j]) * e; c[j + 1] += (tc[j + 1] - c[j + 1]) * e; c[j + 2] += (tc[j + 2] - c[j + 2]) * e;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aCol.needsUpdate = true;

    furniture.forEach(([rods, shownIn, maxOpacity]) => {
      const on = shownIn.includes(name) ? 1 : 0;
      rods.forEach((r, idx) => {
        const u = r.userData;
        u.grow += (on - u.grow) * (snap ? 1 : on ? 0.045 : 0.14);
        const g = clamp(u.grow * (1 + idx * 0.25) - idx * 0.25); // rods of a set draw one after another
        r.scale.set(u.radius, Math.max(0.0001, u.len * g), u.radius);
        r.material.opacity = g * maxOpacity * state.a;
        r.visible = g > 0.002;
      });
    });

    group.position.set(state.x, state.y, 0);
    group.scale.setScalar(state.s);
    group.rotation.set(0.1 + mouse.y * 0.25, (reduced ? 0.32 : Math.sin(t * 0.3) * 0.34) + mouse.x * 0.7, state.tilt);
    U.uScale.value = state.s;
    U.uAlpha.value = state.a;
    U.uLight.value = state.dark;
    U.uCoral.value = state.coral;
    data.visible = state.a > 0.01;

    const sy = scrollY;
    floatMat.opacity = floatMax * (1 - state.calm);
    floaters.visible = floatMat.opacity > 0.01;
    if (floaters.visible) {
      for (let i = 0; i < FLOAT; i++) {
        const d = drift[i];
        const kz = (CAM - d.z) / CAM, hz = viewH * kz, wz = viewW * kz;
        const yy = (((d.ny + (sy * d.speed) / (H * 2.4)) % 1) + 1) % 1;
        dummy.position.set(d.nx * wz * 0.56 + mouse.x * -0.25 * d.speed, (yy - 0.5) * hz * 1.35, d.z);
        dummy.rotation.set(t * d.spin + d.ph + sy * 0.002, t * d.spin * 0.7 + d.ph, d.ph);
        dummy.scale.setScalar(d.size);
        dummy.updateMatrix();
        floaters.setMatrixAt(i, dummy.matrix);
      }
      floaters.instanceMatrix.needsUpdate = true;
      floatMat.emissiveIntensity = state.coral * 0.75;
    }
    dustU.uTime.value = t;
    dustU.uLight.value = Math.max(state.dark * 0.7, state.coral);
    dustU.uAlpha.value = 1 - state.calm;

    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(frameLoop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frameLoop); };
  kick();
  if (reduced) { addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); }
}

initStage().catch((err) => {
  console.warn('3D stage unavailable, continuing without it.', err);
  canvas.style.display = 'none';
});
