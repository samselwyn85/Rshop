// The Research Shop — interactions. No build step; Three.js is vendored locally.
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

/* ── services accordion + floating image preview ── */
const peek = $('#peek'), peekImg = $('img', peek);
let peekX = 0, peekY = 0, peekTX = 0, peekTY = 0;
$$('.svc__item').forEach((item) => {
  const row = $('.svc__row', item);
  row.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', String(open));
    peek.classList.remove('is-on');
  });
  if (finePointer) {
    row.addEventListener('pointerenter', () => {
      if (item.classList.contains('is-open')) return;
      peekImg.src = $('img', item).getAttribute('src');
      peek.classList.add('is-on');
    });
    row.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  }
});
if (finePointer) {
  addEventListener('pointermove', (e) => { peekTX = e.clientX + 28; peekTY = e.clientY - 110; });
  (function follow() {
    if (peek.classList.contains('is-on')) {
      peekX += (peekTX - peekX) * 0.16; peekY += (peekTY - peekY) * 0.16;
      peek.style.transform = `translate3d(${peekX.toFixed(1)}px, ${peekY.toFixed(1)}px, 0)`;
    }
    requestAnimationFrame(follow);
  })();
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

function onScroll() {
  const y = scrollY, vh = innerHeight, mid = vh * 0.5;
  bar.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - vh))})`;
  if (menu.hidden) nav.classList.toggle('is-hidden', y > lastY && y > 300);
  lastY = y;

  for (const s of themed) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { station = s; break; }
  }
  if (document.body.dataset.theme !== station.dataset.theme) document.body.dataset.theme = station.dataset.theme;

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
   The logo is a triangle made of triangles (a Sierpinski triangle). Here it is as a solid:
   small tetrahedra fly in and lock together, then the finished shape travels down the page,
   turning as you scroll and loosening when you scroll fast. Loose pieces drift at other depths. */
const canvas = $('#stage');

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
  const rim = new THREE.DirectionalLight(0x38c695, 0.9);
  rim.position.set(-5, -2, -3);
  scene.add(rim);

  // A regular tetrahedron, centred, point up — so its silhouette is the logo's triangle.
  const S = 1.55;
  const V = [
    [0, 1, 0],
    [Math.sqrt(8 / 9), -1 / 3, 0],
    [-Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3)],
    [-Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3)],
  ].map((v) => v.map((n) => n * S));
  const tri = [];
  [[0, 2, 1], [0, 3, 2], [0, 1, 3], [1, 2, 3]].forEach((f) => f.forEach((i) => tri.push(...V[i])));
  const tetGeo = new THREE.BufferGeometry();
  tetGeo.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  tetGeo.computeVertexNormals();

  const palette = [0x00a79d, 0x00a79d, 0x00a79d, 0x00a79d, 0x00a79d, 0x38c695, 0x38c695, 0x38c695, 0x404248, 0xfc5f45];
  const pick = () => new THREE.Color(palette[(Math.random() * palette.length) | 0]);

  // Sierpinski tetrahedron: 4^LEVEL small copies.
  const LEVEL = small ? 3 : 4, COUNT = 4 ** LEVEL, UNIT = 1 / 2 ** LEVEL;
  const mat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.42, metalness: 0.08, transparent: true, side: THREE.DoubleSide });
  const pyramid = new THREE.InstancedMesh(tetGeo, mat, COUNT);
  const pieces = [];
  for (let i = 0; i < COUNT; i++) {
    const p = [0, 0, 0];
    let n = i;
    for (let k = 1; k <= LEVEL; k++) {
      const v = V[n % 4]; n = (n / 4) | 0;
      p[0] += v[0] / 2 ** k; p[1] += v[1] / 2 ** k; p[2] += v[2] / 2 ** k;
    }
    const r = 3.5 + Math.random() * 4.5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pieces.push({
      target: new THREE.Vector3(...p),
      scatter: new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th)),
      rot: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      seed: Math.random(),
    });
    pyramid.setColorAt(i, pick());
  }
  const group = new THREE.Group();
  group.add(pyramid);
  scene.add(group);

  // Loose pieces drifting at different depths.
  const FLOAT = small ? 12 : 30;
  const floatMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.4, metalness: 0.08, emissive: 0xffffff, emissiveIntensity: 0, side: THREE.DoubleSide, transparent: true, opacity: small ? 0.45 : 0.7 });
  const floaters = new THREE.InstancedMesh(tetGeo, floatMat, FLOAT);
  const drift = [];
  for (let i = 0; i < FLOAT; i++) {
    const z = -5 + Math.random() * (small ? 5 : 7.5);
    drift.push({ nx: Math.random() * 2 - 1, ny: Math.random(), z, size: 0.035 + Math.random() * 0.075, speed: 0.35 + (z + 5) / 7.5, spin: 0.2 + Math.random() * 0.6, ph: Math.random() * 6 });
    floaters.setColorAt(i, new THREE.Color([0x00a79d, 0x38c695, 0x00a79d, 0xfc5f45][i % 4])); // no charcoal: these pass behind text
  }
  scene.add(floaters);

  // Fine dust for atmosphere.
  const DUST = small ? 700 : 2200;
  const dustPos = new Float32Array(DUST * 3), dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, -6 + Math.random() * 9], i * 3);
    dustSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  const dustU = { uTime: { value: 0 }, uPR: { value: pr }, uLight: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
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
      precision mediump float; uniform float uLight; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(vec3(0.25, 0.26, 0.28), vec3(0.0, 0.655, 0.616), step(0.6, vSeed));
        col = mix(col, vec3(1.0), uLight);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.15, d) * 0.55);
      }`,
  }));
  scene.add(dust);

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

  const state = { x: 0, y: 0, s: 0.5, a: 1, tilt: 0, dark: 0, coral: 0, burst: 0, first: true };
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Vector3();
  const white = new THREE.Color(1, 1, 1), shade = new THREE.Color(0.2, 0.2, 0.25);
  const start = performance.now();
  let prevScroll = scrollY, raf = 0;

  function frame(now) {
    raf = 0;
    const t = reduced ? 20 : (now - start) / 1000;
    const portrait = camera.aspect < 0.9;
    const spec = (portrait && station.dataset.stageM ? station.dataset.stageM : station.dataset.stage).split(' ').map(Number);
    const theme = station.dataset.theme;
    const m = reduced || state.first ? 1 : 0.075;
    state.first = false;
    state.x += (spec[0] * viewW / 2 - state.x) * m;
    state.y += (spec[1] * viewH / 2 - state.y) * m;
    state.s += (spec[2] - state.s) * m;
    state.a += (spec[3] - state.a) * m;
    state.tilt += (spec[4] - state.tilt) * m;
    state.dark += ((theme === 'dark' ? 1 : 0) - state.dark) * m;
    state.coral += ((theme === 'coral' ? 1 : 0) - state.coral) * m;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

    const sy = scrollY, vel = Math.abs(sy - prevScroll);
    prevScroll = sy;
    state.burst += ((reduced ? 0 : clamp(vel / 70)) - state.burst) * 0.09;

    // pieces fly in on load, loosen while scrolling fast
    const intro = reduced ? 1 : clamp((t - 0.2) / 2.8);
    for (let i = 0; i < COUNT; i++) {
      const pc = pieces[i];
      let f = clamp(intro * 1.7 - pc.seed * 0.7);
      f = f * f * (3 - 2 * f);
      const loose = 1 - f + state.burst * pc.seed * 0.55;
      tmp.copy(pc.target).multiplyScalar(1 + state.burst * (0.25 + pc.seed * 0.9));
      dummy.position.lerpVectors(pc.scatter, tmp, f);
      dummy.rotation.set(pc.rot.x * loose, pc.rot.y * loose, pc.rot.z * loose);
      dummy.scale.setScalar(UNIT * (0.25 + 0.75 * f));
      dummy.updateMatrix();
      pyramid.setMatrixAt(i, dummy.matrix);
    }
    pyramid.instanceMatrix.needsUpdate = true;

    group.position.set(state.x, state.y, 0);
    group.scale.setScalar(state.s);
    group.rotation.set(0.14 + mouse.y * 0.3, (reduced ? 0.55 : t * 0.16) + sy * 0.0022 + mouse.x * 0.8, state.tilt);
    mat.opacity = state.a;
    mat.color.copy(white).lerp(shade, state.coral);
    pyramid.visible = state.a > 0.01;

    // loose pieces: wrap vertically so they drift past as the page scrolls
    for (let i = 0; i < FLOAT; i++) {
      const d = drift[i];
      const k = (CAM - d.z) / CAM, hz = viewH * k, wz = viewW * k;
      const yy = (((d.ny + (sy * d.speed) / (H * 2.4)) % 1) + 1) % 1;
      dummy.position.set(d.nx * wz * 0.56 + mouse.x * -0.25 * d.speed, (yy - 0.5) * hz * 1.35, d.z);
      dummy.rotation.set(t * d.spin + d.ph + sy * 0.002, t * d.spin * 0.7 + d.ph, d.ph);
      dummy.scale.setScalar(d.size);
      dummy.updateMatrix();
      floaters.setMatrixAt(i, dummy.matrix);
    }
    floaters.instanceMatrix.needsUpdate = true;
    floatMat.emissiveIntensity = state.coral * 0.75;

    dustU.uTime.value = t;
    dustU.uLight.value = Math.max(state.dark * 0.7, state.coral);
    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  kick();
  if (reduced) { addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); }
}

initStage().catch((err) => {
  console.warn('3D stage unavailable, continuing without it.', err);
  canvas.style.display = 'none';
});
