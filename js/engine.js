/* Ceya engine: colour, noise, patterns and icons, shared by the brand book and the toolkit. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RING = [
    { name: "Sun", hex: "#F7B32B" }, { name: "Ember", hex: "#FA9C3D" }, { name: "Coral", hex: "#FC864F" },
    { name: "Rose", hex: "#FF6F61" }, { name: "Clay", hex: "#D7927B" }, { name: "Sage", hex: "#B0B596" },
    { name: "Mint", hex: "#88D8B0" },
  ];
  // The master symbol has two Sun rings, then one ring for each colour.
  const SPECTRUM = ["#F7B32B", "#F7B32B", "#FA9C3D", "#FC864F", "#FF6F61", "#D7927B", "#B0B596", "#88D8B0"];

  const CORE = [
    { name: "Ink", hex: "#102528", share: 40, fg: "#FFFFFF" },
    { name: "Deep Teal", hex: "#22535A", share: 28, fg: "#FFFFFF" },
    { name: "Mist", hex: "#E9F0EE", share: 20, fg: "#102528" },
    { name: "Ceya Teal", hex: "#2F6B72", share: 8, fg: "#FFFFFF" },
    { name: "White", hex: "#FFFFFF", share: 4, fg: "#102528" },
  ];

  const MOODS = [
    { name: "Night shoot", use: "Documentary, drama and late edits.", bg: "#102528", fg: "#FFFFFF", stops: ["#2F6B72", "#B0B596", "#88D8B0"], pattern: { type: "terrain", n: 13, v: 0.6, w: 2, seed: 31 } },
    { name: "Golden hour", use: "Travel, weddings and warm brand stories.", bg: "#22535A", fg: "#FFFFFF", stops: ["#F7B32B", "#FA9C3D", "#FC864F"], pattern: { type: "ridge", n: 16, v: 0.65, seed: 8, bg: "#22535A" } },
    { name: "Daylight", use: "Corporate, education and clean product work.", bg: "#E9F0EE", fg: "#102528", stops: ["#2F6B72", "#FF6F61", "#F7B32B"], pattern: { type: "rings", n: 10, v: 0.7, w: 4 } },
    { name: "Full spectrum", use: "Launches, show reels and celebrations.", bg: "#102528", fg: "#FFFFFF", stops: SPECTRUM, pattern: { type: "wave", n: 60, v: 0.8, seed: 12 } },
  ];

  const PAIRS = [
    { fg: "#FFFFFF", bg: "#102528", use: "White on Ink" },
    { fg: "#FFFFFF", bg: "#22535A", use: "White on Deep Teal" },
    { fg: "#2F6B72", bg: "#E9F0EE", use: "Ceya Teal on Mist" },
    { fg: "#88D8B0", bg: "#22535A", use: "Mint on Deep Teal" },
    { fg: "#102528", bg: "#F7B32B", use: "Ink on Sun, for buttons" },
    { fg: "#F7B32B", bg: "#E9F0EE", use: "Sun on Mist", bd: "#C6D6D2" },
  ];

  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  function cmykOf(hex) {
    const [r, g, b] = rgbOf(hex).map(v => v / 255);
    const k = 1 - Math.max(r, g, b);
    if (k >= 1) return "0 0 0 100";
    return [r, g, b].map(v => Math.round(((1 - v - k) / (1 - k)) * 100)).concat(Math.round(k * 100)).join(" ");
  }
  const lum = hex => rgbOf(hex).map(v => v / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

  const stopCache = new Map();
  function colourAt(t, stops = SPECTRUM) {
    let s = stopCache.get(stops);
    if (!s) { s = stops.map(rgbOf); stopCache.set(stops, s); }
    if (s.length === 1) return stops[0];
    const p = Math.min(Math.max(t, 0), 1) * (s.length - 1);
    const i = Math.min(Math.floor(p), s.length - 2), f = p - i;
    return "rgb(" + s[i].map((v, k) => Math.round(v + (s[i + 1][k] - v) * f)).join(",") + ")";
  }
  // t runs from 0 (outer, Sun) to 1 (core, Mint).
  function colourFor(o, t) {
    switch (o.mode) {
      case "warm": return colourAt(t * 0.55);
      case "mint": return o.bg === "#E9F0EE" ? "rgba(47,107,114,.45)" : "rgba(136,216,176,.42)";
      case "paper": return o.bg === "#E9F0EE" ? "rgba(16,37,40,.28)" : "rgba(255,255,255,.22)";
      case "mono": return o.color;
      default: return colourAt(t, o.stops || SPECTRUM);
    }
  }

  /* =========================================================
     Noise
     ========================================================= */
  function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const permCache = new Map();
  function perm(seed) {
    if (permCache.has(seed)) return permCache.get(seed);
    const r = mulberry(seed * 9973 + 17), p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const P = new Uint8Array(512); for (let i = 0; i < 512; i++) P[i] = p[i & 255];
    permCache.set(seed, P); return P;
  }
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y, z) { const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); }
  function noise3(P, x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
    return lerp(lerp(lerp(grad(P[AA] & 15, x, y, z), grad(P[BA] & 15, x - 1, y, z), u), lerp(grad(P[AB] & 15, x, y - 1, z), grad(P[BB] & 15, x - 1, y - 1, z), u), v),
      lerp(lerp(grad(P[AA + 1] & 15, x, y, z - 1), grad(P[BA + 1] & 15, x - 1, y, z - 1), u), lerp(grad(P[AB + 1] & 15, x, y - 1, z - 1), grad(P[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
  }
  const fbm = (P, x, y, z) => noise3(P, x, y, z) + 0.5 * noise3(P, x * 2.03, y * 2.03, z * 1.7) + 0.25 * noise3(P, x * 4.1, y * 4.1, z * 2.3);

  /* =========================================================
     Patterns. Each returns SVG markup for a 0 0 1000 1000 box.
     ========================================================= */
  const W3 = (2 * Math.PI) / 3;
  const triR = th => { const p = (((th % W3) + W3) % W3) - Math.PI / 3; return 0.5 / Math.cos(p); };
  const softTri = th => { let s = 0; const K = 11, D = 0.42; for (let j = 0; j < K; j++) s += triR(th + D * (j / (K - 1) - 0.5)); return s / K; };
  const TRI0 = softTri(0);
  function ringPath(c, R, a, gap) {
    const N = 160, s = gap, e = 2 * Math.PI - gap;
    let d = "";
    for (let k = 0; k <= N; k++) {
      const th = s + ((e - s) * k) / N, r = R * (1 - a + (a * softTri(th)) / TRI0);
      d += (k ? "L" : "M") + (c + r * Math.cos(th)).toFixed(1) + " " + (c + r * Math.sin(th)).toFixed(1);
    }
    return gap ? d : d + "Z";
  }

  function rings(o) {
    const n = o.n ?? 8, a = o.v ?? 1, open = o.open ?? 1, rot = o.rot || 0, scale = o.scale ?? 1;
    let out = "";
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      if (o.mode === "warm" && t > 0.6) continue;
      const R = 500 * 0.96 * (1 - t * 0.8) * scale;
      const gap = i < 2 ? 0.3 * open : 0;
      const spin = rot ? ` transform="rotate(${(rot * (i % 2 ? -1 : 1) * (1 + i * 0.35)).toFixed(2)} 500 500)"` : "";
      out += `<path d="${ringPath(500, R, a * 0.95 * Math.pow(t, 1.6), gap)}" stroke="${colourFor(o, t)}" stroke-width="${o.w ?? (7 - 3 * t).toFixed(2)}"${spin}/>`;
    }
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${out}</g>`;
  }

  function terrain(o) {
    const P = perm(o.seed ?? 1), G = o.grid ?? 96, n = o.n ?? 12, v = o.v ?? 0.5, z = o.z ?? 0;
    const step = 1000 / G, F = new Float32Array((G + 1) * (G + 1));
    let lo = Infinity, hi = -Infinity;
    const px = o.peakX ?? 0.46, py = o.peakY ?? 0.52;
    for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) {
      const x = i / G, y = j / G, th = Math.atan2(y - py, x - px), d = Math.hypot(x - px, y - py) / (0.55 + 0.45 * softTri(th) / TRI0) * 0.82;
      const f = (1 - d / 0.8) * (1 - v * 0.3) + v * 0.42 * fbm(P, x * 2.2, y * 2.2, z);
      F[j * (G + 1) + i] = f; if (f < lo) lo = f; if (f > hi) hi = f;
    }
    let out = "";
    for (let k = 0; k < n; k++) {
      const L = lo + ((k + 1) / (n + 1)) * (hi - lo);
      let d = "";
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const a = F[j * (G + 1) + i], b = F[j * (G + 1) + i + 1], c = F[(j + 1) * (G + 1) + i + 1], e = F[(j + 1) * (G + 1) + i];
        const idx = (a >= L ? 8 : 0) | (b >= L ? 4 : 0) | (c >= L ? 2 : 0) | (e >= L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * step, y0 = j * step;
        const T = () => [x0 + step * ((L - a) / (b - a)), y0];
        const R = () => [x0 + step, y0 + step * ((L - b) / (c - b))];
        const B = () => [x0 + step * ((L - e) / (c - e)), y0 + step];
        const Lf = () => [x0, y0 + step * ((L - a) / (e - a))];
        const seg = (p, q) => { d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`; };
        switch (idx) {
          case 1: case 14: seg(Lf(), B()); break;
          case 2: case 13: seg(B(), R()); break;
          case 3: case 12: seg(Lf(), R()); break;
          case 4: case 11: seg(T(), R()); break;
          case 5: seg(T(), Lf()); seg(B(), R()); break;
          case 10: seg(T(), R()); seg(Lf(), B()); break;
          case 6: case 9: seg(T(), B()); break;
          case 7: case 8: seg(T(), Lf()); break;
        }
      }
      out += `<path d="${d}" stroke="${colourFor(o, n === 1 ? 0 : k / (n - 1))}" stroke-width="${o.w ?? 2}"/>`;
    }
    return `<g fill="none" stroke-linecap="round">${out}</g>`;
  }

  function ridge(o) {
    const P = perm(o.seed ?? 1), n = o.n ?? 18, v = o.v ?? 0.6, ph = o.phase ?? 0, bg = o.bg ?? "#102528";
    const top = 200, span = 720, gap = span / n;
    let out = "";
    for (let i = 0; i < n; i++) {
      const y0 = top + i * gap, t = n === 1 ? 0 : i / (n - 1);
      const cx = 500 + 160 * Math.sin(i * 0.55 + (o.seed ?? 1)), wid = 170 + 70 * noise3(P, i * 0.3, 0.5, 0.2);
      let d = "";
      for (let x = -20; x <= 1020; x += 10) {
        const bump = Math.exp(-(((x - cx) / wid) ** 2));
        const h = v * 300 * (bump * (0.55 + 0.9 * Math.abs(noise3(P, x * 0.006, i * 0.22, ph)))) + v * 40 * noise3(P, x * 0.02, i * 0.5, ph * 1.3);
        d += (x === -20 ? "M" : "L") + x + " " + (y0 - Math.max(0, h)).toFixed(1);
      }
      out += `<path d="${d}L1020 ${y0 + 400}L-20 ${y0 + 400}Z" fill="${bg}" stroke="none"/><path d="${d}" fill="none" stroke="${colourFor(o, t)}" stroke-width="${o.w ?? 2.6}" stroke-linejoin="round"/>`;
    }
    return out;
  }

  function wave(o) {
    const P = perm(o.seed ?? 1), n = o.n ?? 64, v = o.v ?? 0.7, ph = o.phase ?? 0;
    const x0 = 60, span = 880, sw = Math.max(3, Math.min(16, (span / Math.max(n - 1, 1)) * 0.55));
    let out = "";
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), x = x0 + u * span;
      const env = Math.pow(Math.sin(Math.PI * u), 0.8);
      const amp = v * 380 * env * (0.3 + 0.7 * Math.abs(noise3(P, u * 7, ph, 0.4) + 0.5 * noise3(P, u * 19, ph * 1.7, 2.1))) + sw * 0.6;
      const col = o.played != null ? (u <= o.played ? colourAt(u) : "rgba(255,255,255,.2)") : colourFor(o, u);
      out += `<path d="M${x.toFixed(1)} ${(500 - amp).toFixed(1)}V${(500 + amp).toFixed(1)}" stroke="${col}"/>`;
    }
    return `<g fill="none" stroke-width="${sw.toFixed(2)}" stroke-linecap="round">${out}</g>`;
  }

  function halftone(o) {
    const n = o.n ?? 30, v = o.v ?? 0.5, ph = o.phase ?? 0, s = 1000 / n;
    let out = "";
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * s, y = (j + 0.5) * s, d = Math.hypot(x - 500, y - 500) / 707 / (0.55 + 0.45 * softTri(Math.atan2(y - 500, x - 500)) / TRI0) * 0.8;
      const r = s * 0.5 * (0.5 + 0.5 * Math.cos((d * (5 + v * 18) - ph) * Math.PI)) * Math.max(0, 1 - d * 0.75);
      if (r < 0.7) continue;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${colourFor(o, 1 - Math.min(d / 0.7, 1))}"/>`;
    }
    return out;
  }


  // Radial wave: the exact eight rings, with sound echoes radiating off each one.
  function ringPoints(c, R, a, gap, N = 220) {
    const pts = [], s = gap, e = 2 * Math.PI - gap, count = gap ? N + 1 : N;
    for (let k = 0; k < count; k++) { const th = s + ((e - s) * k) / N, r = R * (1 - a + (a * softTri(th)) / TRI0); pts.push([c + r * Math.cos(th), c + r * Math.sin(th), th]); }
    return pts;
  }
  function radial(o) {
    const echoes = Math.max(1, Math.round((o.n ?? 90) / 30)), v = o.v ?? 0.6, ph = o.phase ?? 0;
    let out = "", logo = "";
    for (let i = 0; i < 8; i++) {
      const t = i / 7, R = 480 * (1 - t * 0.8), a = 0.95 * Math.pow(t, 1.6), gap = i < 2 ? 0.3 : 0;
      const pts = ringPoints(500, R, a, gap), n = pts.length, closed = gap === 0;
      logo += `<path d="${ringPath(500, R, a, gap)}" stroke="${colourFor(o, t)}" stroke-width="${(7 - 3 * t).toFixed(2)}"/>`;
      for (let e = 1; e <= echoes; e++) {
        let d = "";
        for (let k = 0; k < n; k++) {
          const p = closed ? pts[(k - 1 + n) % n] : pts[Math.max(k - 1, 0)], q = closed ? pts[(k + 1) % n] : pts[Math.min(k + 1, n - 1)];
          const tx = q[0] - p[0], ty = q[1] - p[1], L = Math.hypot(tx, ty) || 1, nx = ty / L, ny = -tx / L;
          const off = e * 9 + v * 14 * Math.sin(pts[k][2] * (6 + i) + ph * 2 + e * 1.3 + i);
          d += (k ? "L" : "M") + (pts[k][0] + nx * off).toFixed(1) + " " + (pts[k][1] + ny * off).toFixed(1);
        }
        out += `<path d="${closed ? d + "Z" : d}" stroke="${colourFor(o, t)}" stroke-width="1.4" opacity="${(0.75 / e).toFixed(2)}"/>`;
      }
    }
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${out}${logo}</g>`;
  }


  // Logo-built patterns. Every motif is the real symbol, or a part of it.
  const place = (x, y, k, r, inner) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r}) scale(${k.toFixed(4)}) translate(-500 -500)">${inner}</g>`;
  function tile(o) {
    const n = Math.max(2, Math.round(o.n ?? 4)), P = perm(o.seed ?? 1), cell = 1000 / n, k = (cell / 1000) * 0.86;
    const mark = rings({ n: 8, v: 1, mode: o.mode, bg: o.bg, stops: o.stops, color: o.color, w: o.w ?? 9 });
    let out = "";
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const r = (o.v ?? 0.5) > 0.4 ? [0, 90, 180, 270][Math.floor((noise3(P, i * 0.7, j * 0.7, 0.3) + 1) * 2) & 3] : 0;
      out += place((i + 0.5) * cell, (j + 0.5) * cell, k, r, mark);
    }
    return out;
  }
  function play(o) {
    const n = Math.max(3, Math.round(o.n ?? 8)), P = perm(o.seed ?? 1), cell = 1000 / n, v = o.v ?? 0.5;
    const core = ringPath(500, 360, 0.95, 0);
    let out = "";
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const f = noise3(P, i * 0.35, j * 0.35, 0.7), r = Math.round(f * 180 * v), t = Math.min(1, Math.max(0, (i + j) / (2 * n - 2)));
      const filled = (i + j) % 3 === 0;
      out += place((i + 0.5) * cell, (j + 0.5) * cell, (cell / 1000) * 0.74, r, `<path d="${core}" ${filled ? `fill="${colourFor(o, t)}"` : `fill="none" stroke="${colourFor(o, t)}" stroke-width="${(o.w ?? 34)}"`}/>`);
    }
    return `<g stroke-linejoin="round">${out}</g>`;
  }
  function arcs(o) {
    const n = Math.max(2, Math.round(o.n ?? 5)), cell = 1000 / n;
    let out = "";
    for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) {
      const x = (i + 0.5 + (j % 2 ? 0.5 : 0)) * cell, y = (j + 0.5) * cell * 0.8;
      const inner = [0, 1].map(q => `<path d="${ringPath(500, 470 - q * 64, 0, 0.3)}" fill="none" stroke="${colourFor(o, q * 0.18)}" stroke-width="${o.w ?? 26}" stroke-linecap="round"/>`).join("");
      out += place(x, y, cell / 1000 * 0.98, 0, inner);
    }
    return out;
  }

  const PATTERNS = { rings, terrain, ridge, wave, halftone, radial, tile, play, arcs };
  const draw = (svg, o) => { svg.innerHTML = PATTERNS[o.type || "rings"](o); };

  /* =========================================================
     Icons: 24 px grid, 1.6 px round strokes, one accent part.
     ========================================================= */
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const rr = (x, y, w, h, r = 1.5) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
  const ICONS = {
    play: { label: "Play", main: "M20.6 9.2A9 9 0 1 0 20.6 14.8", accent: "M10 8.7v6.6c0 .5.5.8.9.5l5.4-3.3c.4-.2.4-.8 0-1L10.9 8.2c-.4-.3-.9 0-.9.5z" },
    camera: { label: "Camera", main: rr(3, 10, 13, 9.5, 2) + "M16 13.6l4.2-2.3c.4-.2.8.1.8.5v5.9c0 .4-.4.7-.8.5L16 15.9" + circ(12.6, 6.1, 2.6), accent: circ(6.6, 6.1, 2.6) },
    clapper: { label: "Clapper", main: rr(4, 9.5, 16, 10.5, 1.5) + "M4 13h16M3.4 6.6L18.4 3.4l.6 2.7L4 9.3z", accent: "M8.2 5.7l1.3 2.6M12.8 4.7l1.3 2.6" },
    mic: { label: "Microphone", main: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM12 17.5V21M9 21h6", accent: "M6 11a6 6 0 0 0 12 0" },
    sound: { label: "Sound", main: "M3.5 10.5v3M7 8v8M14 7v10M17.5 9.5v5M21 11v2", accent: "M10.5 4v16" },
    cut: { label: "Cut", main: "M8.1 15.6L18.5 4M15.9 15.6L5.5 4" + circ(6.5, 17.6, 2.5), accent: circ(17.5, 17.6, 2.5) },
    frame: { label: "Frame", main: "M7 3.5V17h13.5M3.5 7H17v13.5", accent: "M10.4 10.3v3.4c0 .4.4.6.7.4l2.9-1.7c.3-.2.3-.6 0-.8l-2.9-1.7c-.3-.2-.7 0-.7.4z" },
    layers: { label: "Layers", main: "M12 3.5l8.5 4.3L12 12 3.5 7.8zM3.5 12.2l8.5 4.3 8.5-4.3", accent: "M3.5 16.4l8.5 4.3 8.5-4.3" },
    storyboard: { label: "Storyboard", main: rr(3, 4.5, 8, 6.5) + rr(13, 4.5, 8, 6.5) + rr(3, 13, 8, 6.5), accent: rr(13, 13, 8, 6.5) },
    light: { label: "Light", main: "M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4", accent: circ(12, 12, 4.2) },
    headphones: { label: "Headphones", main: "M4 15.5V12a8 8 0 0 1 16 0v3.5" + rr(3.5, 14, 4.5, 6.5), accent: rr(16, 14, 4.5, 6.5) },
    timeline: { label: "Timeline", main: "M3 7h7M13.5 7H21M3 12h7M13.5 12H21M3 17h7M13.5 17H21", accent: "M11.8 3.5v17" },
    pin: { label: "Location", main: "M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z", accent: circ(12, 10, 2.4) },
    calendar: { label: "Shoot date", main: rr(3.5, 5, 17, 15.5, 2) + "M3.5 9.5h17M8 3v4M16 3v4", accent: circ(15.5, 15, 1.5) },
    mail: { label: "Mail", main: rr(3, 5.5, 18, 13, 2), accent: "M4 7.5l8 5.8 8-5.8" },
    download: { label: "Download", main: "M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5", accent: "M5 19.5h14" },
    pause: { label: "Pause", main: "M8.5 5.5v13M15.5 5.5v13", accent: "" },
    shuffle: { label: "Shuffle", main: "M3.5 7.5h3.2c2 0 3.2 1 4.3 2.8l2 3.4c1.1 1.8 2.3 2.8 4.3 2.8h3.2M18 14l2.5 2.5L18 19M3.5 16.5h3.2c1.5 0 2.6-.6 3.5-1.6M14 8.9c.9-1 2-1.4 3.3-1.4h3.2M18 5l2.5 2.5L18 10", accent: "" },
  };
  const GRID_ICONS = Object.keys(ICONS).filter(k => k !== "shuffle" && k !== "pause");
  function iconMarkup(name, { style = "duo", accent = "#F7B32B" } = {}) {
    const ic = ICONS[name];
    const acc = style === "duo" ? accent : "currentColor";
    return `<path d="${ic.main}" stroke="currentColor"/>` + (ic.accent ? `<path d="${ic.accent}" stroke="${acc}"/>` : "");
  }
  function iconSVG(name, opts) {
    return `<svg xmlns="${NS}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(name, opts)}</svg>`;
  }
  function paintIcons(root = document) {
    $$("svg[data-icon]", root).forEach(s => {
      s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke-width", "1.6");
      s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
      s.innerHTML = iconMarkup(s.dataset.icon, { accent: s.dataset.accent || "#F7B32B", style: s.dataset.style || "duo" });
    });
  }
  paintIcons();


  window.CeyaEngine = { NS, RING, SPECTRUM, CORE, colourAt, colourFor, rgbOf, cmykOf, contrast, perm, noise3, fbm, ringPath, rings, terrain, ridge, wave, halftone, radial, tile, play, arcs, draw, ICONS, iconMarkup, paintIcons };
})();
