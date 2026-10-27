/* Ceya website: scroll, story and interaction. Scrolling is filming: the camera, the timecode,
   the scene slate and the ring meter all follow one scroll position. */
(() => {
  "use strict";
  const E = window.CeyaEngine;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  if (reduce) root.classList.add("reduce");
  gsap.registerPlugin(ScrollTrigger);
  // The film always starts at the first frame.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  const EASE = "power3.out";
  const SPECTRUM = ["#F7B32B", "#F7B32B", "#FA9C3D", "#FC864F", "#FF6F61", "#D7927B", "#B0B596", "#88D8B0"];
  // Arabic pages read right to left: the strip runs the other way and Arabic words are never split into letters.
  const AR = root.lang === "ar", RTL = root.dir === "rtl";
  const tr = (en, ar) => (AR ? ar : en);
  const world = () => window.World || { setProgress() {}, setVelocity() {}, setPointer() {}, flash() {} };

  /* ---------- Split text into characters or words ---------- */
  function splitChars(el) {
    const text = el.textContent; el.textContent = ""; el.setAttribute("aria-label", text);
    text.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { el.append(" "); return; }
      const w = document.createElement("span"); w.className = "wd"; w.setAttribute("aria-hidden", "true"); w.style.whiteSpace = "nowrap";
      (AR ? [part] : [...part]).forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; w.appendChild(s); });
      el.appendChild(w);
    });
    return $$(".ch", el);
  }
  function splitWords(el) {
    const text = el.textContent; el.textContent = ""; el.setAttribute("aria-label", text);
    return text.split(/\s+/).filter(Boolean).map((w, i, a) => { const s = document.createElement("span"); s.className = "wd"; s.setAttribute("aria-hidden", "true"); s.textContent = w; el.appendChild(s); if (i < a.length - 1) el.append(" "); return s; });
  }
  const heroChars = $$(".hero-title [data-split]").flatMap(splitChars);
  const playChars = $$(".play-title [data-split]").flatMap(splitChars);
  const statementWords = $$("[data-words]").flatMap(splitWords);

  /* ---------- Smooth scroll, synced to GSAP ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.stop();
  }
  const scrollTo = target => { const el = typeof target === "string" ? $(target) : target; if (!el) return; if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) }); else el.scrollIntoView(); };
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => { const id = a.getAttribute("href"); if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); } }));

  /* ---------- Sound: synthesised in sound.js from the sonic logo's eight notes ---------- */
  const S = window.CeyaSound || { on: false, toggle() { return false; }, score() {}, ring() {}, ui() {}, scrub() {}, sonic() {}, setEnd() {}, onNote() {} };
  let energy = 0;
  S.onNote(() => { energy = Math.min(1, energy + 0.25); world().flash(); });
  const sonic = () => S.sonic();
  const soundBtn = $("#sound");
  const setSoundLabel = () => { soundBtn.setAttribute("aria-pressed", String(S.on)); soundBtn.lastChild.textContent = S.on ? tr("Sound on", "الصوت يعمل") : tr("Sound off", "الصوت مغلق"); };
  soundBtn.addEventListener("click", () => { S.toggle(); setSoundLabel(); });
  // Browsers only allow audio after a gesture, so a visitor who left sound on gets it back on their first click or key.
  if (S.wanted) { const resume = () => { if (!S.on) { S.enable(); setSoundLabel(); } window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); }; window.addEventListener("pointerdown", resume); window.addEventListener("keydown", resume); }
  $("#sonic").addEventListener("click", sonic);
  // Hovering plays a note from the logo's scale: higher toward the top of the screen, panned to where the element sits.
  const pos = el => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth, y: 1 - (r.top + r.height / 2) / innerHeight }; };
  $$("a, button").forEach(el => {
    el.addEventListener("mouseenter", () => { const p = pos(el); S.ui("hover", p.y * 0.7 + p.x * 0.3, p.x); });
    if (el !== soundBtn) el.addEventListener("click", () => { const p = pos(el); S.ui("click", p.y * 0.7 + p.x * 0.3, p.x); });
  });
  $$(".frame").forEach((f, i) => f.addEventListener("mouseenter", () => S.ui("hover", 0.3 + i * 0.1, pos(f).x)));

  /* ---------- Preloader: the rings draw on while the timecode runs ---------- */
  const loaderSvg = $("#loader-rings"), tcOut = $("#loader-tc");
  const loaderPaths = SPECTRUM.map((c, i) => {
    const t = i / 7, p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", E.ringPath(500, 480 * (1 - t * 0.8), 0.95 * Math.pow(t, 1.6), i < 2 ? 0.3 : 0));
    p.setAttribute("fill", "none"); p.setAttribute("stroke", c); p.setAttribute("stroke-width", (12 - 5 * t).toFixed(1)); p.setAttribute("stroke-linecap", "round");
    loaderSvg.appendChild(p); const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return p;
  });
  const fmtTC = f => [Math.floor(f / 86400) % 24, Math.floor(f / 1440) % 60, Math.floor(f / 24) % 60, f % 24].map(v => String(v).padStart(2, "0")).join(":");
  // Part one draws immediately. Part two opens the frame once the drawing is done and the 3D world is ready.
  const counter = { f: 0 };
  const draw = gsap.timeline();
  draw.to(loaderPaths, { strokeDashoffset: 0, duration: reduce ? 0.01 : 1.1, stagger: 0.07, ease: "power2.inOut" })
    .to(counter, { f: 24 * 2 + 12, duration: reduce ? 0.01 : 1.6, ease: "none", onUpdate: () => { tcOut.textContent = fmtTC(Math.round(counter.f)); } }, 0);
  const open = gsap.timeline({ paused: true });
  open.to(loaderSvg, { scale: 0.18, duration: reduce ? 0.01 : 0.55, ease: "power3.in" })
    .to("#loader", { clipPath: "circle(0% at 50% 50%)", duration: reduce ? 0.01 : 0.95, ease: "power4.inOut" }, ">-0.1")
    .from(heroChars, { yPercent: 110, duration: 1.1, stagger: 0.022, ease: "power4.out" }, ">-0.55")
    .to(".scene--hero .reveal-up", { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: EASE }, ">-0.8")
    .from(".hud, .top", { opacity: 0, duration: 0.9, ease: "none" }, "<")
    .add(() => { root.classList.remove("is-loading"); $("#loader").style.display = "none"; if (lenis) lenis.start(); ScrollTrigger.refresh(); if (location.hash.length > 1 && $(location.hash)) setTimeout(() => scrollTo(location.hash), 200); });
  const t0 = performance.now();
  (function check() { if ((!draw.isActive() && (window.World || performance.now() - t0 > 2600)) || performance.now() - t0 > 4000) open.play(); else requestAnimationFrame(check); })();

  /* ---------- One scroll drives the camera, timecode and meter ---------- */
  const GATES = Array.from({ length: 8 }, (_, i) => (12 + 14 * i) / 115);
  let lastP = 0;
  // Journey progress to flight progress: a straight run that clears the final gate (0.957) when the sound scene is half in view.
  const flyOf = q => { const el = $("#sound-scene"), rs = $("#resolve"); const k = el && rs ? Math.max(0.3, (el.offsetTop - innerHeight * 0.45) / (rs.offsetTop - innerHeight)) : 0.82; return q < k ? (q / k) * 0.985 : 0.985 + 0.015 * Math.min(1, (q - k) / (1 - k)); };
  const hudTC = $("#hud-tc"), meter = $$("#hud-meter li"), sceneNo = $("#hud-scene-no"), sceneName = $("#hud-scene-name");
  ScrollTrigger.create({
    trigger: "#smooth", start: "top top", endTrigger: "#resolve", end: "top bottom",
    onUpdate: self => {
      // The flight is warped so the camera has crossed the last gate by the time Listen to the mark settles:
      // that ring leaves through the frame and only stars lie ahead until the rings return at the resolve.
      const p = flyOf(self.progress);
      world().setProgress(p); world().setVelocity(self.getVelocity());
      // Score and ring passes. Gate i sits where the camera's travel reaches it: (12 + 14i) / 115 of the flight.
      const passed = GATES.filter(g => p >= g).length;
      S.score(p, passed, Math.min(1, Math.abs(self.getVelocity()) / 4000));
      GATES.forEach((g, i) => { if ((lastP < g) !== (p < g)) S.ring(i, p > lastP ? 1 : -1); });
      lastP = p;
      hudTC.textContent = fmtTC(Math.round(self.progress * 168 * 24));
      const lit = Math.round(self.progress * 8); meter.forEach((m, i) => m.classList.toggle("on", i < lit));
    },
  });
  $$("[data-scene]").forEach(sec => ScrollTrigger.create({
    trigger: sec, start: "top 55%", end: "bottom 55%",
    onToggle: self => { if (!self.isActive) return; S.ui("slate"); sceneNo.textContent = `${tr("Scene", "مشهد")} ${sec.dataset.scene}`; sceneName.textContent = sec.dataset.name; gsap.fromTo(".hud-scene", { opacity: 0.2 }, { opacity: 1, duration: 0.6 }); },
  }));

  /* ---------- Hero leaves the frame: it drifts up and fades as the camera rolls ---------- */
  gsap.to(".scene--hero > *", { yPercent: -30, opacity: 0, ease: "none", stagger: 0.04, scrollTrigger: { trigger: ".scene--hero", start: "top top", end: "bottom 35%", scrub: true } });

  /* ---------- Dimmer: content scenes dim the world behind them so text stays readable ---------- */
  $$("[data-dim]").forEach(sec => ScrollTrigger.create({
    trigger: sec, start: "top 60%", end: "bottom 40%",
    onToggle: self => gsap.to(".scrim", { opacity: self.isActive ? (sec.dataset.dim === "soft" ? 0.6 : 1) : 0, duration: 0.8, ease: "power2.out", overwrite: true }),
  }));

  /* ---------- Resolve and shift: the rings close in the centre, then the logo moves beside the headline ---------- */
  let resP = 0, shP = 0;
  const phases = () => world().setPhases && world().setPhases(resP, shP);
  let resolvedPlayed = false;
  ScrollTrigger.create({ trigger: "#resolve", start: "top bottom", end: "center center", scrub: true, onUpdate: s => { resP = s.progress; phases(); if (s.progress > 0.92 && !resolvedPlayed) { resolvedPlayed = true; if (S.on) sonic(); } if (s.progress < 0.4) resolvedPlayed = false; } });
  ScrollTrigger.create({ trigger: "#play", start: "top bottom", end: "center center", scrub: true, onUpdate: s => { shP = s.progress; phases(); } });
  gsap.from(".resolve-cap", { opacity: 0, y: 20, duration: 1, ease: EASE, scrollTrigger: { trigger: "#resolve", start: "center 70%", toggleActions: "play none none reverse" } });

  /* ---------- Statement: words light up as you read ---------- */
  if (statementWords.length) gsap.to(statementWords, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".scene--statement", start: "top 65%", end: "bottom 80%", scrub: true } });

  /* ---------- Layers: each word rises out of the depth, fills with its ring colour, then flies past ---------- */
  const lyrs = $$(".lyr"), idx = $$(".layers-index li");
  let lastLayer = -1;
  if (lyrs.length) {
    gsap.set(lyrs, { opacity: 0, scale: 0.45, filter: "blur(10px)" });
    const tl = gsap.timeline({ scrollTrigger: { trigger: ".scene--layers", start: "top top", end: "bottom bottom", scrub: 0.8,
      onUpdate: self => { const k = Math.max(0, Math.min(lyrs.length - 1, Math.floor((self.progress * tl.duration() - 0.3) / 2))); if (k !== lastLayer && self.progress > 0.02) { lastLayer = k; S.layer(k); } idx.forEach((li, i) => li.classList.toggle("on", i === k)); } } });
    lyrs.forEach((l, i) => {
      const word = $(".lyr-word", l), body = $(".lyr-body", l);
      tl.to(l, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "power2.out" }, i * 2)
        .fromTo(word, { color: "rgba(0,0,0,0)" }, { color: getComputedStyle(l).getPropertyValue("--c").trim() || "#fff", duration: 0.6, ease: "none" }, i * 2 + 0.5)
        .from(body, { y: 40, opacity: 0, duration: 0.7, ease: "power2.out" }, i * 2 + 0.55);
      if (i < lyrs.length - 1) tl.to(l, { opacity: 0, scale: 2.4, filter: "blur(14px)", duration: 1, ease: "power2.in" }, i * 2 + 1.6);
    });
    tl.to({}, { duration: 0.6 });
  }

  /* ---------- Work: a film strip that runs sideways and bends with speed ---------- */
  $$(".frame-pat").forEach(el => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 1000 1000"); s.setAttribute("preserveAspectRatio", "xMidYMid slice"); E.draw(s, JSON.parse(el.dataset.pat)); el.appendChild(s); });
  const track = $("#strip-track");
  if (track) {
    const skew = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3" });
    gsap.to(track, {
      x: () => (RTL ? 1 : -1) * (track.scrollWidth - window.innerWidth), ease: "none",
      scrollTrigger: { trigger: ".scene--work", start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true, onUpdate: self => skew(reduce ? 0 : gsap.utils.clamp(-8, 8, self.getVelocity() / (RTL ? 260 : -260))) },
    });
    let drag = null;
    const strip = $("#strip");
    strip.addEventListener("pointerdown", e => { drag = { x: e.clientX, s: window.scrollY }; strip.setPointerCapture(e.pointerId); });
    strip.addEventListener("pointermove", e => { if (!drag) return; S.scrub((e.movementX || 0) / 40); const target = drag.s + (RTL ? 1 : -1) * (e.clientX - drag.x) * 2.2; if (lenis) lenis.scrollTo(target, { immediate: false, lerp: 0.2 }); else window.scrollTo(0, target); });
    // A tap opens the film; a drag only scrubs. Pointer capture sends the release to the strip, so find the frame under it.
    strip.addEventListener("pointerup", e => {
      const moved = drag && Math.abs(e.clientX - drag.x) > 6; drag = null;
      if (moved || e.button !== 0) return;
      const f = document.elementFromPoint(e.clientX, e.clientY)?.closest(".frame");
      if (f) { if (window.CeyaWipe) window.CeyaWipe.go(f.href, e.clientX, e.clientY); else location.href = f.href; }
    });
    strip.addEventListener("pointercancel", () => { drag = null; });
    $$(".frame").forEach(f => f.addEventListener("click", e => { if (e.detail !== 0) e.preventDefault(); }));
  }

  /* ---------- Grade: drag to compare ---------- */
  const gradeBox = $("#grade-box"), gradeRange = $("#grade-range");
  if (gradeBox) {
    const setX = v => gradeBox.style.setProperty("--x", `${v}%`);
    let lastStep = -1;
    gradeRange.addEventListener("input", () => { setX(gradeRange.value); const st = Math.round(gradeRange.value / 5); if (st !== lastStep) lastStep = st; S.glide(+gradeRange.value); });
    if (!reduce) {
      const sweep = { v: 50 };
      ScrollTrigger.create({ trigger: gradeBox, start: "top 70%", once: true, onEnter: () => gsap.timeline().to(sweep, { v: 18, duration: 1.1, ease: "power2.inOut", onUpdate: () => { setX(sweep.v); gradeRange.value = sweep.v; } }).to(sweep, { v: 82, duration: 1.4, ease: "power2.inOut", onUpdate: () => { setX(sweep.v); gradeRange.value = sweep.v; } }).to(sweep, { v: 50, duration: 1, ease: "power2.inOut", onUpdate: () => { setX(sweep.v); gradeRange.value = sweep.v; } }) });
    }
    gsap.from(".grade-copy > *", { opacity: 0, y: 30, stagger: 0.12, duration: 1, ease: EASE, scrollTrigger: { trigger: ".scene--grade", start: "top 70%" } });
  }

  /* ---------- Process: a playhead scrubs the timeline ---------- */
  const steps = $$(".tl-steps li");
  if (steps.length) {
    const fill = $("#tl-fill"), head = $("#tl-head"), tlTc = $("#tl-tc");
    ScrollTrigger.create({
      trigger: ".scene--process", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: self => {
        const p = self.progress; fill.style.width = `${p * 100}%`; head.style.left = `${p * 100}%`;
        const s = Math.round(p * 168); tlTc.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
        steps.forEach((li, i) => li.classList.toggle("on", p >= i / steps.length - 0.02));
      },
    });
  }

  /* ---------- Sound: the symbol resonates, harder when it plays ---------- */
  const waveHost = $("#sound-wave");
  if (waveHost) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-60 -60 1120 1120"); svg.setAttribute("class", "sound-wave"); svg.setAttribute("aria-hidden", "true");
    waveHost.replaceWith(svg);
    let on = false, near = 0, raf = 0;
    new IntersectionObserver(es => { on = es[0].isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(loop); }).observe(svg);
    svg.addEventListener("pointermove", e => {
      const r = svg.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy) / (r.width / 2); near = Math.max(0, 1 - d);
      // Distance from the centre picks the ring: the core is Mint, the outside is Sun.
      if (d < 1) S.instrument(Math.max(0, Math.min(7, 7 - Math.floor(d * 8))), e.clientX / innerWidth);
    });
    svg.addEventListener("pointerleave", () => { near = 0; });
    let last = 0;
    function loop(now) {
      if (now - last > 40) { last = now; energy *= 0.96; svg.innerHTML = E.radial({ n: 90, v: 0.25 + near * 0.5 + energy * 0.9, phase: reduce ? 0 : now / 900, mode: "spectrum" }); }
      if (on) raf = requestAnimationFrame(loop);
    }
    svg.innerHTML = E.radial({ n: 90, v: 0.4, mode: "spectrum" });
    gsap.from(".sound-copy > *", { opacity: 0, y: 30, stagger: 0.12, duration: 1, ease: EASE, scrollTrigger: { trigger: ".scene--sound", start: "top 65%" } });
  }

  /* ---------- Numbers count up ---------- */
  $$("[data-count]").forEach(el => {
    const n = { v: 0 }, to = +el.dataset.count;
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => gsap.to(n, { v: to, duration: reduce ? 0.01 : 1.8, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(n.v); } }) });
  });

  /* ---------- Manifesto: one line at a time ---------- */
  $$(".manifesto li").forEach(li => gsap.fromTo(li, { opacity: 0.12, scale: 0.96 }, { opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: li, start: "top 80%", end: "top 45%", scrub: true } }));

  /* ---------- Marquee: always running, faster and slanted with scroll ---------- */
  const mtrack = $(".marquee-track");
  if (mtrack && !reduce) {
    const loop = gsap.to(mtrack, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    const sk = gsap.quickTo(mtrack, "skewX", { duration: 0.4 });
    ScrollTrigger.create({ trigger: ".scene--clients", start: "top bottom", end: "bottom top", onUpdate: self => { const v = self.getVelocity(); loop.timeScale(1 + Math.min(4, Math.abs(v) / 400) * Math.sign(v || 1)); sk(gsap.utils.clamp(-10, 10, v / -200)); } });
  }

  /* ---------- Play: the idea resolves, the title lands ---------- */
  gsap.from(playChars, { yPercent: 110, stagger: 0.03, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: ".scene--play", start: "top 55%" } });
  gsap.from(".play-kicker, .cta, .play-meta", { opacity: 0, y: 30, stagger: 0.15, duration: 1, ease: EASE, scrollTrigger: { trigger: ".scene--play", start: "top 45%" } });
  $("#cta").addEventListener("click", () => { sonic(); world().flash(); });

  /* ---------- Footer handoff ----------
     Scroll brings the 3D symbol to the exact spot of the footer symbol and flattens it.
     Then a timed crossfade (not tied to scroll speed) dissolves the 3D symbol into the flat one,
     and the wordmark and descriptor rise in after it. Scrolling back reverses it. */
  const foot = $("#foot"), mark = $("#foot-mark"), fmSym = $("#fm-symbol"), fmWord = $("#fm-word"), fmDesc = $("#fm-desc");
  if (foot && mark) {
    const SYM_CY = (476.95 - 278.6) / 589.2, SYM_H = 384.7 / 589.2; // symbol centre and height inside the lockup artwork
    const seg = (p, a, b) => gsap.utils.clamp(0, 1, (p - a) / (b - a));
    const ease = x => x * x * (3 - 2 * x);
    const fx = { d: 0 };
    gsap.set([fmSym, fmWord, fmDesc], { opacity: 0 });
    gsap.set(fmWord, { yPercent: 5 }); gsap.set(fmDesc, { yPercent: 4 });
    const cross = gsap.timeline({ paused: true })
      .to(fx, { d: 1, duration: reduce ? 0.01 : 1.4, ease: "sine.inOut" }, 0)
      .to(fmSym, { opacity: 1, duration: reduce ? 0.01 : 1.2, ease: "sine.inOut" }, 0)
      .to(fmWord, { opacity: 1, yPercent: 0, duration: reduce ? 0.01 : 1, ease: "power2.out" }, reduce ? 0 : 0.9)
      .to(fmDesc, { opacity: 1, yPercent: 0, duration: reduce ? 0.01 : 0.9, ease: "power2.out" }, reduce ? 0 : 1.3);
    let shown = false, lastArgs = [0, 0, 0, 0];
    const push = () => world().setFooter && world().setFooter(lastArgs[0], lastArgs[1], lastArgs[2], lastArgs[3], fx.d);
    cross.eventCallback("onUpdate", push);
    ScrollTrigger.create({
      trigger: foot, start: "top bottom", end: "bottom bottom", scrub: true,
      onUpdate: self => {
        const p = self.progress, h = mark.offsetHeight;
        // The 3D symbol tracks the flat symbol's live position, so they are exactly superimposed when they swap.
        lastArgs = [ease(seg(p, 0, 0.6)), mark.getBoundingClientRect().top + SYM_CY * h, SYM_H * h, ease(seg(p, 0.55, 0.75))];
        push();
        if (p > 0.72 && !shown) { shown = true; cross.timeScale(1).play(); }
        else if (p < 0.6 && shown) { shown = false; cross.timeScale(1.6).reverse(); }
        S.setEnd(p);
      },
    });
  }

  /* ---------- Menu opens like an iris from the button ---------- */
  const menu = $("#menu"), openBtn = $("#menu-open"), closeBtn = $("#menu-close");
  function openMenu() {
    S.ui("open");
    const r = openBtn.getBoundingClientRect();
    menu.style.setProperty("--mx", `${r.left + r.width / 2}px`); menu.style.setProperty("--my", `${r.top + r.height / 2}px`);
    menu.hidden = false; openBtn.setAttribute("aria-expanded", "true"); if (lenis) lenis.stop();
    gsap.fromTo(menu, { clipPath: `circle(0px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)` }, { clipPath: `circle(150% at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`, duration: reduce ? 0.01 : 0.9, ease: "power4.inOut" });
    gsap.from(".menu-list li", { yPercent: 60, opacity: 0, stagger: 0.06, duration: 0.8, delay: 0.25, ease: EASE });
    closeBtn.focus();
  }
  function closeMenu(then) {
    S.ui("close");
    const r = openBtn.getBoundingClientRect();
    gsap.to(menu, { clipPath: `circle(0px at ${r.left + r.width / 2}px ${r.top + r.height / 2}px)`, duration: reduce ? 0.01 : 0.7, ease: "power4.inOut", onComplete: () => { menu.hidden = true; openBtn.setAttribute("aria-expanded", "false"); if (lenis) lenis.start(); openBtn.focus(); if (then) then(); } });
  }
  openBtn.addEventListener("click", openMenu); closeBtn.addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) closeMenu(); });
  $$(".menu-list a").forEach(a => a.addEventListener("click", e => {
    e.preventDefault(); e.stopImmediatePropagation(); const id = a.getAttribute("href");
    if (id.startsWith("#")) closeMenu(() => scrollTo(id));
    else if (window.CeyaWipe) window.CeyaWipe.go(a.href, e.clientX, e.clientY); else location.href = a.href;
  }, true));

  /* ---------- Cursor: a ring that becomes a label; magnetic buttons ---------- */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const cur = $("#cursor"), label = $("#cursor-label");
    const cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", e => { cx(e.clientX); cy(e.clientY); world().setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); });
    $$("[data-cursor]").forEach(el => { el.addEventListener("mouseenter", () => { label.textContent = el.dataset.cursor; cur.classList.add("is-label"); }); el.addEventListener("mouseleave", () => cur.classList.remove("is-label")); });
    $$(".cta, .btn-play, .top-menu, .hero-cue").forEach(el => {
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .4)" }), my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  } else {
    window.addEventListener("pointermove", e => world().setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  window.CeyaSite = { lenis, scrollTo };
})();
