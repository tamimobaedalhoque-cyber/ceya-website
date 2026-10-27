/* Ceya website, page changes. The eight rings deploy from the symbol in the top-left corner and cover the page,
   the next page loads under them, then they fold back into that same symbol to reveal it.
   Works on every page; the homepage keeps its own loader for the reveal. */
(() => {
  "use strict";
  const COLORS = ["#F7B32B", "#FA9C3D", "#FC864F", "#FF6F61", "#D7927B", "#B0B596", "#88D8B0", "#07161A"];
  const KEY = "ceya-wipe";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const css = document.createElement("style");
  css.textContent = ".wipe{position:fixed;inset:0;z-index:90;pointer-events:none}.wipe.is-on{pointer-events:auto}.wipe i{position:absolute;left:0;top:0;border-radius:50%;transform:scale(0);will-change:transform}html.wipe-in::after{content:'';position:fixed;inset:0;z-index:89;background:#07161A}html.wipe-in .top,html.is-wiping .top{z-index:95}html.wipe-in .top>:not(.top-logo),html.is-wiping .top>:not(.top-logo){visibility:hidden}";
  document.head.appendChild(css);
  const wrap = document.createElement("div"); wrap.className = "wipe"; wrap.setAttribute("aria-hidden", "true");
  const layers = COLORS.map(c => { const i = document.createElement("i"); i.style.background = c; wrap.appendChild(i); return i; });
  document.body.appendChild(wrap);
  // The symbol in the top bar is where the rings come from and where they return.
  const logoPoint = () => { const el = document.querySelector(".top-logo img"); if (!el) return [innerWidth / 2, innerHeight / 2]; const r = el.getBoundingClientRect(); return r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [innerWidth / 2, innerHeight / 2]; };
  // Big enough to cover the far corner from wherever the rings start.
  let ox = innerWidth / 2, oy = innerHeight / 2;
  const R = () => Math.ceil(Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy))) + 40;
  const sound = () => window.CeyaSound;
  const EASE = "cubic-bezier(.7, 0, .2, 1)";

  // Each ring is a disc the size of the screen's diagonal, centred on (x, y), scaled from nothing to full.
  function place(x, y) { ox = x; oy = y; const r = R(); layers.forEach(l => Object.assign(l.style, { width: `${2 * r}px`, height: `${2 * r}px`, left: `${x - r}px`, top: `${y - r}px` })); }
  function setAll(s, x, y) { place(x, y); layers.forEach(l => { l.getAnimations().forEach(a => a.cancel()); l.style.transform = `scale(${s})`; }); }

  // Close the rings over the page, outermost colour first, then call done.
  function cover(x, y, done) {
    wrap.classList.add("is-on"); root.classList.add("is-wiping");
    if (reduce) { setAll(1, x, y); done(); return; }
    setAll(0, x, y);
    const step = 55, dur = 760;
    layers.forEach((l, i) => l.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: dur, delay: i * step, easing: EASE, fill: "forwards" }));
    setTimeout(done, dur + (layers.length - 1) * step + 20);
  }
  // Start covered, then the rings close into the centre: ink first, Sun last, revealing the page.
  function reveal() {
    const [x, y] = logoPoint();
    setAll(1, x, y); wrap.classList.add("is-on"); root.classList.add("is-wiping"); root.classList.remove("wipe-in");
    if (sound() && sound().wipe) sound().wipe(-1);
    if (reduce) { setAll(0, x, y); wrap.classList.remove("is-on"); root.classList.remove("is-wiping"); return; }
    const step = 60, dur = 900, n = layers.length;
    layers.forEach((l, i) => l.animate([{ transform: "scale(1)" }, { transform: "scale(0)" }], { duration: dur, delay: (n - 1 - i) * step, easing: EASE, fill: "forwards" }));
    setTimeout(() => { setAll(0, x, y); wrap.classList.remove("is-on"); root.classList.remove("is-wiping"); }, dur + (n - 1) * step + 30);
  }

  let arriving = false;
  try { arriving = !!sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
  if (arriving) { if (document.getElementById("loader")) root.classList.remove("wipe-in"); else reveal(); }
  else root.classList.remove("wipe-in");

  // A page restored from the back/forward cache must not stay covered.
  window.addEventListener("pageshow", e => { if (e.persisted) { setAll(0, innerWidth / 2, innerHeight / 2); wrap.classList.remove("is-on"); root.classList.remove("wipe-in", "is-wiping"); } });

  function isPage(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    // Same page with only a hash change: let the page scroll instead.
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  }
  function go(href) {
    if (sound() && sound().wipe) sound().wipe(1);
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    const [x, y] = logoPoint();
    cover(x, y, () => { location.href = href; });
  }
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a");
    if (!isPage(a)) return;
    e.preventDefault();
    go(a.href);
  });
  window.CeyaWipe = { go, isPage };
})();
