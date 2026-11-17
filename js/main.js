// The Research Shop — interactions. No build step; Three.js is vendored locally.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ?still in the URL gives the same settled, motion-free page as the reduced-motion setting.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('still');
if (reduced) document.documentElement.classList.add('still');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

$('#year').textContent = new Date().getFullYear();

/* ── headings: split into words so each rises on its own ── */
$$('[data-split]').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w, i) =>
    `<span class="w" aria-hidden="true"><span style="--d:${i}">${w}</span></span>`).join(' ');
});

/* ── reveal on scroll ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
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
if (finePointer) addEventListener('pointermove', (e) => { peekTX = e.clientX + 28; peekTY = e.clientY - 110; });

/* ── 3D tilt on cards ── */
if (finePointer && !reduced) {
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(8px)`;
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

/* ── scroll-driven layers: progress bar, parallax, stacking cards ── */
const bar = $('.progress span');
const parallax = $$('[data-speed]').map((el) => ({ el, speed: parseFloat(el.dataset.speed) }));
const steps = $$('.step');
let lastY = scrollY, ticking = false;

function onScroll() {
  const y = scrollY, vh = innerHeight;
  bar.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - vh))})`;
  if (menu.hidden) nav.classList.toggle('is-hidden', y > lastY && y > 300);
  lastY = y;
  if (!reduced) {
    parallax.forEach(({ el, speed }) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * speed).toFixed(1)}px, 0)`;
    });
    steps.forEach((s, i) => {
      const next = steps[i + 1];
      if (!next) return;
      const a = s.getBoundingClientRect(), b = next.getBoundingClientRect();
      const covered = clamp((a.bottom - b.top) / a.height);
      s.style.transform = `scale(${(1 - covered * 0.05).toFixed(4)})`;
    });
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* ── the 3D stage ──
   The logo is a triangle made of triangles (a Sierpinski triangle). Here it is in three
   dimensions, drawn by the "chaos game": thousands of random points that settle into order.
   Scattered points are the question; the formed triangle is the answer. */
const canvas = $('#stage');
const heroEl = $('[data-window="hero"]'), ctaEl = $('[data-window="cta"]');
let stage = null;

async function initStage() {
  const THREE = await import('../assets/vendor/three.module.min.js');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = innerWidth < 760;
  const pr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 6;

  const S = 1.55;
  const V = [
    [0, 1, 0],
    [Math.sqrt(8 / 9), -1 / 3, 0],
    [-Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3)],
    [-Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3)],
  ].map((v) => v.map((n) => n * S));

  const N = small ? 9000 : 24000;
  const target = new Float32Array(N * 3), scatter = new Float32Array(N * 3), seed = new Float32Array(N);
  let p = [0, 0, 0];
  for (let i = -20; i < N; i++) {
    const v = V[(Math.random() * 4) | 0];
    p = [(p[0] + v[0]) / 2, (p[1] + v[1]) / 2, (p[2] + v[2]) / 2];
    if (i < 0) continue;
    target.set(p, i * 3);
    const r = 3 + Math.random() * 5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    scatter.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th)], i * 3);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uProgress: { value: 0 }, uTime: { value: 0 }, uPR: { value: pr }, uDark: { value: 0 },
    uSize: { value: small ? 2.0 : 2.3 }, uAlpha: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec3 aScatter; attribute float aSeed;
      uniform float uProgress, uTime, uPR, uSize;
      varying float vSeed; varying float vFog;
      void main() {
        float t = clamp(uProgress * 1.7 - aSeed * 0.7, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 drift = vec3(sin(uTime * 0.5 + aSeed * 40.0), cos(uTime * 0.4 + aSeed * 27.0), sin(uTime * 0.3 + aSeed * 61.0));
        vec3 pos = mix(aScatter + drift * 0.35, position + drift * 0.006, t);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (0.55 + aSeed * 0.9) * (6.0 / -mv.z);
        vSeed = aSeed;
        vFog = smoothstep(9.5, 4.2, -mv.z);
      }`,
    fragmentShader: `
      precision mediump float;
      uniform float uDark, uAlpha;
      varying float vSeed; varying float vFog;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        vec3 ink = mix(vec3(0.024, 0.153, 0.157), vec3(0.50, 0.89, 0.855), uDark);
        vec3 teal = mix(vec3(0.0, 0.655, 0.616), vec3(0.918, 0.945, 0.937), uDark);
        vec3 coral = vec3(1.0, 0.42, 0.29);
        vec3 col = mix(ink, teal, step(0.58, vSeed));
        col = mix(col, coral, step(0.985, vSeed));
        float a = smoothstep(0.5, 0.2, d) * (0.35 + 0.65 * vFog) * uAlpha;
        gl_FragColor = vec4(col, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);

  const edgeGeo = new THREE.BufferGeometry();
  const e = [];
  [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]].forEach(([a, b]) => e.push(...V[a], ...V[b]));
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(e, 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x00a79d, transparent: true, opacity: 0 });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);

  const group = new THREE.Group();
  group.add(points, edges);
  scene.add(group);

  let W = 0, H = 0, viewW = 0, viewH = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    viewH = 2 * Math.tan((35 * Math.PI) / 360) * 6;
    viewW = viewH * camera.aspect;
  }
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) addEventListener('pointermove', (ev) => { mouse.tx = ev.clientX / W - 0.5; mouse.ty = ev.clientY / H - 0.5; });

  const state = { progress: 0, dark: 0, x: 0, y: 0, scale: 0.6, alpha: 1 };
  const start = performance.now();
  let running = false, raf = 0;

  function frame(now) {
    const t = (now - start) / 1000;
    const vh = H;
    const hr = heroEl.getBoundingClientRect(), cr = ctaEl.getBoundingClientRect();
    const heroVis = clamp(hr.bottom / vh) * (hr.bottom > 0 ? 1 : 0);
    const ctaVis = cr.top < vh && cr.bottom > 0 ? clamp(1 - Math.abs(cr.top + cr.height / 2 - vh / 2) / (vh * 0.85)) : 0;
    const inCta = cr.top < vh * 1.15 && cr.bottom > -vh * 0.15;
    document.body.classList.toggle('is-dark', inCta);

    const intro = reduced ? 1 : clamp((t - 0.25) / 2.6);
    const portrait = camera.aspect < 0.9;
    let tp, tx, ty, ts, ta;
    if (inCta) {
      tp = clamp(ctaVis * 1.35); tx = 0; ty = 0.1; ts = portrait ? viewW / 3.3 : 1.45; ta = 0.55;
    } else {
      tp = Math.min(intro, clamp(heroVis * 1.5 - 0.35));
      tx = portrait ? viewW * 0.2 : viewW * 0.27;
      ty = portrait ? viewH * 0.2 : 0.16;
      ts = portrait ? viewW / 4.6 : Math.min(1.12, viewW / 6.2);
      ta = portrait ? 0.8 : 1;
    }
    const k = reduced ? 1 : 0.07;
    state.progress += (tp - state.progress) * k;
    const m = reduced ? 1 : 0.1;
    state.dark += ((inCta ? 1 : 0) - state.dark) * m;
    state.x += (tx - state.x) * m; state.y += (ty - state.y) * m;
    state.scale += (ts - state.scale) * m; state.alpha += (ta - state.alpha) * m;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;

    uniforms.uProgress.value = state.progress;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uDark.value = state.dark;
    uniforms.uAlpha.value = state.alpha;
    edgeMat.opacity = Math.pow(state.progress, 6) * 0.32 * state.alpha;
    edgeMat.color.setHex(state.dark > 0.5 ? 0x7fe3da : 0x00a79d);
    group.position.set(state.x, state.y, 0);
    group.scale.setScalar(state.scale);
    group.rotation.y = (reduced ? 0.5 : t * 0.14) + mouse.x * 0.9;
    group.rotation.x = 0.12 + mouse.y * 0.35;
    renderer.render(scene, camera);

    raf = running && !reduced ? requestAnimationFrame(frame) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  // Only draw while one of the two "windows" (hero, call to action) is on screen.
  const seen = new Set();
  const vis = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
    running = seen.size > 0;
    if (running) kick();
  }, { rootMargin: '20% 0px' });
  vis.observe(heroEl); vis.observe(ctaEl);
  if (reduced) addEventListener('scroll', kick, { passive: true });
  stage = { kick };
}

initStage().catch((err) => {
  console.warn('3D stage unavailable, continuing without it.', err);
  canvas.style.display = 'none';
});

// The services preview should follow the cursor even when the 3D stage is paused or missing.
if (finePointer) {
  (function follow() {
    if (peek.classList.contains('is-on')) {
      peekX += (peekTX - peekX) * 0.16; peekY += (peekTY - peekY) * 0.16;
      peek.style.transform = `translate3d(${peekX.toFixed(1)}px, ${peekY.toFixed(1)}px, 0)`;
    }
    requestAnimationFrame(follow);
  })();
}
