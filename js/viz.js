// Service animations: each service gets a small 3D figure made of data points.
// Every figure plays as a short loop: it builds in a meaningful order (bars rise one by
// one, seats fill left to right), keeps moving while it holds, then dissolves and replays.
// Drawn on plain 2D canvases with their own perspective projection, so ten of them cost
// almost nothing and need no extra WebGL contexts.

const TEAL = '#00A79D', MINT = '#38C695', CORAL = '#FC5F45', CHAR = '#404248', GREY = '#B9BDC6', SOFT = '#8E939B', AQUA = '#5CC9C2';
const rnd = Math.random, sin = Math.sin, cos = Math.cos, TAU = Math.PI * 2;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.87; // roughly normal, sd ≈ 0.5
// a point: position, colour, o = when it arrives in the build (0 first … 1 last), g = group
const P = (x, y, z, c, o = rnd(), g = 0) => ({ x, y, z, c, o, g });
const L = (a, b, c = CORAL, w = 1.5, o = 1) => ({ a, b, c, w, o });

/* ── the ten figures. Coordinates: x −1.6…1.6, y −1…1, z toward the viewer.
      live(q, t, out) moves a settled point for the current time. ── */
const figures = {
  // Qualitative analysis: loose observations gather into themes, one theme at a time
  clusters() {
    const pts = [], centres = [[-1.1, 0.35, 0.2, TEAL], [-0.35, -0.45, -0.3, MINT], [0.35, 0.42, -0.2, CORAL], [1.05, -0.3, 0.3, CHAR], [0, 0, 0.5, AQUA]];
    centres.forEach(([x, y, z, c], g) => { for (let i = 0; i < 72; i++) pts.push(P(x + gauss() * 0.36, y + gauss() * 0.3, z + gauss() * 0.3, c, g / 5 * 0.8 + rnd() * 0.2, g)); });
    for (let i = 0; i < 40; i++) pts.push(P((rnd() - 0.5) * 3.1, (rnd() - 0.5) * 1.8, rnd() - 0.5, GREY, rnd(), 9));
    return { pts, lines: [], tilt: 0.12, live(q, t, o) { const a = t * 0.7 + q.g * 1.3 + q.ph; o.x += cos(a) * 0.05; o.y += sin(a * 1.3) * 0.05; } };
  },
  // Quantitative analysis: bars rise in turn, then the fitted line is drawn
  bars() {
    const pts = [], h = [0.3, 0.45, 0.4, 0.62, 0.8, 1];
    h.forEach((v, b) => { const n = Math.round(22 + v * 70); for (let i = 0; i < n; i++) { const u = rnd(); pts.push(P((b - 2.5) * 0.44 + (rnd() - 0.5) * 0.26, -0.9 + u * v * 1.7, (rnd() - 0.5) * 0.26, b % 2 ? MINT : TEAL, b / 6 * 0.7 + u * 0.25, b)); } });
    return {
      pts, tilt: 0.14,
      lines: [L([-1.45, -0.9, 0], [1.45, -0.9, 0], CHAR, 1, 0), L([-1.45, -0.9, 0], [-1.45, 0.95, 0], CHAR, 1, 0.1), L([-1.3, -0.5, 0.2], [1.3, 0.86, 0.2], CORAL, 2.5, 1)],
      live(q, t, o) { o.y = -0.9 + (q.y + 0.9) * (1 + 0.08 * sin(t * 1.5 + q.g * 0.9)); },
    };
  },
  // User needs assessments: the desired state moves above the current one; the gap is measured
  layers() {
    const pts = [], lines = [];
    const wave = (x, z, t) => 0.42 + 0.14 * sin(x * 2.2 + t * 1.5) * cos(z * 3 + t * 0.7);
    for (let i = 0; i < 17; i++) for (let j = 0; j < 9; j++) {
      const x = -1.3 + (i / 16) * 2.6, z = -0.7 + (j / 8) * 1.4;
      pts.push(P(x, -0.55, z, GREY, i / 17 * 0.5, 0), P(x, wave(x, z, 0), z, TEAL, 0.35 + i / 17 * 0.5, 1));
      if (i % 4 === 2 && j % 4 === 2) { const l = L([x, -0.55, z], [x, 0.42, z], CORAL, 1.5, i / 17); l.fb = (t) => [x, wave(x, z, t), z]; lines.push(l); }
    }
    return { pts, lines, tilt: 0.5, live(q, t, o) { if (q.g) o.y = wave(q.x, q.z, t); } };
  },
  // Questionnaire development: questions written line by line, then ticked off
  form() {
    const pts = [], len = [1.9, 1.3, 1.7, 1.0, 1.5], ticked = [1, 1, 0, 1, 0];
    len.forEach((w, r) => {
      const y = 0.76 - r * 0.38;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
        const edge = i === 0 || j === 0 || i === 4 || j === 4;
        if (ticked[r] || edge) { const q = P(-1.35 + i * 0.05, y - 0.1 + j * 0.05, 0.1, ticked[r] ? TEAL : SOFT, r / 5 * 0.8 + 0.17, ticked[r] ? r + 1 : 0); q.cx = -1.25; q.cy = y; pts.push(q); }
      }
      const n = Math.round(w * 24);
      for (let i = 0; i < n; i++) pts.push(P(-0.95 + (i / n) * w, y + (i % 2 ? 0.035 : -0.035), 0, SOFT, r / 5 * 0.8 + (i / n) * 0.15, 0));
    });
    return { pts, lines: [], tilt: 0.08, yaw: -0.18, live(q, t, o) { if (!q.g) return; const k = 1 + 0.22 * Math.max(0, sin(t * 2.2 - q.g * 1.1)) ** 3; o.x = q.cx + (q.x - q.cx) * k; o.y = q.cy + (q.y - q.cy) * k; } };
  },
  // Data collection: sources keep streaming down the funnel into one ordered set
  funnel() {
    const pts = [];
    for (let i = 0; i < 230; i++) { const q = P(0, 0.5, 0, GREY, rnd() * 0.45, 1); q.yy = rnd() * 0.95; q.rr = Math.sqrt(rnd()); q.a = rnd() * TAU; pts.push(q); }
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 2; k++) pts.push(P(-0.55 + i * 0.1, -0.95 + j * 0.13, -0.08 + k * 0.16, TEAL, 0.45 + j / 6 * 0.5, 0));
    return {
      pts, lines: [], tilt: 0.3,
      live(q, t, o) {
        if (!q.g) return;
        const y = (((q.yy - t * 0.13) % 0.95) + 0.95) % 0.95, r = 0.1 + 1.35 * (y / 0.95) * q.rr, a = q.a + t * 0.6;
        o.x = r * cos(a); o.y = y + 0.02; o.z = r * sin(a) * 0.7; o.c = y > 0.45 ? GREY : MINT;
      },
    };
  },
  // Report-writing: pages laid out, written line by line, with the chart last
  pages() {
    const pts = [], lines = [], bob = (g, t) => 0.04 * sin(t * 1.1 + g * 1.5);
    [[-0.3, 0.14, -0.4, GREY, GREY], [0, 0, 0, GREY, SOFT], [0.3, -0.14, 0.4, CHAR, TEAL]].forEach(([ox, oy, z, frame, ink], pg) => {
      const w = 0.62, h = 0.85, c = [[ox - w, oy - h, z], [ox + w, oy - h, z], [ox + w, oy + h, z], [ox - w, oy + h, z]];
      c.forEach((a, i) => { const b = c[(i + 1) % 4], l = L(a, b, frame, pg === 2 ? 1.6 : 1, pg / 3); l.fa = (t) => [a[0], a[1] + bob(pg, t), a[2]]; l.fb = (t) => [b[0], b[1] + bob(pg, t), b[2]]; lines.push(l); });
      const rows = pg === 2 ? [1, 0.7, 0.95, 0.85, 0.5] : [1, 0.8, 0.9, 0.6, 0.95, 0.7, 0.85];
      rows.forEach((f, r) => { const n = Math.round(f * 22); for (let i = 0; i < n; i++) pts.push(P(ox - w + 0.12 + (i / 22) * (2 * w - 0.24), oy + h - 0.18 - r * 0.2, z, ink, pg / 3 * 0.55 + r / 7 * 0.2 + (i / 22) * 0.08, pg)); });
      if (pg === 2) [0.22, 0.34, 0.48].forEach((bh, b) => { for (let i = 0; i < 16; i++) pts.push(P(ox - 0.3 + b * 0.3 + (rnd() - 0.5) * 0.16, oy - h + 0.1 + rnd() * bh, z, CORAL, 0.85 + b * 0.05, pg)); });
    });
    return { pts, lines, tilt: 0.12, yaw: -0.4, live(q, t, o) { o.y += bob(q.g, t); } };
  },
  // Focus group work: people take their seats, then the conversation moves around the circle
  ring() {
    const pts = [], lines = [], cols = [TEAL, CORAL, MINT, CHAR, AQUA, TEAL, CORAL, MINT], bob = (g, t) => 0.05 * sin(t * 2 + g * 0.8);
    const head = (p) => { const a = (p / 8) * TAU; return [cos(a) * 1.15, 0.26, sin(a) * 0.9]; };
    for (let p = 0; p < 8; p++) {
      const [x, , z] = head(p);
      for (let i = 0; i < 14; i++) pts.push(P(x + gauss() * 0.11, 0.26 + gauss() * 0.11, z + gauss() * 0.11, cols[p], p / 8 * 0.8, p));
      for (let i = 0; i < 26; i++) pts.push(P(x + gauss() * 0.2, -0.16 + gauss() * 0.24, z + gauss() * 0.2, cols[p], p / 8 * 0.8 + 0.05, p));
    }
    [[0, 3], [3, 6], [6, 1], [1, 4], [4, 7], [7, 2], [2, 5], [5, 0]].forEach(([a, b], i) => {
      const l = L(head(a), head(b), CORAL, 1.4, i / 8);
      l.fa = (t) => { const h = head(a); return [h[0], h[1] + bob(a, t), h[2]]; };
      l.fb = (t) => { const h = head(b); return [h[0], h[1] + bob(b, t), h[2]]; };
      l.pulse = (t) => 0.18 + 0.82 * Math.max(0, sin(t * 1.5 - i * 0.785)) ** 2; // the "speaker" passes round
      lines.push(l);
    });
    return { pts, lines, tilt: 0.5, live(q, t, o) { o.y += bob(q.g, t); } };
  },
  // Cultural competency: two groups move toward each other and share ground
  meet() {
    const pts = [];
    [[-0.5, TEAL, -0.14, -1], [0.5, CORAL, 0.14, 1]].forEach(([cx, c, z, side]) => {
      for (let i = 0; i < 210; i++) { const r = 0.88 * Math.sqrt(rnd()), a = rnd() * TAU; pts.push(P(cx + side * 0.2 + r * cos(a), r * sin(a), z + gauss() * 0.08, c, rnd() * 0.8, side)); }
    });
    return { pts, lines: [], tilt: 0.14, live(q, t, o) { o.x -= q.g * 0.36 * (0.5 - 0.5 * cos(t * 0.8)); const a = t * 0.5 + q.ph; o.x += cos(a) * 0.02; o.y += sin(a) * 0.02; } };
  },
  // Insights analysis: the part of your existing data that matters lights up and is circled
  insight() {
    const pts = [], lines = [], cx = 0.55, cy = 0.12, grow = (t) => 1 + 0.09 * sin(t * 1.8);
    for (let i = 0; i < 300; i++) pts.push(P((rnd() - 0.5) * 3, (rnd() - 0.5) * 1.75, (rnd() - 0.5) * 0.8, GREY, rnd() * 0.5, 0));
    for (let i = 0; i < 95; i++) pts.push(P(cx + gauss() * 0.34, cy + gauss() * 0.3, gauss() * 0.3, i % 6 ? TEAL : MINT, 0.6 + rnd() * 0.3, 1));
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU, b = ((i + 1) / 36) * TAU, l = L([0, 0, 0], [0, 0, 0], CORAL, 1.8, i / 36);
      l.fa = (t) => [cx + cos(a + t * 0.3) * 0.56 * grow(t), cy + sin(a + t * 0.3) * 0.56 * grow(t), 0];
      l.fb = (t) => [cx + cos(b + t * 0.3) * 0.56 * grow(t), cy + sin(b + t * 0.3) * 0.56 * grow(t), 0];
      l.pulse = () => (i % 3 === 2 ? 0 : 1); // dashed
      lines.push(l);
    }
    return { pts, lines, tilt: 0.1, live(q, t, o) { if (q.g) { o.x = cx + (q.x - cx) * grow(t); o.y = cy + (q.y - cy) * grow(t); } else { o.y += 0.02 * sin(t * 0.8 + q.ph); } } };
  },
  // Political polling: seats fill left to right, then a ripple runs through the chamber
  hemi() {
    const pts = [];
    [0.55, 0.8, 1.05, 1.3].forEach((r) => {
      const n = Math.round(r * 22);
      for (let s = 0; s < n; s++) {
        const f = s / (n - 1), a = Math.PI * (1 - f);
        const c = f < 0.42 ? TEAL : f < 0.72 ? CORAL : f < 0.9 ? MINT : GREY;
        for (let i = 0; i < 4; i++) { const q = P(r * cos(a) * 1.15 + gauss() * 0.035, r * sin(a) * 1.15 - 0.75 + gauss() * 0.035, (0.9 - r) * 0.6, c, f * 0.9, 0); q.f = f; pts.push(q); }
      }
    });
    return { pts, lines: [L([-1.55, -0.78, 0.2], [1.55, -0.78, 0.2], CHAR, 1, 0)], tilt: 0.22, live(q, t, o) { o.y += 0.035 * Math.max(0, sin(t * 2.2 - q.f * 7)) ** 2; } };
  },
};

