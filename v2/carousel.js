// Ekosistem karuseli: her üründen bir kare. index.html ve veri evreni sayfası aynı bileşeni kullanır;
// sayfada <div data-carousel></div> (açık zemin için data-carousel="light") yeterli.
// Desen: WAI-ARIA sekmeli karusel — otomatik geçiş, duraklat düğmesi, imleç/odakta durma, ok tuşları, kaydırma.
const SLIDES = [
  { id: "talent14", img: "assets/carousel/talent14.jpg", alt: "Talent14: tablette AI Galaxy lise patikası", logo: "assets/talent14.png", name: "Talent14", text: "Dijital beceri ve teknoloji eğitimi" },
  { id: "codemino", img: "assets/carousel/codemino.jpg", alt: "Codemino: blok kodlamayla oyun içinde görev", logo: "assets/codemino-logo.png", name: "Codemino", text: "Oyun içinde blok kodlama" },
  { id: "okumino", img: "assets/carousel/okumino.jpg", alt: "Okumino: hızlı okuma egzersizi ve okuma hızı göstergesi", logo: "assets/okumino-logo.png", name: "Okumino", text: "Hızlı okuma ve anlama" },
  { id: "aigalaxy", img: "assets/carousel/ai-galaxy.jpg", alt: "AI-GALAXY: yapay zekâ üretim stüdyosu ve öğrenci çalışmaları", logo: "assets/ai-galaxy.png", mono: true, name: "AI-GALAXY", short: "Galaxy", text: "Yapay zekâ okuryazarlığı" },
  { id: "talentcup", img: "assets/carousel/talentcup.jpg", alt: "Talent Cup: görev patikası ve kupa", logo: "assets/talentcup-mark.png", tc: true, name: "Talent Cup", short: "Cup", text: "Öğrenci yarışmaları ve projeler" },
  // kurumun kullandığı içerik platformu hangisiyse o bağlanır; bu yüzden markasız, yazıyla
  { id: "icerik", img: "assets/carousel/icerik.jpg", alt: "Dijital içerik platformu: fotosentez dersi ve ara soru", label: "Dijital İçerik Platformu", name: "Dijital İçerik Platformu", short: "İçerik", text: "Kurumunuzun içerik platformu" },
];
const DUR = 4500;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ICON = {
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
};

