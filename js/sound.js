/* Ceya website, sound design. Everything is synthesised live from the sonic logo's eight notes
   (D major, one note per ring). Nothing plays until the visitor turns sound on.
   Exposes window.CeyaSound. */
(() => {
  "use strict";
  const NOTES = [293.66, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880]; // ring 1 (Sun) to ring 8 (Mint)
  const KEY = "ceya-sound";
  let ctx = null, master = null, bus = null, verb = null, pad = null, on = false, onNote = null;
  let noiseBuf = null, lastTick = 0, scrubGain = null, scrubFilter = null, scrubTimer = 0;

  const now = () => ctx.currentTime;
  const clamp01 = x => Math.max(0, Math.min(1, x));

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    // A long, soft room made from decaying noise.
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.42; verb.connect(wet); wet.connect(master);
    bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master); bus.connect(verb);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    buildPad(); buildScrub();
  }

  /* ---------- The score: a D drone, plus one sustained voice per ring the camera has passed ---------- */
  function buildPad() {
    pad = { out: ctx.createGain(), filter: ctx.createBiquadFilter(), layers: [], end: 1 };
    pad.filter.type = "lowpass"; pad.filter.frequency.value = 380; pad.filter.Q.value = 0.6;
    pad.out.gain.value = 0;
    pad.filter.connect(pad.out); pad.out.connect(bus);
    const drone = (f, type, g, detune = 0) => { const o = ctx.createOscillator(), v = ctx.createGain(); o.type = type; o.frequency.value = f; o.detune.value = detune; v.gain.value = g; o.connect(v); v.connect(pad.filter); o.start(); return o; };
    drone(73.42, "sawtooth", 0.05, -6); drone(73.42, "sawtooth", 0.05, 7); drone(110, "triangle", 0.07); drone(146.83, "sine", 0.06);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 90; lfo.connect(lg); lg.connect(pad.filter.frequency); lfo.start();
    NOTES.forEach((f, i) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), v = ctx.createGain();
      o.type = "sine"; o2.type = "triangle"; o.frequency.value = f / 2; o2.frequency.value = f / 2 * 1.003;
      v.gain.value = 0; o.connect(v); o2.connect(v); v.connect(pad.filter); o.start(); o2.start();
      pad.layers.push(v);
    });
  }
  // p: journey progress 0 to 1. lit: how many rings have been passed. speed: scroll velocity, 0 to 1.
  function score(p, lit, speed) {
    if (!on) return;
    const t = now();
    pad.filter.frequency.setTargetAtTime(320 + p * 1500 + speed * 900, t, 0.25);
    pad.out.gain.setTargetAtTime((0.55 + p * 0.45) * pad.end, t, 0.6);
    pad.layers.forEach((v, i) => v.gain.setTargetAtTime(i < lit ? 0.045 : 0, t, 0.9));
  }

  /* ---------- One-shot voices ---------- */
  function tone(f, at, len, gain, type = "sine", out = bus) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), v = ctx.createGain(), v2 = ctx.createGain();
    o.type = type; o2.type = "triangle"; o.frequency.value = f; o2.frequency.value = f * 2.001; v2.gain.value = 0.16;
    o.connect(v); o2.connect(v2); v2.connect(v); v.connect(out);
    v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(gain, at + 0.012); v.gain.exponentialRampToValueAtTime(0.0008, at + len);
    o.start(at); o2.start(at); o.stop(at + len + 0.05); o2.stop(at + len + 0.05);
  }
  function noise(at, len, gain, f0, f1, q = 1.2, type = "bandpass") {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(f1, at + len);
    v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(gain, at + len * 0.35); v.gain.exponentialRampToValueAtTime(0.0008, at + len);
    s.connect(f); f.connect(v); v.connect(bus); s.start(at, Math.random()); s.stop(at + len + 0.05);
  }

  /* ---------- Passing through a ring: a whoosh, plus the ring's own note ---------- */
  function ring(i, dir = 1) {
    if (!on) return;
    const t = now() + 0.01;
    noise(t, 0.9, 0.28, dir > 0 ? 300 : 3600, dir > 0 ? 3600 : 300, 0.9);
    tone(NOTES[i], t + 0.18, 1.6, 0.11);
    if (onNote) onNote(i);
  }

  /* ---------- Interface ---------- */
  function ui(kind, value = 0) {
    if (!on) return;
    const t = now();
    if (kind === "hover") { if (t - lastTick < 0.05) return; lastTick = t; tone(1760, t, 0.06, 0.025, "sine"); }
    else if (kind === "click") { tone(587.33, t, 0.35, 0.08, "triangle"); tone(880, t + 0.03, 0.3, 0.04); }
    else if (kind === "slate") { noise(t, 0.05, 0.12, 4000, 2500, 3, "highpass"); tone(1318.5, t, 0.08, 0.03); }
    else if (kind === "open") { noise(t, 0.7, 0.18, 400, 2800, 0.8); [293.66, 440, 587.33].forEach((f, k) => tone(f, t + 0.1 + k * 0.06, 1.2, 0.05)); }
    else if (kind === "close") { noise(t, 0.6, 0.15, 2800, 400, 0.8); tone(293.66, t + 0.15, 0.8, 0.05); }
    else if (kind === "grade") { tone(800 + value * 8, t, 0.04, 0.02, "square"); }
    else if (kind === "rec") { noise(t, 0.08, 0.2, 3000, 1500, 2, "highpass"); tone(1046.5, t + 0.08, 0.12, 0.05); tone(1046.5, t + 0.26, 0.12, 0.05); }
  }
  /* Dragging the film strip: tape-scrub noise that follows the drag speed. */
  function buildScrub() {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    scrubFilter = ctx.createBiquadFilter(); scrubFilter.type = "bandpass"; scrubFilter.Q.value = 2.5; scrubFilter.frequency.value = 900;
    scrubGain = ctx.createGain(); scrubGain.gain.value = 0;
    s.connect(scrubFilter); scrubFilter.connect(scrubGain); scrubGain.connect(bus); s.start();
  }
  function scrub(speed) {
    if (!on) return;
    const t = now(), s = clamp01(Math.abs(speed));
    scrubGain.gain.setTargetAtTime(s * 0.16, t, 0.05); scrubFilter.frequency.setTargetAtTime(500 + s * 2600, t, 0.05);
    clearTimeout(scrubTimer); scrubTimer = setTimeout(() => scrubGain && scrubGain.gain.setTargetAtTime(0, now(), 0.12), 120);
  }

  /* ---------- The sonic logo: eight notes, then the chord ---------- */
  function sonic(short = false) {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    if (!on) { master.gain.setTargetAtTime(0.9, now(), 0.05); }
    const t = now() + 0.05, idx = short ? [0, 3, 7] : [0, 1, 2, 3, 4, 5, 6, 7], step = 0.165;
    idx.forEach((n, k) => { tone(NOTES[n], t + k * step, 0.9, 0.2); setTimeout(() => onNote && onNote(n), k * step * 1000); });
    [587.33, 739.99, 880].forEach(f => tone(f, t + idx.length * step + 0.05, 1.8, 0.12));
    if (!on) setTimeout(() => { if (!on) master.gain.setTargetAtTime(0, now(), 0.4); }, (idx.length * step + 2.2) * 1000);
  }

  /* ---------- On and off ---------- */
  function enable() {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    on = true; master.gain.setTargetAtTime(0.9, now(), 0.4);
    try { localStorage.setItem(KEY, "on"); } catch (e) {}
    ui("rec");
  }
  function disable() {
    on = false; if (master) master.gain.setTargetAtTime(0, now(), 0.3);
    if (pad) pad.layers.forEach(v => v.gain.setTargetAtTime(0, now(), 0.3));
    try { localStorage.setItem(KEY, "off"); } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
  let wanted = false; try { wanted = localStorage.getItem(KEY) === "on"; } catch (e) {}

  window.CeyaSound = {
    get on() { return on; }, wanted,
    toggle() { if (on) disable(); else enable(); return on; },
    enable, disable, score, ring, ui, scrub, sonic,
    setEnd(f) { if (pad) { pad.end = 1 - clamp01(f) * 0.85; if (on) pad.out.gain.setTargetAtTime(0.55 * pad.end, now(), 0.4); } },
    onNote(fn) { onNote = fn; },
  };
})();