const BUILD = 2.6, HOLD = 6.4, FADE = 1.1, CYCLE = BUILD + HOLD + FADE; // seconds per loop
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initViz({ reduced, finePointer }) {
  const all = [...document.querySelectorAll('canvas[data-viz]')].map((canvas) => {
    const fig = figures[canvas.dataset.viz]();
    fig.pts.forEach((p) => { p.sx = (rnd() - 0.5) * 3.6; p.sy = (rnd() - 0.5) * 2.2; p.sz = (rnd() - 0.5) * 1.6; p.r = 0.75 + rnd() * 0.6; p.ph = rnd() * TAU; });
    return { canvas, ctx: canvas.getContext('2d'), fig, item: canvas.closest('.svc__item'), clock: 0, seen: false, w: 0, h: 0, order: fig.pts.map((_, i) => i), scr: new Float32Array(fig.pts.length * 4), col: new Array(fig.pts.length) };
  });
  let mx = 0;
  if (finePointer) addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; });

  function size(v) {
    const r = v.canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return false;
    if (v.w !== r.width || v.h !== r.height) {
      v.w = r.width; v.h = r.height;
      v.canvas.width = Math.round(r.width * dpr); v.canvas.height = Math.round(r.height * dpr);
      v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return true;
  }

  const out = { x: 0, y: 0, z: 0, c: '' };
  // p: how far the figure is built (0 scattered … 1 complete); t: time for the live motion
  function draw(v, p, t) {
    if (!size(v)) return;
    const { ctx, fig, w, h, scr, col } = v;
    const yaw = (fig.yaw || 0) + (reduced ? 0.25 : sin(t * 0.45) * 0.34) + mx * 0.5, tilt = fig.tilt + (reduced ? 0 : sin(t * 0.3) * 0.04);
    const cy = cos(yaw), sy = sin(yaw), ct = cos(tilt), st = sin(tilt);
    const scale = Math.min(w / 4.1, h / 2.6), D = 4.2;
    const proj = (x, y, z) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const f = D / (D - z2);
      return [w / 2 + x1 * scale * f, h / 2 - y2 * scale * f, z2];
    };
    ctx.clearRect(0, 0, w, h);

    ctx.lineCap = 'round';
    fig.lines.forEach((l) => {
      const g = clamp01((p - (0.55 + l.o * 0.3)) / 0.15);
      const alpha = g * (l.pulse ? l.pulse(t) : 1);
      if (alpha < 0.01) return;
      const a = proj(...(l.fa ? l.fa(t) : l.a)), b = proj(...(l.fb ? l.fb(t) : l.b));
      ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = l.c; ctx.lineWidth = l.w;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g); ctx.stroke();
    });

    const pts = fig.pts;
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      let e = clamp01((p - q.o * 0.5) / 0.5);
      e = e * e * (3 - 2 * e);
      out.x = q.x; out.y = q.y; out.z = q.z; out.c = q.c;
      if (fig.live && e > 0) fig.live(q, t, out);
      const s = proj(q.sx + (out.x - q.sx) * e, q.sy + (out.y - q.sy) * e, q.sz + (out.z - q.sz) * e);
      scr[i * 4] = s[0]; scr[i * 4 + 1] = s[1]; scr[i * 4 + 2] = s[2]; scr[i * 4 + 3] = e;
      col[i] = e > 0.4 ? out.c : GREY;
    }
    v.order.sort((a, b) => scr[a * 4 + 2] - scr[b * 4 + 2]);
    const base = Math.max(1.5, scale * 0.022);
    for (const i of v.order) {
      const z = scr[i * 4 + 2];
      ctx.globalAlpha = (0.5 + 0.5 * clamp01((z + 1.2) / 2)) * (0.35 + 0.65 * scr[i * 4 + 3]);
      ctx.fillStyle = col[i];
      ctx.beginPath(); ctx.arc(scr[i * 4], scr[i * 4 + 1], base * pts[i].r * (D / (D - z)), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const io = new IntersectionObserver((entries) => entries.forEach((en) => { all.find((v) => v.canvas === en.target).seen = en.isIntersecting; }), { threshold: 0.15 });
  all.forEach((v) => io.observe(v.canvas));

  if (reduced) { // motion-free: show each finished figure
    // ?still&vp=0.5&vt=3 freezes the loop at a chosen build amount and time, for checking frames
    const qs = new URLSearchParams(location.search), vp = Number(qs.get('vp') ?? 1), vt = Number(qs.get('vt') ?? 0);
    const still = () => all.forEach((v) => draw(v, vp, vt));
    still();
    addEventListener('resize', still);
    document.addEventListener('click', () => requestAnimationFrame(still));
    return;
  }
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    all.forEach((v) => {
      if (!v.item.classList.contains('is-open')) { v.clock = 0; return; }
      if (!v.seen) return;
      v.clock += dt;
      const c = v.clock % CYCLE;
      const p = c < BUILD ? c / BUILD : c < BUILD + HOLD ? 1 : 1 - (c - BUILD - HOLD) / FADE;
      draw(v, p, v.clock);
    });
    requestAnimationFrame(loop);
  })(last);
}
