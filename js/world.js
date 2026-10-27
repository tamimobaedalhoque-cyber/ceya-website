/* Ceya website, the world.
   The eight rings of the real Ceya mark stand in a line like gates. Scrolling flies the camera
   through them, one ring per scene. In the last stretch they slide together and resolve into
   the logo itself. Exposes window.World for the scroll script. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.getElementById("world");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SPECTRUM = ["#F7B32B", "#F7B32B", "#FA9C3D", "#FC864F", "#FF6F61", "#D7927B", "#B0B596", "#88D8B0"];

/* ---------- Ring geometry, from the master construction ---------- */
const W3 = (2 * Math.PI) / 3;
const triR = th => { const p = (((th % W3) + W3) % W3) - Math.PI / 3; return 0.5 / Math.cos(p); };
const softTri = th => { let s = 0; const K = 11, D = 0.42; for (let j = 0; j < K; j++) s += triR(th + D * (j / (K - 1) - 0.5)); return s / K; };
const TRI0 = softTri(0);
function ringLine(R, a, gap, N = 280) {
  const pts = [], count = gap ? N + 1 : N;
  for (let k = 0; k < count; k++) { const th = gap + ((2 * Math.PI - 2 * gap) * k) / N, r = R * (1 - a + (a * softTri(th)) / TRI0); pts.push([r * Math.cos(th), r * Math.sin(th)]); }
  return pts;
}
const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; } return s / 2; };
function strokeShape(line, hw, closed) {
  const n = line.length, N = [];
  for (let k = 0; k < n; k++) {
    const p = closed ? line[(k - 1 + n) % n] : line[Math.max(k - 1, 0)], q = closed ? line[(k + 1) % n] : line[Math.min(k + 1, n - 1)];
    const tx = q[0] - p[0], ty = q[1] - p[1], L = Math.hypot(tx, ty) || 1; N.push([-ty / L, tx / L]);
  }
  const off = s => line.map((p, k) => new THREE.Vector2(p[0] + N[k][0] * hw * s, p[1] + N[k][1] * hw * s));
  let A = off(1), H = off(-1);
  if (closed) {
    if (Math.abs(area(A)) < Math.abs(area(H))) [A, H] = [H, A];
    if (area(A) < 0) A.reverse(); if (area(H) > 0) H.reverse();
    const s = new THREE.Shape(A); s.holes.push(new THREE.Path(H)); return s;
  }
  const cap = (c, nrm, start) => { const out = [], base = Math.atan2(nrm[1], nrm[0]) + (start ? Math.PI : 0); for (let j = 1; j < 12; j++) { const a = base - (Math.PI * j) / 12; out.push(new THREE.Vector2(c[0] + Math.cos(a) * hw, c[1] + Math.sin(a) * hw)); } return out; };
  let pts = [...A, ...cap(line[n - 1], N[n - 1], false), ...H.reverse(), ...cap(line[0], N[0], true)];
  if (area(pts) < 0) pts.reverse();
  return new THREE.Shape(pts);
}
function bandGeo(line, closed, hw, depth, bevel) {
  const g = new THREE.ExtrudeGeometry(strokeShape(line, Math.max(0.004, hw - bevel), closed), { depth, steps: 1, curveSegments: 4, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 5 });
  g.translate(0, 0, -depth / 2); return g;
}

/* ---------- Renderer and scene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const BG = new THREE.Color("#07161A");
scene.background = BG;
scene.fog = new THREE.FogExp2(0x07161a, 0.035);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(4, 6, 8); scene.add(key);
const warm = new THREE.PointLight(0xfc864f, 30, 40); scene.add(warm);
const cool = new THREE.PointLight(0x88d8b0, 26, 40); scene.add(cool);

/* The eight rings. Spread: a gate every GAP units, scaled up so the camera can pass through.
   Logo: stacked at the end of the journey at their true size and order. */
const GAP = 14, SPREAD_SCALE = 3.1, END_Z = -7 * GAP - 18;
const rings = [];
for (let i = 0; i < 8; i++) {
  const t = i / 7, R = 2.2 * 0.96 * (1 - t * 0.8), a = 0.95 * Math.pow(t, 1.6), gap = i < 2 ? 0.3 : 0;
  const color = new THREE.Color(SPECTRUM[i]);
  const mat = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.22, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 });
  const mesh = new THREE.Mesh(bandGeo(ringLine(R, a, gap), gap === 0, 0.06 - 0.016 * t, 0.2, 0.03), mat);
  const spreadScale = SPREAD_SCALE * (1 + (1 - t) * 0.15) / (1 - t * 0.8);
  mesh.userData = { t, spreadZ: -i * GAP, logoZ: END_Z + t * 0.34, spreadScale, spin: (i % 2 ? -1 : 1) * (0.08 + i * 0.015) };
  scene.add(mesh); rings.push(mesh);
}

