// Kendini Tanı beceri haritası: veri evreni sayfasındaki grafiğin aynısı (universe.js), kaydırma olmadan doğrudan
// grafik durumunda. Platform darbeleri alt kırılımlara gider, karne ve puanlar canlı güncellenir. Simülasyon verisi.
import { createUniverse, AREA_COLORS } from "./universe-km.js";
import { PRODUCTS, AREAS, STUDENTS } from "./data-km.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function mountSkillMap({ stage, canvas, labels, karne, advice, scoreEl, student = STUDENTS[0] }) {
  let uni = null;
  try { uni = createUniverse(canvas, { mobile: innerWidth < 900 }); } catch (e) { stage.classList.add("no-gl"); }

  /* ---------- puanlar ---------- */
  const sub = Object.fromEntries(Object.entries(student.sub).map(([k, v]) => [k, [...v]]));
  const scores = {};
  const avg = (v) => Math.round(v.reduce((x, y) => x + y, 0) / v.length);
  const recompute = () => { AREAS.forEach((a) => { scores[a.id] = avg(sub[a.id]); }); };
  const weakest = () => AREAS.reduce((m, a) => (scores[a.id] < scores[m] ? a.id : m), AREAS[0].id);
  const overall = () => avg(AREAS.map((a) => scores[a.id]));
  recompute();
  advice.textContent = student.advice;

  const tweenNum = (node, to, dur = 700) => {
    const from = parseInt(node.textContent, 10) || 0;
    if (reduce || from === to) { node.textContent = to; return; }
    const t0 = performance.now();
    const step = (now) => { const e = easeOut(clamp01((now - t0) / dur)); node.textContent = Math.round(from + (to - from) * e); if (e < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- etiketler ---------- */
  const el = (cls, html) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; labels.appendChild(e); return e; };
  const prodLabels = PRODUCTS.map((p) => el(`lbl lbl-prod${p.mono ? " mono" : ""}`,
    `<span class="logo">${p.label ? `<span class="tc">${p.name}</span>` : p.mark ? `<span class="tc"><img src="${p.logo}" alt="">${p.name}</span>` : `<img src="${p.logo}" alt="${p.name}">`}</span>`));
  const hubLabels = AREAS.map((a, i) => {
    const e = el("lbl lbl-hub", `<span class="glyph ${a.shape}"></span><b>${a.short}</b><span class="val">0</span><span class="bar"><i></i></span>`);
    e.style.setProperty("--c", AREA_COLORS[i]);
    e.addEventListener("pointerenter", () => { hoverArea = i; });
    e.addEventListener("pointerleave", () => { hoverArea = -1; });
    e.addEventListener("click", () => selectArea(i));
    return e;
  });
  const leafLabels = AREAS.flatMap((a, i) => a.skills.map((s, j) => ({ el: el("lbl lbl-leaf", `${s} <b>0</b>`), i, j })));
  const centerLabel = el("lbl lbl-center", `<strong>0</strong><b>${student.name}</b>`);

  /* ---------- karne ---------- */
  karne.innerHTML = AREAS.map((a, i) => `<li role="option" tabindex="${i ? -1 : 0}" aria-selected="false" style="--c:${AREA_COLORS[i]}">
    <span class="k-name">${a.name}</span><span class="k-val">0</span><span class="k-bar"><i></i></span></li>`).join("");
  const rows = [...karne.querySelectorAll("li")];
  let hoverArea = -1, selArea = -1;
  function selectArea(i, focus) {
    selArea = i;
    rows.forEach((r, k) => { r.setAttribute("aria-selected", String(k === i)); r.tabIndex = k === i ? 0 : -1; });
    if (focus) rows[i].focus();
  }
  rows.forEach((r, i) => {
    r.addEventListener("click", () => selectArea(i));
    r.addEventListener("keydown", (e) => {
      const to = { ArrowDown: i + 1, ArrowUp: i - 1 }[e.key];
      if (to !== undefined) { e.preventDefault(); selectArea((to + AREAS.length) % AREAS.length, true); }
    });
  });

  const renderScores = () => {
    AREAS.forEach((a, i) => {
      const v = scores[a.id];
      tweenNum(rows[i].querySelector(".k-val"), v);
      rows[i].querySelector(".k-bar i").style.width = `${v}%`;
      rows[i].classList.toggle("weak", a.id === weakest());
      tweenNum(hubLabels[i].querySelector(".val"), v);
      hubLabels[i].style.setProperty("--v", v);
    });
    leafLabels.forEach(({ el: n, i, j }) => { n.querySelector("b").textContent = sub[AREAS[i].id][j]; });
    tweenNum(centerLabel.querySelector("strong"), overall());
    if (scoreEl) tweenNum(scoreEl, overall());
  };
  renderScores();
  selectArea(AREAS.findIndex((a) => a.id === weakest()));

  /* ---------- canlı veri: platformdan alt kırılıma darbe ---------- */
  let evIdx = 0, nextEvent = 0;
  const runEvent = () => {
    const [pid, aid, li, inc] = student.events[evIdx++ % student.events.length];
    const pi = PRODUCTS.findIndex((p) => p.id === pid), ai = AREAS.findIndex((a) => a.id === aid);
    const arrive = () => {
      sub[aid][li] = Math.min(99, sub[aid][li] + inc);
      recompute(); renderScores();
      hubLabels[ai].classList.remove("flash"); void hubLabels[ai].offsetWidth; hubLabels[ai].classList.add("flash");
    };
    uni ? uni.pulse(pi, ai, arrive, li) : arrive();
  };

  /* ---------- yerleşim ---------- */
  let W = 0, H = 0;
  const resize = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    if (!uni || !W || !H) return;
    uni.size(W, H);
    const u = uni.unitsPerPx(H);
    const prod = Math.min(W * 0.42, H * 0.44);
    uni.build({
      gal: { x: 0, y: 0, r: prod * u, tilt: -1.02, roll: 0.55 },
      eco: { x: 0, y: 0, rx: prod * u, ry: prod * 0.6 * u },
      graph: { x: 0, y: 0, prod: prod * u, prodSquash: 0.9, hub: prod * 0.55 * u, leaf: prod * 0.22 * u },
    });
  };
  new ResizeObserver(() => { clearTimeout(resize.t); resize.t = setTimeout(resize, 80); }).observe(stage);

  const place = (n, x, y, ax = 0.5, ay = 0.5) => { n.style.transform = `translate3d(${(x - n.offsetWidth * ax).toFixed(1)}px, ${(y - n.offsetHeight * ay).toFixed(1)}px, 0)`; };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  stage.addEventListener("pointermove", (e) => { const r = stage.getBoundingClientRect(); pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1; });

  let running = false, raf = 0, spin = 0, last = 0;
  const frame = (now) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    if (!reduce) spin += dt * 0.15;
    if (uni && uni.anchors && W) {
      uni.render(now / 1000, { e: 1, k: 1, spin, px: pointer.sx, py: pointer.sy });
      const A = uni.anchors;
      PRODUCTS.forEach((_, i) => { const s = uni.project(A.prodK[i], W, H); place(prodLabels[i], s.x, s.y); });
      AREAS.forEach((_, i) => { const s = uni.project(A.hubs[i], W, H); place(hubLabels[i], s.x, s.y); });
      const ctr = uni.project(A.center, W, H);
      place(centerLabel, ctr.x, ctr.y);
      const open = hoverArea >= 0 ? hoverArea : selArea;
      leafLabels.forEach(({ el: n, i, j }) => {
        const s = uni.project(A.leaves[i][j], W, H);
        const dx = s.x - ctr.x;
        place(n, s.x + (dx >= 0 ? 8 : -8), s.y + 10, dx >= 0 ? 0 : 1, 0);
        n.classList.toggle("on", open === i);
      });
      if (!reduce && now > nextEvent) { runEvent(); nextEvent = now + 2600; }
    }
    raf = requestAnimationFrame(frame);
  };
  [...prodLabels, ...hubLabels, centerLabel].forEach((n) => n.classList.add("on"));

  return {
    start() { if (running) return; running = true; resize(); last = performance.now(); nextEvent = last + 900; raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
}
