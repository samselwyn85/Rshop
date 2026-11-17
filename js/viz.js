// Service animations: each service gets a small 3D figure made of data points.
// Drawn on a plain 2D canvas with its own perspective projection, so ten of them
// cost almost nothing and need no extra WebGL contexts.

const TEAL = '#00A79D', MINT = '#38C695', CORAL = '#FC5F45', CHAR = '#404248', GREY = '#B9BDC6', SOFT = '#8E939B', AQUA = '#5CC9C2';
const rnd = Math.random;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.87; // roughly normal, sd ≈ 0.5
const P = (x, y, z, c) => ({ x, y, z, c });
const L = (a, b, c = CORAL, w = 1.5) => ({ a, b, c, w });

/* ── the ten figures. Coordinates: x −1.6…1.6, y −1…1, z toward the viewer. ── */
const figures = {
  // Qualitative analysis: loose observations gather into themes
  clusters() {
    const pts = [], centres = [[-1.1, 0.35, 0.2, TEAL], [-0.35, -0.45, -0.3, MINT], [0.35, 0.42, -0.2, CORAL], [1.05, -0.3, 0.3, CHAR], [0, 0, 0.5, AQUA]];
    centres.forEach(([x, y, z, c]) => { for (let i = 0; i < 72; i++) pts.push(P(x + gauss() * 0.36, y + gauss() * 0.3, z + gauss() * 0.3, c)); });
    for (let i = 0; i < 40; i++) pts.push(P((rnd() - 0.5) * 3.1, (rnd() - 0.5) * 1.8, (rnd() - 0.5), GREY));
    return { pts, lines: [], tilt: 0.12 };
  },
  // Quantitative analysis: counted, modelled, with a fitted line
  bars() {
    const pts = [], h = [0.3, 0.45, 0.4, 0.62, 0.8, 1];
    h.forEach((v, b) => { const n = Math.round(22 + v * 70); for (let i = 0; i < n; i++) pts.push(P((b - 2.5) * 0.44 + (rnd() - 0.5) * 0.26, -0.9 + rnd() * v * 1.7, (rnd() - 0.5) * 0.26, b % 2 ? MINT : TEAL)); });
    return { pts, lines: [L([-1.45, -0.9, 0], [1.45, -0.9, 0], CHAR, 1), L([-1.45, -0.9, 0], [-1.45, 0.95, 0], CHAR, 1), L([-1.3, -0.5, 0.2], [1.3, 0.86, 0.2], CORAL, 2.5)], tilt: 0.14 };
  },
  // User needs assessments: the gap between current and desired conditions
  layers() {
    const pts = [], lines = [];
    for (let i = 0; i < 17; i++) for (let j = 0; j < 9; j++) {
      const x = -1.3 + (i / 16) * 2.6, z = -0.7 + (j / 8) * 1.4;
      const up = 0.42 + 0.14 * Math.sin(x * 2.2) * Math.cos(z * 3);
      pts.push(P(x, -0.55, z, GREY), P(x, up, z, TEAL));
      if (i % 4 === 2 && j % 4 === 2) lines.push(L([x, -0.55, z], [x, up, z], CORAL, 1.5));
    }
    return { pts, lines, tilt: 0.5 };
  },
  // Questionnaire development: questions composed, tested, ticked off
  form() {
    const pts = [], len = [1.9, 1.3, 1.7, 1.0, 1.5], ticked = [1, 1, 0, 1, 0];
    len.forEach((w, r) => {
      const y = 0.76 - r * 0.38;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
        const edge = i === 0 || j === 0 || i === 4 || j === 4;
        if (ticked[r] || edge) pts.push(P(-1.35 + i * 0.05, y - 0.1 + j * 0.05, 0.1, ticked[r] ? TEAL : SOFT));
      }
      const n = Math.round(w * 24);
      for (let i = 0; i < n; i++) pts.push(P(-0.95 + (i / n) * w, y + (i % 2 ? 0.035 : -0.035), 0, SOFT));
    });
    return { pts, lines: [], tilt: 0.08, yaw: -0.18 };
  },
  // Data collection: many sources funnelled into one ordered set
  funnel() {
    const pts = [];
    for (let i = 0; i < 230; i++) {
      const y = rnd() * 0.95, r = 0.1 + 1.35 * (y / 0.95) * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;
      pts.push(P(r * Math.cos(a), y + 0.02, r * Math.sin(a) * 0.7, y > 0.45 ? GREY : MINT));
    }
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 2; k++) pts.push(P(-0.55 + i * 0.1, -0.95 + j * 0.13, -0.08 + k * 0.16, TEAL));
    return { pts, lines: [], tilt: 0.3 };
  },
  // Report-writing: findings compiled into pages
  pages() {
    const pts = [], lines = [];
    [[-0.3, 0.14, -0.4, GREY, GREY], [0, 0, 0, GREY, SOFT], [0.3, -0.14, 0.4, CHAR, TEAL]].forEach(([ox, oy, z, frame, ink], pg) => {
      const w = 0.62, h = 0.85, c = [[ox - w, oy - h, z], [ox + w, oy - h, z], [ox + w, oy + h, z], [ox - w, oy + h, z]];
      c.forEach((a, i) => lines.push(L(a, c[(i + 1) % 4], frame, pg === 2 ? 1.6 : 1)));
      const rows = pg === 2 ? [1, 0.7, 0.95, 0.85, 0.5] : [1, 0.8, 0.9, 0.6, 0.95, 0.7, 0.85];
      rows.forEach((f, r) => { const n = Math.round(f * 22); for (let i = 0; i < n; i++) pts.push(P(ox - w + 0.12 + (i / 22) * (2 * w - 0.24), oy + h - 0.18 - r * 0.2, z, ink)); });
      if (pg === 2) [0.22, 0.34, 0.48].forEach((bh, b) => { for (let i = 0; i < 16; i++) pts.push(P(ox - 0.3 + b * 0.3 + (rnd() - 0.5) * 0.16, oy - h + 0.1 + rnd() * bh, z, CORAL)); });
    });
    return { pts, lines, tilt: 0.12, yaw: -0.4 };
  },
  // Focus group work: a small, diverse group in conversation
  ring() {
    const pts = [], lines = [], heads = [], cols = [TEAL, CORAL, MINT, CHAR, AQUA, TEAL, CORAL, MINT];
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2, x = Math.cos(a) * 1.15, z = Math.sin(a) * 0.9;
      heads.push([x, 0.26, z]);
      for (let i = 0; i < 14; i++) pts.push(P(x + gauss() * 0.11, 0.26 + gauss() * 0.11, z + gauss() * 0.11, cols[p]));
      for (let i = 0; i < 26; i++) pts.push(P(x + gauss() * 0.2, -0.16 + gauss() * 0.24, z + gauss() * 0.2, cols[p]));
    }
    [[0, 3], [3, 6], [6, 1], [1, 4], [4, 7], [7, 2], [2, 5], [5, 0]].forEach(([a, b]) => lines.push(L(heads[a], heads[b], CORAL, 1)));
    return { pts, lines, tilt: 0.5 };
  },
  // Cultural competency: two groups meeting and sharing ground
  meet() {
    const pts = [];
    [[-0.5, TEAL, -0.14], [0.5, CORAL, 0.14]].forEach(([cx, c, z]) => {
      for (let i = 0; i < 210; i++) { const r = 0.88 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2; pts.push(P(cx + r * Math.cos(a), r * Math.sin(a), z + gauss() * 0.08, c)); }
    });
    return { pts, lines: [], tilt: 0.14 };
  },
  // Insights analysis: the part of your existing data that matters, picked out
  insight() {
    const pts = [], lines = [], cx = 0.55, cy = 0.12;
    for (let i = 0; i < 300; i++) pts.push(P((rnd() - 0.5) * 3, (rnd() - 0.5) * 1.75, (rnd() - 0.5) * 0.8, GREY));
    for (let i = 0; i < 95; i++) pts.push(P(cx + gauss() * 0.34, cy + gauss() * 0.3, gauss() * 0.3, i % 6 ? TEAL : MINT));
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, b = ((i + 1) / 36) * Math.PI * 2; lines.push(L([cx + Math.cos(a) * 0.56, cy + Math.sin(a) * 0.56, 0], [cx + Math.cos(b) * 0.56, cy + Math.sin(b) * 0.56, 0], CORAL, 1.6)); }
    return { pts, lines, tilt: 0.1 };
  },
  // Political polling: seats filled by share
  hemi() {
    const pts = [];
    [0.55, 0.8, 1.05, 1.3].forEach((r) => {
      const n = Math.round(r * 22);
      for (let s = 0; s < n; s++) {
        const f = s / (n - 1), a = Math.PI * (1 - f);
        const c = f < 0.42 ? TEAL : f < 0.72 ? CORAL : f < 0.9 ? MINT : GREY;
        for (let i = 0; i < 4; i++) pts.push(P(r * Math.cos(a) * 1.15 + gauss() * 0.035, r * Math.sin(a) * 1.15 - 0.75 + gauss() * 0.035, (0.9 - r) * 0.6, c));
      }
    });
    return { pts, lines: [L([-1.55, -0.78, 0.2], [1.55, -0.78, 0.2], CHAR, 1)], tilt: 0.22 };
  },
};