/* Dust: a slow field of points tinted from the ring spectrum. */
const dust = (() => {
  const n = reduceMotion ? 900 : 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 3 + Math.random() * 16, th = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(th) * r; pos[i * 3 + 1] = Math.sin(th) * r * 0.7; pos[i * 3 + 2] = 10 - Math.random() * (7 * GAP + 40);
    const c = new THREE.Color(SPECTRUM[(Math.random() * 8) | 0]).multiplyScalar(0.55); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(p); return p;
})();

/* ---------- Post ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.55, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < 700 ? 58 : 42; camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize); resize();

/* ---------- State driven by scroll ---------- */
const state = { p: 0, target: 0, vel: 0, mx: 0, my: 0, sx: 0, sy: 0, flash: 0, foot: 0, footTarget: 0, footCy: 0, footPx: 0 };
const smooth = x => x * x * (3 - 2 * x);
const clamp01 = x => Math.max(0, Math.min(1, x));
window.World = {
  setProgress: p => { state.target = clamp01(p); },
  setVelocity: v => { state.vel = Math.max(-1, Math.min(1, v / 3000)); },
  setPointer: (x, y) => { state.mx = x; state.my = y; },
  flash: () => { state.flash = 1; },
  // Footer handoff: f runs 0 to 1; cy and px are the footer symbol's centre and diameter in screen pixels.
  setFooter: (f, cy, px) => { state.footTarget = clamp01(f); state.footCy = cy; state.footPx = px; },
  ready: true,
};

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.05, clock.getDelta()), time = clock.elapsedTime;
  state.p += (state.target - state.p) * (reduceMotion ? 1 : 1 - Math.pow(0.0015, dt));
  state.sx += (state.mx - state.sx) * 0.05; state.sy += (state.my - state.sy) * 0.05;
  const p = state.p;
  // Phase A, 0 to 0.86: fly through the gates. Phase B, 0.86 to 1: the gates resolve into the logo.
  // The rings assemble in the centre first, then the finished logo glides to its place beside the headline.
  const fly = clamp01(p / 0.86), resolve = smooth(clamp01((p - 0.8) / 0.14)), shift = smooth(clamp01((p - 0.95) / 0.05));
  const camZ = 12 + (END_Z + 13 - 12) * fly;
  const still = 1 - resolve * 0.6 - 0.4 * smooth(clamp01(state.foot));
  camera.position.set(state.sx * 1.2 * still, state.sy * 0.8 * still, camZ);
  camera.lookAt(state.sx * 0.4 * still, state.sy * 0.3 * still, camZ - 20);
  camera.fov += ((window.innerWidth < 700 ? 58 : 42) + Math.abs(state.vel) * 10 - camera.fov) * 0.1; camera.updateProjectionMatrix();
  state.foot += (state.footTarget - state.foot) * (reduceMotion ? 1 : 1 - Math.pow(0.002, dt));
  const ft = smooth(clamp01(state.foot));
  // Where the footer lockup's symbol will sit, converted from screen pixels to world units at the logo's depth.
  const dist = camZ - END_Z, ppu = window.innerHeight / (2 * dist * Math.tan((camera.fov * Math.PI) / 360));
  const fy = (window.innerHeight / 2 - state.footCy) / ppu, fs = state.footPx / ppu / (2 * 2.17);
  const fade = smooth(clamp01((state.foot - 0.86) / 0.14));
  rings.forEach((m, i) => {
    const u = m.userData;
    const z = u.spreadZ + (u.logoZ - u.spreadZ) * resolve;
    const s = u.spreadScale + (1 - u.spreadScale) * resolve;
    const wide = window.innerWidth > 860, lx = wide ? 2.75 : 0, ly = wide ? 0 : 3.6, ls = wide ? 1 : 0.5;
    const rx = lx * shift, ry = ly * shift, rs = s * (1 + (ls - 1) * shift);
    m.position.set(rx + (0 - rx) * ft, ry + (fy - ry) * ft, z); m.scale.setScalar(rs + ((fs || rs) - rs) * ft);
    m.material.transparent = fade > 0; m.material.opacity = 1 - fade; m.visible = fade < 0.999;
    m.rotation.z = reduceMotion ? 0 : (1 - resolve) * Math.sin(time * u.spin + i) * 0.35;
    m.rotation.y = (1 - resolve) * 0.12 * Math.sin(time * 0.3 + i);
    m.material.emissiveIntensity = 0.16 + 0.5 * Math.max(0, 1 - Math.abs(camZ - z - 6) / 10) * (1 - resolve) - 0.06 * resolve + state.flash * 0.45;
  });
  dust.rotation.z = time * 0.01; dust.material.opacity = 0.85 * (1 - resolve * 0.7);
  warm.position.set(-5, -2, camZ - 8); cool.position.set(6, 3, camZ - 14);
  scene.fog.density = 0.035 * (1 - resolve * 0.75);
  bloom.strength = 0.34 - 0.12 * resolve + state.flash * 0.4;
  state.flash *= 0.94; state.vel *= 0.9;
  composer.render();
  requestAnimationFrame(frame);
}
frame();
document.documentElement.classList.add("has-world");
