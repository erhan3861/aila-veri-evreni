// AI-LA · veri evreni sayfası. Kaydırma tek bir ilerleme değerine (0-1) indirgenir, bu değer
// yumuşatılarak evreni (galaksi → ekosistem → beceri haritası) ve HTML katmanlarını sürer.
import { createUniverse, AREA_COLORS } from "./universe.js";
import { PRODUCTS, AREAS, FLOWS, STUDENTS } from "./data.js";
import { hexToOklch, oklchToHex, mixOklch } from "../oklch.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 4);
document.documentElement.classList.add("m-on");

/* =========================================================
   Okul adı ve rengi
   ========================================================= */
const PLACEHOLDER = "Okulunuz";
const nameInput = $("[data-name]");
const statusEl = $("[data-status]");

// Türkçe ilgi eki: "Demo Koleji'nin", "Fen Lisesi'nin", "Bilim Okulu'nun", "Kolej'in"
const genitive = (name) => {
  const s = name.trim().toLocaleLowerCase("tr");
  const vowels = "aıoueiöü";
  const last = [...s].reverse().find((ch) => vowels.includes(ch));
  if (!last) return "'in";
  const v = { a: "ı", ı: "ı", o: "u", u: "u", e: "i", i: "i", ö: "ü", ü: "ü" }[last];
  return "'" + (vowels.includes(s.at(-1)) ? "n" : "") + v + "n";
};
const slug = (s) => s.toLocaleLowerCase("tr")
  .replace(/[çğıöşü]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[ch])
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

let statusTimer;
const announce = (msg) => { clearTimeout(statusTimer); statusTimer = setTimeout(() => { statusEl.textContent = msg; }, 500); };

const applyName = () => {
  const raw = nameInput.value.trim();
  const name = raw || PLACEHOLDER;
  $("[data-suffix]").textContent = raw ? genitive(raw) : "un";
  $("[data-domain]").textContent = `ai.${slug(raw) || "okulunuz"}.k12.tr`;
  $$("[data-school]").forEach((el) => { el.textContent = name; });
  $$("[data-initial]").forEach((el) => { el.textContent = name.charAt(0).toLocaleUpperCase("tr"); });
  const mirror = $("[data-mirror]");
  mirror.textContent = raw || PLACEHOLDER;
  nameInput.style.width = `${Math.ceil(mirror.getBoundingClientRect().width) + 2}px`;
  return name;
};

const THEMES = {
  aila: { c: "#5049dc", c2: "#a6aefb", name: "AI-LA" },
  bordo: { c: "#b01e32", c2: "#f08a7e", name: "Bordo" },
  mavi: { c: "#345de0", c2: "#8fa6ff", name: "Mavi" },
  turkuaz: { c: "#008978", c2: "#5fd3c0", name: "Turkuaz" },
  mor: { c: "#914db8", c2: "#d99bf0", name: "Mor" },
  turuncu: { c: "#c9582b", c2: "#ffb27a", name: "Turuncu" },
};
let col = { c: hexToOklch(THEMES.aila.c), c2: hexToOklch(THEMES.aila.c2) };
let colorAnim = 0, uni = null;

const paintColors = () => {
  const [, C, H] = col.c;
  // evren zemini okulun tonunda: çok koyu, az doygun; her renkte aynı ağırlık
  const bg = oklchToHex([0.155, Math.min(C * 0.2, 0.04), H]);
  const c = oklchToHex(col.c), c2 = oklchToHex(col.c2);
  const st = document.documentElement.style;
  st.setProperty("--s", c); st.setProperty("--s2", c2); st.setProperty("--bg", bg);
  uni?.setSchool(c2);
};
const colorTo = (key, dur = 1200) => {
  cancelAnimationFrame(colorAnim);
  const to = { c: hexToOklch(THEMES[key].c), c2: hexToOklch(THEMES[key].c2) };
  if (reduce) { col = to; paintColors(); return; }
  const from = { ...col }, t0 = performance.now();
  const step = (now) => {
    const e = easeOut(clamp01((now - t0) / dur));
    col = { c: mixOklch(from.c, to.c, e), c2: mixOklch(from.c2, to.c2, e) };
    paintColors();
    if (e < 1) colorAnim = requestAnimationFrame(step);
  };
  colorAnim = requestAnimationFrame(step);
};