export function initViz({ reduced, finePointer }) {
  const all = [...document.querySelectorAll('canvas[data-viz]')].map((canvas) => {
    const fig = figures[canvas.dataset.viz]();
    fig.pts.forEach((p) => { p.sx = (rnd() - 0.5) * 3.6; p.sy = (rnd() - 0.5) * 2.2; p.sz = (rnd() - 0.5) * 1.6; p.d = rnd() * 0.45; p.r = 0.75 + rnd() * 0.6; });
    return { canvas, ctx: canvas.getContext('2d'), fig, item: canvas.closest('.svc__item'), p: 0, seen: false, w: 0, h: 0, order: fig.pts.map((_, i) => i) };
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

  function draw(v, t) {
    if (!size(v)) return;
    const { ctx, fig, w, h } = v;
    const yaw = (fig.yaw || 0) + (reduced ? 0.25 : Math.sin(t * 0.5) * 0.32) + mx * 0.5, tilt = fig.tilt;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const scale = Math.min(w / 4.1, h / 2.6), D = 4.2;
    const proj = (x, y, z) => {
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const f = D / (D - z2);
      return [w / 2 + x1 * scale * f, h / 2 - y2 * scale * f, z2, f];
    };
    ctx.clearRect(0, 0, w, h);

    const lineA = Math.min(1, Math.max(0, (v.p - 0.75) / 0.25));
    if (lineA > 0) {
      ctx.lineCap = 'round';
      fig.lines.forEach((l) => {
        const a = proj(...l.a), b = proj(...l.b);
        ctx.globalAlpha = lineA * 0.9; ctx.strokeStyle = l.c; ctx.lineWidth = l.w;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * lineA, a[1] + (b[1] - a[1]) * lineA); ctx.stroke();
      });
    }

    const pts = fig.pts, scr = v.scr || (v.scr = new Float32Array(pts.length * 4));
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      let e = Math.min(1, Math.max(0, (v.p - q.d) / 0.55));
      e = e * e * (3 - 2 * e);
      const s = proj(q.sx + (q.x - q.sx) * e, q.sy + (q.y - q.sy) * e, q.sz + (q.z - q.sz) * e);
      scr[i * 4] = s[0]; scr[i * 4 + 1] = s[1]; scr[i * 4 + 2] = s[2]; scr[i * 4 + 3] = e;
    }
    v.order.sort((a, b) => scr[a * 4 + 2] - scr[b * 4 + 2]);
    const base = Math.max(1.5, scale * 0.022);
    for (const i of v.order) {
      const q = pts[i], z = scr[i * 4 + 2], e = scr[i * 4 + 3];
      ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, Math.max(0, (z + 1.2) / 2));
      ctx.fillStyle = e > 0.4 ? q.c : GREY;
      ctx.beginPath(); ctx.arc(scr[i * 4], scr[i * 4 + 1], base * q.r * (D / (D - z)), 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const io = new IntersectionObserver((entries) => entries.forEach((en) => { all.find((v) => v.canvas === en.target).seen = en.isIntersecting; }), { threshold: 0.2 });
  all.forEach((v) => io.observe(v.canvas));

  if (reduced) {
    const still = () => all.forEach((v) => { v.p = 1; draw(v, 0); });
    still();
    addEventListener('resize', still);
    document.addEventListener('click', () => requestAnimationFrame(still));
    return;
  }
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    all.forEach((v) => {
      const open = v.item.classList.contains('is-open');
      if (!open) { v.p = 0; return; }
      if (!v.seen) return;
      v.p = Math.min(1, v.p + dt / 1.7);
      draw(v, now / 1000);
    });
    requestAnimationFrame(loop);
  })(last);
}