let uid = 0;
export function mountCarousel(root) {
  const id = `pc${++uid}`;
  root.classList.add("pc");
  if (root.dataset.carousel === "light") root.classList.add("pc-light");
  root.setAttribute("role", "region");
  root.setAttribute("aria-roledescription", "karusel");
  root.setAttribute("aria-label", root.getAttribute("aria-label") || "Ekosistemden kareler");
  const cap = (s) => (s.label ? `<span class="pc-tc">${s.label}</span>` : s.tc ? `<span class="pc-tc"><img src="${s.logo}" alt="">TALENT CUP</span>` : `<img class="pc-logo${s.mono ? " mono" : ""}" src="${s.logo}" alt="${s.name}">`)
    + `<span>${s.text}</span>`;
  root.innerHTML = `
    <div class="pc-stage" aria-live="off">
      ${SLIDES.map((s, i) => `<figure class="pc-slide" id="${id}-s${i}" role="tabpanel" aria-roledescription="kare" aria-label="${i + 1} / ${SLIDES.length}: ${s.name}" data-pos="hidden">
        <img class="pc-img" src="${s.img}" alt="${s.alt}" width="1200" height="750" ${i < 3 ? "" : 'loading="lazy"'} decoding="async"><figcaption>${cap(s)}</figcaption></figure>`).join("")}
    </div>
    <div class="pc-ctrl">
      <button type="button" class="pc-btn" data-prev aria-label="Önceki kare">${ICON.prev}</button>
      <div class="pc-tabs" role="tablist" aria-label="Ürün seçin">
        ${SLIDES.map((s, i) => `<button type="button" class="pc-tab" role="tab" id="${id}-t${i}" aria-controls="${id}-s${i}" aria-selected="false" tabindex="-1" aria-label="${s.name}">${s.short || s.name}</button>`).join("")}
      </div>
      <button type="button" class="pc-btn" data-next aria-label="Sonraki kare">${ICON.next}</button>
      <button type="button" class="pc-btn" data-pause aria-pressed="false" aria-label="Otomatik geçişi durdur">${ICON.pause}</button>
    </div>`;
  const stage = root.querySelector(".pc-stage");
  const slides = [...root.querySelectorAll(".pc-slide")];
  const tabs = [...root.querySelectorAll(".pc-tab")];
  const pauseBtn = root.querySelector("[data-pause]");
  slides.forEach((s, i) => s.setAttribute("aria-labelledby", `${id}-t${i}`));
  const n = SLIDES.length;
  let cur = 0, t0 = performance.now(), paused = reduce, hover = false, visible = true, raf = 0;

  const show = (i, focusTab = false) => {
    const prev = cur;
    cur = (i + n) % n;
    slides.forEach((s, k) => {
      const pos = (k - cur + n) % n;
      s.dataset.pos = k === prev && k !== cur ? "out" : pos <= 2 ? String(pos) : "hidden";
      s.setAttribute("aria-hidden", String(k !== cur));
      s.inert = k !== cur;
    });
    // "out" bir an sürer, sonra destenin sonuna gider
    setTimeout(() => { if (slides[prev].dataset.pos === "out") slides[prev].dataset.pos = "hidden"; }, 820);
    tabs.forEach((t, k) => { const on = k === cur; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; t.style.setProperty("--p", 0); });
    if (focusTab) tabs[cur].focus();
    t0 = performance.now();
  };
  const setPaused = (v) => {
    paused = v;
    pauseBtn.setAttribute("aria-pressed", String(v));
    pauseBtn.setAttribute("aria-label", v ? "Otomatik geçişi başlat" : "Otomatik geçişi durdur");
    pauseBtn.innerHTML = v ? ICON.play : ICON.pause;
    stage.setAttribute("aria-live", v ? "polite" : "off"); // otomatik dönerken ekran okuyucuyu bölme
    t0 = performance.now() - (parseFloat(tabs[cur].style.getPropertyValue("--p")) || 0) * DUR;
    loop();
  };

  const tick = (now) => {
    raf = 0;
    if (paused || hover || !visible || document.hidden) return;
    const p = Math.min(1, (now - t0) / DUR);
    tabs[cur].style.setProperty("--p", p.toFixed(3));
    if (p >= 1) show(cur + 1);
    loop();
  };
  const loop = () => { if (!raf && !paused && !hover && visible && !document.hidden) raf = requestAnimationFrame(tick); };
  const hold = (v) => { if (hover === v) return; hover = v; if (!v) { t0 = performance.now() - (parseFloat(tabs[cur].style.getPropertyValue("--p")) || 0) * DUR; loop(); } };

  root.querySelector("[data-prev]").addEventListener("click", () => show(cur - 1));
  root.querySelector("[data-next]").addEventListener("click", () => show(cur + 1));
  pauseBtn.addEventListener("click", () => setPaused(!paused));
  tabs.forEach((t, k) => {
    t.addEventListener("click", () => show(k));
    t.addEventListener("keydown", (e) => {
      const to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault(); show(to, true);
    });
  });
  root.addEventListener("pointerenter", () => hold(true));
  root.addEventListener("pointerleave", () => hold(false));
  root.addEventListener("focusin", () => hold(true));
  root.addEventListener("focusout", () => setTimeout(() => hold(root.contains(document.activeElement)), 0));
  // kaydırma: 40 px'ten uzun yatay çekiş bir kare ilerletir
  let sx = null;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  stage.addEventListener("pointerup", (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 40) show(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; loop(); }).observe(root);
  document.addEventListener("visibilitychange", loop);

  show(0);
  setPaused(paused);
  return { show, setPaused };
}

const mountAll = () => document.querySelectorAll("[data-carousel]").forEach((el) => { if (!el.classList.contains("pc")) mountCarousel(el); });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll); else mountAll();
