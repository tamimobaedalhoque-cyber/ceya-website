/* Ceya website, inner pages: a film (project.html?p=slug), the studio and the brief.
   Same viewfinder as the homepage: scrolling runs the timecode, the slate and the ring meter. */
(() => {
  "use strict";
  const E = window.CeyaEngine;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement, page = document.body.dataset.page;
  if (reduce) root.classList.add("reduce");
  gsap.registerPlugin(ScrollTrigger);
  const EASE = "power3.out";
  const SPECTRUM = ["#F7B32B", "#F7B32B", "#FA9C3D", "#FC864F", "#FF6F61", "#D7927B", "#B0B596", "#88D8B0"];
  const S = window.CeyaSound || { on: false, wanted: false, toggle() {}, enable() {}, ui() {}, layer() {}, instrument() {}, phrase() { return 0; }, sonic() {}, onNote() {} };
  const pad = n => String(n).padStart(2, "0");
  const fmtTC = f => `${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
  const svgEl = (tag, attrs = {}) => { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  // The real symbol (engine.js): ringD is a ring's true centre line, W its true weight, FILL its exact shape.
  const ringD = i => E.markLine(i), W = i => E.MARK.w[i], FILL = i => E.MARK.fill[i];
  // Arabic pages read right to left and carry their own words; tr() picks the right one.
  const AR = root.lang === "ar", RTL = root.dir === "rtl";
  const tr = (en, ar) => (AR ? ar : en);
  const pick = f => (AR && f.ar ? { ...f, ...f.ar } : f);

  /* ---------- Build the film page from the reel before anything measures the layout ---------- */
  const REEL = window.CeyaReel || [];
  let film = null;
  if (page === "project" && REEL.length) {
    // Built film pages carry their slug; the title and words are already in the HTML for search engines.
    const baked = document.body.dataset.film, slug = baked || new URLSearchParams(location.search).get("p");
    const idx = Math.max(0, REEL.findIndex(f => f.slug === slug));
    film = pick(REEL[idx]);
    const next = pick(REEL[(idx + 1) % REEL.length]);
    if (!baked) document.title = `${film.title} | ${tr("Ceya", "Ceya")}`;
    root.style.setProperty("--fa", film.a); root.style.setProperty("--fb", film.b);
    $("#p-reel").textContent = tr(`Reel ${pad(idx + 1)} of ${pad(REEL.length)}, ${film.format.toLowerCase()}`, `البكرة ${pad(idx + 1)} من ${pad(REEL.length)}، ${film.format}`);
    const t = $("#p-title"); t.textContent = "";
    // Break long titles over two lines at the middle word.
    const words = film.title.split(" "), cut = words.length > 2 ? Math.ceil(words.length / 2) : words.length;
    [words.slice(0, cut).join(" "), words.slice(cut).join(" ")].filter(Boolean).forEach(l => { const s = document.createElement("span"); s.className = "line"; s.dataset.split = ""; s.textContent = l; t.appendChild(s); });
    $("#p-facts").innerHTML = [[tr("Client", "العميل"), film.client], [tr("Format", "النوع"), film.format], [tr("Year", "السنة"), film.year], [tr("Runtime", "المدة"), film.runtime]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    // The picture: the film's two colours with its pattern.
    const art = $("#p-frame-art"), s = svgEl("svg", { viewBox: "0 0 1000 1000", preserveAspectRatio: "xMidYMid slice" });
    E.draw(s, film.pat); art.appendChild(s);
    $("#p-log").textContent = film.logline; $("#p-log").dataset.words = "";
    // Layers: Concept, Story, Image, Sound, each tied to its ring.
    const LAYERS = [[tr("Concept", "الفكرة"), 0, "#F7B32B"], [tr("Story", "القصة"), 3, "#FC864F"], [tr("Image", "الصورة"), 4, "#FF6F61"], [tr("Sound", "الصوت"), 7, "#88D8B0"]];
    const rings = $("#p-rings");
    for (let i = 0; i < 8; i++) rings.appendChild(svgEl("path", { d: FILL(i), fill: SPECTRUM[i], class: "pr", "data-i": i }));
    $("#p-layers-index").innerHTML = LAYERS.map(([n, , c]) => `<li style="--c:${c}">${n}</li>`).join("");
    $("#p-layers-body").innerHTML = LAYERS.map(([n, , c], i) => `<article class="pl" style="--c:${c}"><span class="pl-no">${tr("Layer", "الطبقة")} ${pad(i + 1)}</span><h3>${n}</h3><p>${film.layers[i]}</p></article>`).join("");
    // Stills: variations of the film's pattern, numbered like frames.
    const track = $("#p-stills-track");
    film.stills.forEach((o, i) => {
      const f = document.createElement("figure"); f.className = "still";
      const mix = i % 2 ? `linear-gradient(200deg, ${film.b}, ${film.a})` : `linear-gradient(135deg, ${film.a}, ${film.b})`;
      f.innerHTML = `<span class="still-img" style="background:${mix}"></span><figcaption><b>${tr("Frame", "لقطة")} ${String(1200 + i * 317).padStart(5, "0")}</b><i>${(AR ? ["واسعة", "قريبة", "تفصيلية", "من فوق الكتف", "اللقطة الأخيرة"] : ["Wide", "Close", "Insert", "Over the shoulder", "Final frame"])[i] || tr("Frame", "لقطة")}</i></figcaption>`;
      const sv = svgEl("svg", { viewBox: "0 0 1000 1000", preserveAspectRatio: "xMidYMid slice" });
      E.draw(sv, Object.assign({ mode: "mono", color: "rgba(255,255,255,.4)" }, o)); f.firstChild.appendChild(sv); track.appendChild(f);
    });
    // The motif as bars: height follows the note.
    $("#p-notes").innerHTML = film.motif.map((n, k) => n == null ? `<li class="rest" aria-label="Rest"></li>` : `<li style="--h:${0.3 + n * 0.1};--c:${SPECTRUM[n]}" data-n="${n}" data-k="${k}"><span></span></li>`).join("");
    $("#p-results").innerHTML = film.results.map(([v, l]) => `<li><b>${v}</b><span>${l}</span></li>`).join("");
    $("#p-credits").innerHTML = film.credits.map(([r, n]) => `<div><dt>${r}</dt><dd>${n}</dd></div>`).join("") + `<div><dt>${tr("Client", "العميل")}</dt><dd>${film.client}</dd></div><div><dt>${tr("Made by", "إنتاج")}</dt><dd>${tr("Ceya Creative House", "Ceya Creative House")}</dd></div>`;
    $("#p-next-link").href = baked ? `${next.slug}.html` : `work/${next.slug}.html`;
    $("#p-next-title").textContent = next.title;
    $("#p-next-meta").textContent = `${next.format}${tr(", ", "، ")}${next.year}`;
    $("#p-next").style.setProperty("--na", next.a); $("#p-next").style.setProperty("--nb", next.b);
    const nr = $("#p-next-ring");
    nr.appendChild(svgEl("path", { d: FILL(0), fill: "rgba(255,255,255,.12)" }));
    nr.appendChild(svgEl("path", { d: ringD(0), fill: "none", stroke: next.a, "stroke-width": W(0), "stroke-linecap": "round", id: "p-next-draw", pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1 }));
  }

  /* ---------- Split text ---------- */
  function splitChars(el) {
    const text = el.textContent; el.textContent = ""; el.setAttribute("aria-label", text);
    text.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { el.append(" "); return; }
      const w = document.createElement("span"); w.className = "wd"; w.setAttribute("aria-hidden", "true"); w.style.whiteSpace = "nowrap";
      // Arabic letters join, so Arabic is animated word by word instead of letter by letter.
      (AR ? [part] : [...part]).forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; w.appendChild(s); });
      el.appendChild(w);
    });
    return $$(".ch", el);
  }
  function splitWords(el) {
    const text = el.textContent; el.textContent = ""; el.setAttribute("aria-label", text);
    return text.split(/\s+/).filter(Boolean).map((w, i, a) => { const s = document.createElement("span"); s.className = "wd"; s.setAttribute("aria-hidden", "true"); s.textContent = w; el.appendChild(s); if (i < a.length - 1) el.append(" "); return s; });
  }
  const titleChars = $$(".p-title [data-split]").flatMap(splitChars);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = target => { const el = typeof target === "string" ? $(target) : target; if (!el) return; if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) }); else el.scrollIntoView(); };
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => { const id = a.getAttribute("href"); if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); } }));

  /* ---------- Sound ---------- */
  const soundBtn = $("#sound");
  const setSoundLabel = () => { soundBtn.setAttribute("aria-pressed", String(S.on)); soundBtn.lastChild.textContent = S.on ? tr("Sound on", "الصوت يعمل") : tr("Sound off", "الصوت مغلق"); };
  soundBtn.addEventListener("click", () => { S.toggle(); setSoundLabel(); });
  if (S.wanted) { const resume = () => { if (!S.on) { S.enable(); setSoundLabel(); } window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); }; window.addEventListener("pointerdown", resume); window.addEventListener("keydown", resume); }
  const pos = el => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2) / innerWidth, y: 1 - (r.top + r.height / 2) / innerHeight }; };
  $$("a, button, .chip").forEach(el => {
    el.addEventListener("mouseenter", () => { const p = pos(el); S.ui("hover", p.y * 0.7 + p.x * 0.3, p.x); });
    if (el !== soundBtn) el.addEventListener("click", () => { const p = pos(el); S.ui("click", p.y * 0.7 + p.x * 0.3, p.x); });
  });

  /* ---------- Stars: the same dust the camera flies through on the homepage ---------- */
  const stars = $("#stars");
  if (stars) {
    const g = stars.getContext("2d"); let W = 0, H = 0, dpr = 1, pts = [], vel = 0, last = 0;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; stars.width = W * dpr; stars.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    const N = reduce ? 160 : 420;
    for (let i = 0; i < N; i++) pts.push({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, c: SPECTRUM[(Math.random() * 8) | 0] });
    let sy = 0;
    const drawStars = now => {
      const y = window.scrollY, d = y - sy; sy = y; vel += (d - vel) * 0.2;
      g.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.y -= (d * p.z * 0.25) / H; p.y = ((p.y % 1) + 1) % 1;
        const r = 0.5 + p.z * 1.1, stretch = Math.min(9, Math.abs(vel) * p.z * 0.2);
        g.globalAlpha = 0.25 + p.z * 0.45; g.fillStyle = p.c;
        g.fillRect(p.x * W - r / 2, p.y * H - r / 2 - (vel > 0 ? 0 : stretch), r, r + stretch);
      }
      if (!reduce) requestAnimationFrame(drawStars);
    };
    requestAnimationFrame(drawStars);
  }

  /* ---------- HUD: timecode, slate and meter follow the page ---------- */
  const hudTC = $("#hud-tc"), meter = $$("#hud-meter li"), sceneNo = $("#hud-scene-no"), sceneName = $("#hud-scene-name");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => { hudTC.textContent = fmtTC(Math.round(self.progress * 96 * 24)); const lit = Math.round(self.progress * 8); meter.forEach((m, i) => m.classList.toggle("on", i < lit)); },
  });
  $$("[data-scene]").forEach(sec => ScrollTrigger.create({
    trigger: sec, start: "top 55%", end: "bottom 55%",
    onToggle: self => { if (!self.isActive) return; S.ui("slate"); sceneNo.textContent = sec.dataset.scene; sceneName.textContent = sec.dataset.name; gsap.fromTo(".hud-scene", { opacity: 0.2 }, { opacity: 1, duration: 0.6 }); },
  }));

  /* ---------- Entrances: the title rises once; long statements light word by word as you read ---------- */
  if (!reduce) {
    gsap.from(titleChars, { yPercent: 110, duration: 1.1, stagger: 0.022, ease: "power4.out", delay: 0.35 });
    gsap.from(".p-reel, .p-facts > div, .s-sub", { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: EASE, delay: 0.7 });
  }
  $$("[data-words]").forEach(el => {
    const w = splitWords(el);
    if (reduce) { w.forEach(x => (x.style.opacity = 1)); return; }
    gsap.to(w, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  });

  // Principles light one by one as each line reaches the reading line.
  $$(".manifesto li").forEach(li => { if (reduce) { li.style.opacity = 1; return; } gsap.fromTo(li, { opacity: 0.12, scale: 0.96 }, { opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: li, start: "top 80%", end: "top 45%", scrub: true } }); });

  /* ---------- Film page ---------- */
  if (film) {
    // The picture opens like a lens: from a framed shot to the full screen, its timecode running.
    const frame = $("#p-frame"), frameTC = $("#p-frame-tc");
    if (!reduce) {
      gsap.fromTo(frame, { clipPath: "inset(14% 12% 14% 12% round 6px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: "#p-screen", start: "top top", end: "+=70%", scrub: true } });
      gsap.fromTo("#p-frame-art svg", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#p-screen", start: "top bottom", end: "bottom top", scrub: true } });
    }
    ScrollTrigger.create({ trigger: "#p-screen", start: "top bottom", end: "bottom top", onUpdate: self => { frameTC.textContent = fmtTC(Math.round(self.progress * 40 * 24)); } });

    // Playing the picture plays the motif; the frame breathes on every note.
    const notes = $$("#p-notes li"), playBtn = $("#p-score-play");
    let playing = false;
    function playMotif() {
      if (playing) return; playing = true; frame.classList.add("is-playing"); playBtn.classList.add("is-playing");
      S.phrase(film.motif, 0.26, k => {
        notes.forEach(n => n.classList.toggle("on", +n.dataset.k === k));
        if (k >= 0) gsap.fromTo("#p-frame-art svg", { scale: 1.04 }, { scale: 1, duration: 0.5, ease: "power2.out" });
        if (k < 0) { playing = false; frame.classList.remove("is-playing"); playBtn.classList.remove("is-playing"); notes.forEach(n => n.classList.remove("on")); }
      });
    }
    frame.addEventListener("click", playMotif); playBtn.addEventListener("click", playMotif);
    notes.forEach(n => { if (n.dataset.n == null) return; n.addEventListener("pointerenter", e => { S.instrument(+n.dataset.n, e.clientX / innerWidth); n.classList.add("on"); setTimeout(() => n.classList.remove("on"), 260); }); });

    // Layers: the matching ring lights as each one reaches the middle of the screen.
    const marks = $$("#p-layers-index li"), RING_OF = [0, 3, 4, 7], paths = $$("#p-rings .pr");
    const lightLayer = i => {
      marks.forEach((m, k) => m.classList.toggle("on", k === i));
      paths.forEach(p => p.classList.toggle("lit", +p.dataset.i <= RING_OF[i]));
    };
    $$(".pl").forEach((el, i) => ScrollTrigger.create({ trigger: el, start: "top 60%", end: "bottom 40%", onToggle: self => { if (self.isActive) { lightLayer(i); el.classList.add("on"); S.layer(i); } else el.classList.remove("on"); } }));
    marks.forEach((m, i) => m.addEventListener("click", () => scrollTo($$(".pl")[i])));

    // Stills: vertical scroll runs the strip sideways.
    const track = $("#p-stills-track"), stillsSec = $("#p-stills");
    if (!reduce && innerWidth > 700) {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth + 120);
      const fit = () => { stillsSec.style.height = `calc(100vh + ${dist()}px)`; };
      fit(); ScrollTrigger.addEventListener("refreshInit", fit);
      gsap.to(track, { x: () => (RTL ? dist() : -dist()), ease: "none", scrollTrigger: { trigger: stillsSec, start: "top top", end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } });
    }

    // Next reel: its ring draws as you approach; reaching the end of the page fills it.
    const draw = $("#p-next-draw");
    ScrollTrigger.create({ trigger: "#p-next", start: "top 90%", end: "bottom bottom", scrub: true, onUpdate: self => draw.setAttribute("stroke-dashoffset", String(1 - self.progress)) });
  }

  /* ---------- Studio: live clocks for both cities ---------- */
  if (page === "studio") {
    const cities = $$(".s-city").map(el => ({ el, tz: el.dataset.tz, time: $(".s-time", el), state: $(".s-state", el) }));
    const tick = () => {
      const d = new Date();
      cities.forEach(c => {
        const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hour12: false }).formatToParts(d).map(p => [p.type, p.value]));
        c.time.textContent = `${parts.hour}:${parts.minute}:${parts.second}`;
        // Riyadh works Sunday to Thursday; Dubai works Monday to Friday.
        const days = (c.el.dataset.days || "Sun Mon Tue Wed Thu").split(" ");
        const h = +parts.hour, workday = days.includes(parts.weekday), open = workday && h >= 9 && h < 18;
        c.state.textContent = open ? tr("In the studio now", "في الاستوديو الآن") : workday && h < 9 ? tr("Opens at 9, we reply today", "نفتح في التاسعة، ونرد اليوم") : tr("Closed, we reply on the next working day", "مغلق الآن، ونرد في يوم العمل التالي");
        c.el.classList.toggle("is-open", open);
      });
    };
    tick(); setInterval(tick, 1000);
    $$(".s-glyph").forEach(sv => { const i = +sv.dataset.ring; for (let k = 0; k <= 7; k++) sv.appendChild(svgEl("path", { d: FILL(k), fill: k === i ? "currentColor" : "rgba(255,255,255,.22)" })); });
    $$(".s-crew-list li").forEach((li, i) => li.addEventListener("mouseenter", () => S.instrument(i, pos(li).x)));
  }

  /* ---------- Brief: every answered question closes another ring ---------- */
  if (page === "contact") {
    const form = $("#brief"), svg = $("#brief-rings"), count = $("#brief-count"), status = $("#brief-status");
    const paths = Array.from({ length: 8 }, (_, i) => { const p = svgEl("path", { d: ringD(i), fill: "none", stroke: SPECTRUM[i], "stroke-width": W(i), "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1 }); svg.appendChild(svgEl("path", { d: FILL(i), fill: "rgba(255,255,255,.12)" })); svg.appendChild(p); return p; });
    const qs = $$(".q", form);
    const answered = q => { const i = +q.dataset.q; if (i <= 3) return !!$("input:checked", q); if (i === 4) return !!form.name.value.trim() && /\S+@\S+\.\S+/.test(form.email.value); return form.idea.value.trim().length > 8; };
    let lastLit = 0;
    const update = () => {
      const done = qs.filter(answered).length, lit = Math.round((done / qs.length) * 8);
      qs.forEach(q => q.classList.toggle("done", answered(q)));
      paths.forEach((p, i) => gsap.to(p, { attr: { "stroke-dashoffset": i < lit ? 0 : 1 }, duration: reduce ? 0 : 0.9, ease: "power3.inOut", delay: reduce ? 0 : Math.max(0, i - lastLit) * 0.06, overwrite: true }));
      if (lit > lastLit) for (let i = lastLit; i < lit; i++) setTimeout(() => S.instrument(i, 0.75), (i - lastLit) * 90);
      lastLit = lit;
      count.textContent = tr(`${done} of ${qs.length} answered`, `أُجيب عن ${done} من ${qs.length}`);
    };
    form.addEventListener("input", update); form.addEventListener("change", update); update();
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!form.name.value.trim() || !/\S+@\S+\.\S+/.test(form.email.value)) {
        status.textContent = tr("Add your name and a working email in question 5, so we can reply.", "أضف اسمك وبريدًا إلكترونيًا صحيحًا في السؤال 5 لنتمكن من الرد."); status.className = "brief-status is-error";
        scrollTo(qs[4]); setTimeout(() => (form.name.value.trim() ? form.email : form.name).focus(), 900); return;
      }
      const list = n => $$(`input[name="${n}"]:checked`, form).map(i => i.value).join(tr(", ", "، ")) || tr("Not said yet", "لم يُحدَّد بعد");
      const name = form.name.value.trim(), company = form.company.value.trim(), idea = form.idea.value.trim();
      const body = (AR
        ? [`الاسم: ${name}`, `الشركة: ${company || "لم تُذكر"}`, `البريد: ${form.email.value.trim()}`, "", `ماذا سنصنع: ${list("make")}`, `أين سيُعرض: ${list("where")}`, `الموعد: ${list("when")}`, `الميزانية: ${list("budget")}`, "", "الفكرة:", idea || "سنخبركم في مكالمة."]
        : [`Name: ${name}`, `Company: ${company || "Not said"}`, `Email: ${form.email.value.trim()}`, "", `What we are making: ${list("make")}`, `Where it will play: ${list("where")}`, `When: ${list("when")}`, `Budget: ${list("budget")}`, "", "The idea:", idea || "We will tell you on a call."]).join("\n");
      S.sonic(true);
      location.href = `mailto:hello@ceya.studio?subject=${encodeURIComponent(tr(`New brief from ${name}`, `موجز جديد من ${name}`))}&body=${encodeURIComponent(body)}`;
      status.textContent = tr("Your email app has opened with the brief filled in. Send it from there and we will reply within a day.", "فُتح تطبيق البريد والموجز جاهز فيه. أرسله من هناك وسنرد خلال يوم."); status.className = "brief-status is-sent";
    });
  }

  /* ---------- Menu opens like an iris from the button ---------- */
  const menu = $("#menu"), openBtn = $("#menu-open"), closeBtn = $("#menu-close");
  const centre = () => { const r = openBtn.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function openMenu() {
    S.ui("open"); const [x, y] = centre();
    menu.hidden = false; openBtn.setAttribute("aria-expanded", "true"); if (lenis) lenis.stop();
    gsap.fromTo(menu, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(150% at ${x}px ${y}px)`, duration: reduce ? 0.01 : 0.9, ease: "power4.inOut" });
    gsap.from(".menu-list li", { yPercent: 60, opacity: 0, stagger: 0.06, duration: 0.8, delay: 0.25, ease: EASE });
    closeBtn.focus();
  }
  function closeMenu(then) {
    S.ui("close"); const [x, y] = centre();
    gsap.to(menu, { clipPath: `circle(0px at ${x}px ${y}px)`, duration: reduce ? 0.01 : 0.7, ease: "power4.inOut", onComplete: () => { menu.hidden = true; openBtn.setAttribute("aria-expanded", "false"); if (lenis) lenis.start(); openBtn.focus(); if (then) then(); } });
  }
  openBtn.addEventListener("click", openMenu); closeBtn.addEventListener("click", () => closeMenu());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) closeMenu(); });
  // From the menu the rings close straight over the open menu, then the next page opens.
  $$(".menu-list a").forEach(a => a.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); if (window.CeyaWipe) window.CeyaWipe.go(a.href, e.clientX, e.clientY); else location.href = a.href; }, true));

  /* ---------- Cursor ---------- */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const cur = $("#cursor"), label = $("#cursor-label");
    const cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("pointermove", e => { cx(e.clientX); cy(e.clientY); });
    $$("[data-cursor]").forEach(el => { el.addEventListener("mouseenter", () => { label.textContent = el.dataset.cursor; cur.classList.add("is-label"); }); el.addEventListener("mouseleave", () => cur.classList.remove("is-label")); });
    $$(".cta, .btn-play, .top-menu").forEach(el => {
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .4)" }), my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  window.CeyaSite = { lenis, scrollTo };
})();
