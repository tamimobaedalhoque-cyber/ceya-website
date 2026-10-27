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
    drone(73.42, "sawtooth", 0.028, -6); drone(73.42, "sawtooth", 0.028, 7); drone(110, "triangle", 0.06); drone(146.83, "sine", 0.05); drone(36.71, "sine", 0.08);
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
    pad.filter.frequency.setTargetAtTime(260 + p * 1100 + speed * 700, t, 0.3);
    projector(speed);
    pad.out.gain.setTargetAtTime((0.55 + p * 0.45) * pad.end, t, 0.6);
    pad.layers.forEach((v, i) => v.gain.setTargetAtTime(i < lit ? 0.035 : 0, t, 0.9));
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
    // Air rushing past, swept across the stereo field in the direction of travel.
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), v = ctx.createGain(), pan = ctx.createStereoPanner();
    src.buffer = noiseBuf; f.type = "bandpass"; f.Q.value = 0.8;
    f.frequency.setValueAtTime(dir > 0 ? 260 : 2400, t); f.frequency.exponentialRampToValueAtTime(dir > 0 ? 2400 : 260, t + 0.85);
    pan.pan.setValueAtTime(-0.85 * dir, t); pan.pan.linearRampToValueAtTime(0.85 * dir, t + 0.9);
    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.22, t + 0.35); v.gain.exponentialRampToValueAtTime(0.0008, t + 1);
    src.connect(f); f.connect(v); v.connect(pan); pan.connect(bus); src.start(t, Math.random()); src.stop(t + 1.05);
    // A low body thump, then the ring's own note like a struck bell.
    tone(NOTES[i] / 4, t + 0.2, 0.7, 0.08, "sine");
    mallet(NOTES[i], t + 0.22, 0.12, 0, 2.2);
    if (onNote) onNote(i);
  }

  /* A soft mallet: a sine with a gentle octave and a quick, rounded decay. Pan follows screen position. */
  function mallet(f, at, gain, panX = 0, len = 0.9) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), v = ctx.createGain(), v2 = ctx.createGain(), pan = ctx.createStereoPanner();
    o.type = "sine"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f * 4.01; v2.gain.value = 0.08; pan.pan.value = Math.max(-0.9, Math.min(0.9, panX));
    o.connect(v); o2.connect(v2); v2.connect(v); v.connect(pan); pan.connect(bus);
    v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(gain, at + 0.006); v.gain.exponentialRampToValueAtTime(0.0006, at + len);
    o.start(at); o2.start(at); o.stop(at + len + 0.05); o2.stop(at + len + 0.05);
  }
  const SCALE = [146.83, 164.81, 185, 220, 246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880]; // D major pentatonic-ish, low to high
  const noteFor = x => SCALE[Math.max(0, Math.min(SCALE.length - 1, Math.round(x * (SCALE.length - 1))))];

  /* Film-projector ticks while the page is moving: faster scroll, faster ticks. */
  let projT = 0, projRate = 0;
  function projector(speed) {
    projRate = speed;
    if (projT || !on) return;
    const tickLoop = () => {
      if (!on || projRate < 0.04) { projT = 0; return; }
      noise(now(), 0.025, 0.05 * Math.min(1, projRate * 1.5), 2600, 1800, 4, "bandpass");
      projT = setTimeout(tickLoop, 1000 / (8 + projRate * 16));
    };
    projT = setTimeout(tickLoop, 0);
  }

  /* ---------- Interface ---------- */
  // x: the element's horizontal position across the screen, 0 to 1. It picks the note and the stereo position.
  function ui(kind, value = 0, x = 0.5) {
    if (!on) return;
    const t = now();
    if (kind === "hover") { if (t - lastTick < 0.045) return; lastTick = t; mallet(noteFor(value), t, 0.05, x * 1.6 - 0.8, 0.5); }
    else if (kind === "click") { mallet(noteFor(value), t, 0.09, x * 1.6 - 0.8, 1.2); mallet(noteFor(value) * 1.5, t + 0.05, 0.05, x * 1.6 - 0.8, 1.2); }
    else if (kind === "slate") { noise(t, 0.04, 0.09, 4200, 2600, 3, "highpass"); mallet(1318.5, t, 0.02, 0, 0.2); }
    else if (kind === "open") { noise(t, 0.7, 0.14, 300, 2600, 0.8); [293.66, 440, 587.33, 739.99].forEach((f, k) => mallet(f, t + 0.08 + k * 0.07, 0.06, -0.6 + k * 0.4, 1.4)); }
    else if (kind === "close") { noise(t, 0.55, 0.12, 2600, 300, 0.8); [587.33, 440, 293.66].forEach((f, k) => mallet(f, t + 0.06 + k * 0.06, 0.05, 0.6 - k * 0.6, 1)); }
    else if (kind === "rec") { noise(t, 0.08, 0.16, 3000, 1500, 2, "highpass"); mallet(1046.5, t + 0.08, 0.05, 0, 0.2); mallet(1046.5, t + 0.26, 0.05, 0, 0.2); }
  }
  /* Each service layer arrives with its ring's chord. */
  function layer(i) {
    if (!on) return;
    const ringIdx = [0, 3, 4, 7][i] ?? 0, f = NOTES[ringIdx], t = now();
    [f / 2, f * 0.75, f].forEach((n, k) => mallet(n, t + k * 0.05, 0.06, -0.4 + k * 0.4, 2.4));
  }
  /* Dragging the grade: a tone that glides with the handle, from cool and low to warm and high. */
  let glideO = null, glideV = null, glideT = 0;
  function glide(v) {
    if (!on) return;
    const t = now(), f = 196 * Math.pow(2, (v / 100) * 1.6);
    if (!glideO) {
      glideO = ctx.createOscillator(); glideO.type = "sine"; glideV = ctx.createGain(); glideV.gain.value = 0;
      const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f * 2; const g2 = ctx.createGain(); g2.gain.value = 0.2;
      glideO.connect(glideV); o2.connect(g2); g2.connect(glideV); glideV.connect(bus); glideO.start(); o2.start(); glideO._o2 = o2;
    }
    glideO.frequency.setTargetAtTime(f, t, 0.04); glideO._o2.frequency.setTargetAtTime(f * 2, t, 0.04);
    glideV.gain.setTargetAtTime(0.06, t, 0.03);
    clearTimeout(glideT); glideT = setTimeout(() => { if (glideV) glideV.gain.setTargetAtTime(0, now(), 0.15); }, 180);
  }
  /* The radial wave as an instrument: each ring's direction plays that ring's note. */
  let lastPlayed = -1, lastPlayT = 0;
  function instrument(idx, x) {
    if (!on || idx === lastPlayed && now() - lastPlayT < 0.35) return;
    lastPlayed = idx; lastPlayT = now();
    mallet(NOTES[idx], now(), 0.08, x * 1.6 - 0.8, 1.8);
    if (onNote) onNote(idx);
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

  /* ---------- A film's motif: a short phrase on the logo's notes. Plays on a click even with sound off. ---------- */
  let phraseTimers = [];
  function phrase(seq, step = 0.22, cb) {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    phraseTimers.forEach(clearTimeout); phraseTimers = [];
    if (!on) master.gain.setTargetAtTime(0.9, now(), 0.05);
    const t = now() + 0.05;
    seq.forEach((n, k) => {
      if (n == null) return;
      tone(NOTES[n], t + k * step, 0.8, 0.16);
      phraseTimers.push(setTimeout(() => { if (cb) cb(k, n); if (onNote) onNote(n); }, k * step * 1000));
    });
    phraseTimers.push(setTimeout(() => { if (cb) cb(-1); if (!on) master.gain.setTargetAtTime(0, now(), 0.5); }, (seq.length * step + 1.6) * 1000));
    return seq.length * step;
  }
  /* ---------- Page change: the rings close with a rising breath, then open with a falling one ---------- */
  function wipe(dir = 1) {
    if (!on) return;
    const t = now();
    if (dir > 0) { noise(t, 0.75, 0.13, 260, 2400, 0.9); [293.66, 440, 587.33].forEach((f, k) => mallet(f, t + 0.1 + k * 0.09, 0.05, -0.5 + k * 0.5, 1.2)); }
    else { noise(t, 0.8, 0.11, 2400, 280, 0.9); mallet(880, t + 0.1, 0.05, 0, 1.6); }
  }

  /* ---------- On and off ---------- */
  function enable() {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    on = true; master.gain.setTargetAtTime(0.75, now(), 0.4);
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
    enable, disable, score, ring, ui, scrub, sonic, layer, glide, instrument, phrase, wipe,
    setEnd(f) { if (pad) { pad.end = 1 - clamp01(f) * 0.85; if (on) pad.out.gain.setTargetAtTime(0.55 * pad.end, now(), 0.4); } },
    onNote(fn) { onNote = fn; },
  };
})();