let userTook = false, typing = 0;
const takeOver = () => { userTook = true; clearInterval(typing); };
nameInput.addEventListener("input", () => { takeOver(); announce(`Önizleme: ${applyName()}`); });
nameInput.addEventListener("focus", takeOver);
$$('input[name="renk"]').forEach((r) => r.addEventListener("change", () => { colorTo(r.value); announce(`Önizleme: ${applyName()} · ${THEMES[r.value].name}`); }));

/* =========================================================
   Evren
   ========================================================= */
const universeEl = $("[data-universe]");
const sticky = $(".u-sticky");
const canvas = $("[data-canvas]");
const labelsEl = $("[data-labels]");
const phases = Object.fromEntries($$("[data-phase]").map((el) => [el.dataset.phase, el]));
const cards = $$("[data-card]");
const steps = $$(".u-steps [data-step]");
const cue = $("[data-cue]");
const narrowMQ = matchMedia("(max-width: 899px)");

try { uni = createUniverse(canvas, { mobile: narrowMQ.matches }); window.ailaUniverse = uni; /* gözden geçirme çekimleri için */ }
catch (err) { console.info("[evren] WebGL yok, statik görünüm:", err.message); }

const layoutFor = (w, h) => {
  const u = uni.unitsPerPx(h);
  const X = (px) => (px - w / 2) * u, Y = (py) => -(py - h / 2) * u;
  if (!narrowMQ.matches) {
    const prod = Math.min(w * 0.235, h * 0.37);
    return {
      gal: { x: X(w * 0.665), y: Y(h * 0.53), r: Math.min(h * 0.37, w * 0.25) * u, tilt: -1.02, roll: 0.55 },
      eco: { x: X(w * 0.5), y: Y(h * 0.6), rx: Math.min(w * 0.34, 540) * u, ry: h * 0.235 * u },
      graph: { x: X(w * 0.665), y: Y(h * 0.5), prod: prod * u, prodSquash: 0.9, hub: prod * 0.55 * u, leaf: prod * 0.22 * u },
    };
  }
  const prod = Math.min(w * 0.4, h * 0.26);
  return {
    gal: { x: X(w * 0.5), y: Y(h * 0.72), r: w * 0.48 * u, tilt: -1.0, roll: 0.4 },
    eco: { x: X(w * 0.5), y: Y(h * 0.6), rx: w * 0.31 * u, ry: h * 0.25 * u },
    graph: { x: X(w * 0.5), y: Y(h * 0.64), prod: prod * u, prodSquash: 1.05, hub: prod * 0.55 * u, leaf: prod * 0.2 * u },
  };
};

let W = 0, H = 0;
let copyRight = 0;
const resize = () => {
  W = sticky.clientWidth; H = sticky.clientHeight;
  const hc = $(".hero-copy").getBoundingClientRect();
  copyRight = hc.right;
  if (!uni) return;
  uni.size(W, H);
  uni.build(layoutFor(W, H));
};

/* ---------- 3B etiketleri ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); e.className = cls; if (html) e.innerHTML = html; labelsEl.appendChild(e); return e; };
const prodLabels = PRODUCTS.map((p) => el("div", `lbl lbl-prod${p.mono ? " mono" : ""}${p.tall ? " tall" : ""}`,
  `<span class="logo">${p.mark ? `<span class="tc"><img src="${p.logo}" alt="">${p.name}</span>` : `<img src="${p.logo}" alt="${p.name}">`}</span><p>${p.desc}</p>${p.plus ? '<span class="plus">+1</span>' : ""}`));
const coreLabel = el("div", "lbl lbl-core", `<span class="core-disc"><img src="assets/aila-mark.png" alt="" width="52" height="52"></span><small>Tek oturum</small>`);
const hubLabels = AREAS.map((a, i) => {
  const e = el("div", "lbl lbl-hub", `<span class="glyph ${a.shape}"></span><b>${a.short}</b><span class="val">0</span><span class="bar"><i></i></span><span class="gap">Gelişim alanı</span>`);
  e.style.setProperty("--c", AREA_COLORS[i]);
  return e;
});
const leafLabels = AREAS.flatMap((a, i) => a.skills.map((s, j) => ({ el: el("div", "lbl lbl-leaf", s), i, j })));
const centerLabel = el("div", "lbl lbl-center", `<strong data-cscore>0</strong><b data-cname></b>`);

let hoverArea = -1;
hubLabels.forEach((h, i) => {
  h.addEventListener("pointerenter", () => { hoverArea = i; });
  h.addEventListener("pointerleave", () => { hoverArea = -1; });
});
const place = (node, x, y, ax = 0.5, ay = 0.5) => {
  node.style.transform = `translate3d(${(x - node.offsetWidth * ax).toFixed(1)}px, ${(y - node.offsetHeight * ay).toFixed(1)}px, 0)`;
};
const show = (node, on) => node.classList.toggle("on", on);

/* =========================================================
   Öğrenci beceri haritası (simülasyon)
   ========================================================= */
let student = STUDENTS[0], scores = {}, bonus = 0, evIdx = 0, nextEvent = 0;
const studentsEl = $("[data-students]");
STUDENTS.forEach((s, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(i === 0));
  b.innerHTML = `<b>${s.name}</b><small>${s.grade}</small>`;
  b.addEventListener("click", () => setStudent(s));
  studentsEl.appendChild(b);
});
studentsEl.addEventListener("keydown", (e) => {
  const btns = $$("button", studentsEl), i = btns.indexOf(document.activeElement);
  const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  const n = btns[(to + btns.length) % btns.length];
  n.focus(); n.click();
});

const tweenNum = (node, to, dur = 700) => {
  const from = parseInt(node.textContent, 10) || 0;
  if (reduce || from === to) { node.textContent = to; return; }
  const t0 = performance.now();
  const step = (now) => { const e = easeOut(clamp01((now - t0) / dur)); node.textContent = Math.round(from + (to - from) * e); if (e < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
const weakest = () => AREAS.reduce((m, a) => (scores[a.id] < scores[m] ? a.id : m), AREAS[0].id);
const overall = () => Math.min(99, student.score + Math.round(bonus * 0.4));

const renderScores = () => {
  AREAS.forEach((a, i) => {
    const v = scores[a.id];
    tweenNum($(".val", hubLabels[i]), v);
    $(".bar i", hubLabels[i]).style.setProperty("--v", v);
    $(".gap", hubLabels[i]).style.display = a.id === weakest() ? "" : "none";
  });
  tweenNum($("[data-cscore]"), overall());
  $("[data-skill-table] tbody").innerHTML = AREAS.map((a) =>
    `<tr><td>${a.name}</td><td>${scores[a.id]}</td><td>${FLOWS.filter(([, x]) => x === a.id).map(([p]) => PRODUCTS.find((q) => q.id === p).name).join(", ")}</td></tr>`).join("");
};

function setStudent(s) {
  student = s; scores = { ...s.areas }; bonus = 0; evIdx = 0;
  $$("button", studentsEl).forEach((b, i) => b.setAttribute("aria-checked", String(STUDENTS[i] === s)));
  $("[data-cname]").textContent = s.name;
  $("[data-profile]").textContent = s.profiles.join(" · ");
  $("[data-advice]").textContent = s.advice[0];
  $("[data-feed]").innerHTML = "";
  renderScores();
  nextEvent = performance.now() + 900;
}

const feed = $("[data-feed]");
const runEvent = () => {
  const [pid, aid, inc, text] = student.events[evIdx++ % student.events.length];
  const pi = PRODUCTS.findIndex((p) => p.id === pid), ai = AREAS.findIndex((a) => a.id === aid);
  const area = AREAS[ai];
  const arrive = () => {
    scores[aid] = Math.min(99, scores[aid] + inc);
    bonus += inc;
    renderScores();
    hubLabels[ai].classList.remove("flash"); void hubLabels[ai].offsetWidth; hubLabels[ai].classList.add("flash");
    const li = document.createElement("li");
    li.innerHTML = `<span class="src">${PRODUCTS[pi].name}</span><span>${text}</span><b>+${inc} ${area.short}</b>`;
    feed.prepend(li);
    while (feed.children.length > 2) feed.lastChild.remove();
  };
  uni ? uni.pulse(pi, ai, arrive) : arrive();
};

/* =========================================================
   Kare döngüsü
   ========================================================= */
let target = 0, prog = reduce ? 0 : 0, spin = 0, last = performance.now(), raf = 0, uVisible = true;
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener("pointermove", (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
const readTarget = () => {
  const r = universeEl.getBoundingClientRect();
  target = clamp01(-r.top / (r.height - innerHeight));
};
let introT0 = 0, introCards = reduce ? 1 : 0;

const frame = (now) => {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  readTarget();
  // yumuşatılmış ilerleme: kaydırma bir yaya bağlı gibi takip edilir (scrub ~1 s)
  prog = reduce ? target : prog + (target - prog) * (1 - Math.exp(-dt * 4.2));
  if (Math.abs(target - prog) < 1e-4) prog = target;
  const p = prog;
  const e = seg(p, 0.12, 0.34), k = seg(p, 0.48, 0.7);
  pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
  pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
  if (!reduce) spin += dt * (1 - e * 0.85);
  if (introT0) introCards = easeOut(clamp01((now - introT0) / 900));

  // katmanlar
  const oHero = 1 - smooth(seg(p, 0.04, 0.15));
  const oEco = smooth(seg(p, 0.27, 0.36)) * (1 - smooth(seg(p, 0.45, 0.53)));
  const oGraph = smooth(seg(p, 0.64, 0.74)) * (1 - smooth(seg(target, 0.95, 1))); // çıkışta canlı akış kutusu sayfanın tepesinde kalmasın
  [["hero", oHero], ["eco", oEco], ["graph", oGraph]].forEach(([n, o]) => {
    const ph = phases[n];
    ph.style.opacity = o.toFixed(3);
    ph.classList.toggle("is-on", o > 0.02);
    ph.style.transform = `translate3d(0, ${((1 - o) * (n === "hero" ? -24 : 24)).toFixed(1)}px, 0)`;
  });
  cue.style.opacity = (1 - seg(p, 0, 0.05)).toFixed(3);
  sticky.style.setProperty("--exit", seg(target, 0.93, 1).toFixed(3));
  const stepOn = p < 0.24 ? 0 : p < 0.59 ? 1 : 2;
  if (target < 0.99) navLinks.forEach((a, i) => a.setAttribute("aria-current", String(stepOn > 0 && i === stepOn - 1)));
  steps.forEach((s, i) => { s.classList.toggle("on", i === stepOn); s.setAttribute("aria-current", String(i === stepOn)); });

  if (uni && uni.anchors) {
    uni.render(now / 1000, { e, k, spin, px: pointer.sx, py: pointer.sy });
    const A = uni.anchors;
    // rol kartları: eğik galaksi düzleminde yörünge; arkaya geçen sönükleşir
    const base = reduce ? 0.6 : now / 46000 * Math.PI * 2;
    cards.forEach((card, i) => {
      const a = base + (i * Math.PI * 2) / 3;
      const R = (narrowMQ.matches ? 0.74 : 1.12) * (0.35 + 0.65 * introCards); // dar ekranda kartlar kenardan taşmasın
      const wp = uni.galPoint(Math.cos(a) * R, Math.sin(a) * R);
      const s = uni.project(wp, W, H);
      const depth = Math.sin(a + 0.5);               // galaksi eğimine göre ön/arka
      const sc = (0.84 + 0.16 * (depth + 1) / 2) * (0.7 + 0.3 * introCards);
      // kart metne binmesin: masaüstünde metin sütununun sağında, dar ekranda ekranın içinde
      const half = card.offsetWidth / 2;
      const minX = narrowMQ.matches ? half + 8 : copyRight + half + 24;
      const x = Math.min(W - half - 8, Math.max(minX, s.x));
      card.style.transform = `translate3d(${(x - half).toFixed(1)}px, ${(s.y - card.offsetHeight / 2).toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
      // arkadaki kart saydamlaşınca griye dönüyordu: opak kalır, ışığı kısılır
      card.style.opacity = (introCards * oHero).toFixed(3);
      card.style.filter = `brightness(${(0.45 + 0.55 * (depth + 1) / 2).toFixed(3)})`;
      card.style.zIndex = depth > 0 ? 3 : 1;
    });

    // ürünler: ekosistemde tam etiket, grafikte yalnız logo
    const ke = smooth(clamp01((k - 0.15) / 0.75));
    labelsEl.classList.toggle("is-graph", k > 0.5);
    PRODUCTS.forEach((_, i) => {
      const P = A.prodE[i].clone().lerp(A.prodK[i], ke);
      const s = uni.project(P, W, H);
      place(prodLabels[i], s.x, s.y);
      show(prodLabels[i], e > 0.86 && (k < 0.02 || k > 0.8));
    });
    const cs = uni.project(A.coreE, W, H);
    place(coreLabel, cs.x, cs.y);
    show(coreLabel, e > 0.9 && k < 0.05);
    const graphOn = k > 0.9;
    const ctr = uni.project(A.center, W, H);
    // alan rozeti kendi kümesinin ortasında; kalabalık olmasın diye alt beceriler yalnız
    // üzerine gelinen alanda yazılır
    AREAS.forEach((_, i) => {
      const s = uni.project(A.hubs[i], W, H);
      place(hubLabels[i], s.x, s.y);
      show(hubLabels[i], graphOn);
    });
    place(centerLabel, ctr.x, ctr.y);
    show(centerLabel, graphOn);
    leafLabels.forEach(({ el: node, i, j }) => {
      const s = uni.project(A.leaves[i][j], W, H);
      const dx = s.x - ctr.x;
      place(node, s.x + (dx >= 0 ? 8 : -8), s.y + 10, dx >= 0 ? 0 : 1, 0);
      show(node, graphOn && hoverArea === i);
    });

    // canlı veri: grafik tam oturunca, birkaç saniyede bir olay
    if (graphOn && oGraph > 0.95 && !reduce && now > nextEvent) { runEvent(); nextEvent = now + 2600; }
  }
  loop();
};
const loop = () => { if (uVisible && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
new IntersectionObserver(([en]) => { uVisible = en.isIntersecting; if (uVisible) { last = performance.now(); loop(); } }).observe(universeEl);
document.addEventListener("visibilitychange", loop);
addEventListener("resize", () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
narrowMQ.addEventListener("change", () => location.reload()); // parçacık sayısı değişir

/* ---------- açılış ---------- */
const intro = () => {
  applyName();
  paintColors();
  if (reduce) { nameInput.value = "Demo Koleji"; applyName(); $('input[value="bordo"]').checked = true; colorTo("bordo"); return; }
  setTimeout(() => {
    if (userTook) { introT0 = performance.now(); return; }
    const text = "Demo Koleji";
    let i = 0;
    typing = setInterval(() => {
      nameInput.value = text.slice(0, ++i);
      applyName();
      if (i >= text.length) {
        clearInterval(typing);
        setTimeout(() => {
          if (!$('input[name="renk"]:checked')) { $('input[value="bordo"]').checked = true; colorTo("bordo"); }
          introT0 = performance.now();
        }, 300);
      }
    }, 70);
  }, 900);
};

/* =========================================================
   Alt bölümler: girişler, roller, adımlar, form, gezinme
   ========================================================= */
const nav = $("[data-nav]");
const navLinks = $$(".nav-links a");
const sectionIds = ["okul-sayfasi", "roller", "guvenlik", "sss"];
addEventListener("scroll", () => {
  const end = universeEl.offsetTop + universeEl.offsetHeight - 80;
  nav.classList.toggle("is-solid", scrollY > end);
}, { passive: true });
const navIO = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (!en.isIntersecting) return;
  navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${en.target.id}`)));
}), { rootMargin: "-45% 0px -50% 0px" });
sectionIds.map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => navIO.observe(s));

// girişler
const GROUPS = [[".section-head", ":scope > *"], [".split-head", ":scope > *"], [".faq-head", ":scope > *"], [".paths", "li"], [".crm", null], [".tabs", null], [".app-frame", null], [".safety", "li"], [".steps", "li"], [".faq", "details"], [".cta", null]];
if (!reduce) {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    $$("[data-reveal]", en.target).concat(en.target.matches("[data-reveal]") ? [en.target] : []).forEach((x) => x.classList.add("in"));
    if (en.target.matches(".steps")) en.target.style.setProperty("--fill", 1);
    io.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  GROUPS.forEach(([sel, item]) => $$(sel).forEach((root) => {
    (item ? $$(item, root) : [root]).forEach((x, i) => { x.dataset.reveal = ""; x.style.setProperty("--i", i); });
    if (root.matches(".steps")) root.style.setProperty("--fill", 0);
    io.observe(root);
  }));
}

// roller: WAI-ARIA sekmeleri + kayan zemin
const tabsEl = $("[data-tabs]");
if (tabsEl) {
  const tabs = $$('[role="tab"]', tabsEl);
  const ind = document.createElement("span"); ind.className = "tab-ind"; ind.setAttribute("aria-hidden", "true"); tabsEl.prepend(ind);
  const profile = $("[data-role-profile]");
  const moveInd = () => { const t = tabs.find((x) => x.getAttribute("aria-selected") === "true"); ind.style.width = `${t.offsetWidth}px`; ind.style.transform = `translateX(${t.offsetLeft}px)`; };
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on && profile) profile.textContent = panel.dataset.profile;
    });
    moveInd();
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab, false));
    tab.addEventListener("keydown", (e) => {
      const lastI = tabs.length - 1;
      const to = { ArrowRight: i === lastI ? 0 : i + 1, ArrowLeft: i === 0 ? lastI : i - 1, Home: 0, End: lastI }[e.key];
      if (to === undefined) return;
      e.preventDefault(); selectTab(tabs[to], true);
    });
  });
  addEventListener("resize", moveInd);
  (document.fonts?.ready || Promise.resolve()).then(moveInd);
}

// demo formu (index.html ile aynı alanlar ve mesajlar)
const dialog = $("[data-demo]"), form = $("[data-demo-form]");
const bodyEl = $("[data-form-body]"), done = $("[data-form-done]"), submitBtn = $("[data-submit]"), formError = $("[data-form-error]");
const MESSAGES = {
  ad: { valueMissing: "Adınızı ve soyadınızı yazın." },
  kurum: { valueMissing: "Kurumunuzun adını yazın." },
  eposta: { valueMissing: "Size ulaşabileceğimiz e-posta adresini yazın.", typeMismatch: "E-posta adresi eksik görünüyor; ornek@okul.k12.tr biçiminde yazın." },
  tel: { valueMissing: "Telefon numaranızı yazın.", patternMismatch: "Numarayı 05XX XXX XX XX biçiminde, 11 hane olarak yazın." },
  gorev: { valueMissing: "Görevinizi listeden seçin." },
  onay: { valueMissing: "Devam etmek için aydınlatma metnini onaylayın." },
};
const telOk = (v) => /^0?5\d{9}$/.test(v.replace(/[\s()-]/g, "").replace(/^\+?90/, "0"));
const validate = (f) => {
  const msgs = MESSAGES[f.name]; if (!msgs) return true;
  let key = null;
  if (f.validity.valueMissing) key = "valueMissing";
  else if (f.validity.typeMismatch) key = "typeMismatch";
  else if (f.name === "tel" && !telOk(f.value)) key = "patternMismatch";
  document.getElementById(`e-${f.name}`).textContent = key ? msgs[key] : "";
  if (f.type !== "checkbox") f.setAttribute("aria-invalid", String(Boolean(key)));
  return !key;
};
const resetForm = () => { form.reset(); $$(".err", form).forEach((x) => { x.textContent = ""; }); $$("[aria-invalid]", form).forEach((x) => x.removeAttribute("aria-invalid")); formError.textContent = ""; bodyEl.hidden = false; done.hidden = true; };
$$("[data-open-demo]").forEach((b) => b.addEventListener("click", () => {
  const typed = nameInput.value.trim();
  if (!done.hidden) resetForm();
  if (!form.elements.kurum.value && typed) form.elements.kurum.value = typed;
  dialog.showModal(); form.elements.ad.focus();
}));
dialog.addEventListener("click", (e) => {
  if (e.target.closest("[data-close-demo]")) { dialog.close(); return; }
  if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); }
});
let tried = false;
form.addEventListener("input", (e) => { if (tried) validate(e.target); });
form.addEventListener("change", (e) => { if (tried) validate(e.target); });
form.addEventListener("submit", async (e) => {
  e.preventDefault(); tried = true; formError.textContent = "";
  const fields = $$("input, select", form).filter((x) => MESSAGES[x.name]);
  const bad = fields[fields.map(validate).indexOf(false)];
  if (bad) { bad.focus(); return; }
  const data = Object.fromEntries(new FormData(form));
  submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Gönderiliyor';
  try {
    await new Promise((r) => setTimeout(r, 900)); // TODO: CRM / form endpoint'i (index.html'deki DEMO_ENDPOINT ile aynı)
    $("[data-done-kurum]").textContent = data.kurum;
    bodyEl.hidden = true; done.hidden = false; done.focus();
  } catch { formError.textContent = "Talebiniz gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin."; }
  finally { submitBtn.disabled = false; submitBtn.textContent = "Talebi Gönder"; }
});
$("[data-year]") && ($("[data-year]").textContent = new Date().getFullYear());

/* ---------- başlat ---------- */
(document.fonts?.ready || Promise.resolve()).then(() => {
  resize();
  setStudent(STUDENTS[0]);
  intro();
  readTarget(); prog = target;
  loop();
});
