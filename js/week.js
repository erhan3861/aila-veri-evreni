// Ana sayfadaki "bu hafta" karuseli ve #gorev/<id> görev sayfası. İçerik js/hafta.js'ten gelir.
import { HAFTA } from "./hafta.js";

const ARROW = '<svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg>';
const ico = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}" /></svg>`;
const DERS = { "Türkçe": "#c2410c", "Fen Bilimleri": "#0f766e", "Matematik": "#6d28d9", "Sosyal Bilgiler": "#b45309", "İngilizce": "#1d4ed8" };
const ders = (d) => `<span class="ders" style="--d:${DERS[d] || "var(--s)"}">${d}</span>`;
const DUR = 7000; // her slaytın ekranda kalma süresi (ms)

const G = HAFTA.gorev;

// slaytlar: yarışma yoksa o slayt hiç kurulmaz
const SLIDES = [
  {
    label: "Haftanın görevi", tone: "light", img: G.img, pos: "62% 50%",
    copy: `<span class="kicker">${ico("i-book")}Haftanın AI görevi · ${HAFTA.aralik}</span>
      <h2>${G.t}</h2>
      <p>${G.ozet}</p>
      <span class="wk-meta">${ders(G.ders)}<span>Son gün ${G.teslim}</span></span>
      <a class="cta" href="#gorev/${G.id}">Göreve git${ARROW}</a>`,
  },
  HAFTA.yarisma && {
    label: "Yarışma", tone: "dark", img: HAFTA.yarisma.img, pos: "50% 40%", narrow: true,
    copy: `<span class="kicker">${ico("i-spark")}Yarışma duyurusu</span>
      <h2>${HAFTA.yarisma.ad}<span>${HAFTA.yarisma.slogan}</span></h2>
      <p>${HAFTA.yarisma.metin}</p>
      <a class="cta" href="${HAFTA.yarisma.href}" target="_blank" rel="noopener">${HAFTA.yarisma.cta}${ARROW}</a>`,
  },
  {
    label: "Haftanın projesi", tone: "dark", img: HAFTA.proje.img, pos: "40% 50%",
    copy: `<span class="kicker">${ico("i-folder")}Haftanın projesi · Talent14</span>
      <h2>${HAFTA.proje.t}</h2>
      <p>${HAFTA.proje.metin}</p>
      <a class="cta" href="${HAFTA.proje.href}" target="_blank" rel="noopener">${HAFTA.proje.cta}${ARROW}</a>`,
  },
  {
    label: "Haftanın görseli", tone: "dark", img: HAFTA.uretimGorsel.img, alt: HAFTA.uretimGorsel.t, pos: "50% 45%",
    copy: `<span class="kicker">${ico("i-image")}Haftanın üretimi · Görsel</span>
      <h2>${HAFTA.uretimGorsel.t}</h2>
      <p>${HAFTA.uretimGorsel.metin}</p>
      <a class="cta" href="${HAFTA.uretimGorsel.href}">${HAFTA.uretimGorsel.cta}${ARROW}</a>`,
  },
  {
    label: "Haftanın videosu", tone: "dark", video: HAFTA.uretimVideo.video, poster: HAFTA.uretimVideo.poster, pos: "50% 50%",
    copy: `<span class="kicker">${ico("i-video")}Haftanın üretimi · Video</span>
      <h2>${HAFTA.uretimVideo.t}</h2>
      <p>${HAFTA.uretimVideo.metin}</p>
      <a class="cta" href="${HAFTA.uretimVideo.href}">${HAFTA.uretimVideo.cta}${ARROW}</a>`,
  },
  {
    label: "İlham", tone: "dark", img: HAFTA.ilham.img, pos: "50% 60%",
    copy: `<span class="kicker">${ico("i-heart")}Haftanın sözü</span>
      <blockquote><p>“${HAFTA.ilham.soz}”</p><footer>${HAFTA.ilham.kim}</footer></blockquote>`,
  },
].filter(Boolean);

export function mountWeek(root) {
  const host = root.querySelector("[data-slides]"), dotsEl = root.querySelector("[data-dots]");
  const n = SLIDES.length;
  host.innerHTML = SLIDES.map((s, i) => `<article class="slide" id="wk-${i}" role="tabpanel" aria-roledescription="slayt" aria-label="${i + 1} / ${n}: ${s.label}" data-tone="${s.tone}"${s.narrow ? " data-narrow" : ""}>
    <div class="slide-media">${s.video
      ? `<video src="${s.video}" poster="${s.poster}" muted loop playsinline preload="none" aria-label="${s.label}" style="object-position:${s.pos}"></video>`
      : `<img src="${s.img}" alt="${s.alt || ""}" loading="${i ? "lazy" : "eager"}" style="object-position:${s.pos}">`}</div>
    <div class="slide-copy">${s.copy}</div>
  </article>`).join("");
  dotsEl.innerHTML = SLIDES.map((s, i) => `<button type="button" role="tab" aria-controls="wk-${i}" aria-label="${s.label}" title="${s.label}"><i></i></button>`).join("");
  root.style.setProperty("--dur", `${DUR}ms`);

  const slides = [...host.children], dots = [...dotsEl.children];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = 0, timer = 0, on = true, hold = false;

  const show = (i, focus = false) => {
    cur = (i + n) % n;
    root.dataset.tone = SLIDES[cur].tone; // alt gezinti açık/koyu zemine göre renk alır
    slides.forEach((s, k) => {
      const a = k === cur;
      s.classList.toggle("is-on", a);
      s.inert = !a;
      const v = s.querySelector("video");
      if (v) { if (a && on && !reduce) v.play().catch(() => {}); else v.pause(); }
    });
    dots.forEach((d, k) => { d.setAttribute("aria-selected", String(k === cur)); d.tabIndex = k === cur ? 0 : -1; });
    if (focus) dots[cur].focus();
    tick();
  };
  // otomatik geçiş: fare üstündeyken, odaktayken, sekme gizliyken ya da hareket azaltılmışsa durur
  const tick = () => {
    clearTimeout(timer);
    const run = on && !hold && !reduce && !document.hidden;
    root.classList.toggle("is-running", run);
    dots.forEach((d) => d.classList.remove("is-fill"));
    if (!run) return;
    void dots[cur].offsetWidth; // ilerleme çubuğu baştan başlasın
    dots[cur].classList.add("is-fill");
    timer = setTimeout(() => show(cur + 1), DUR);
  };

  dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
  dotsEl.addEventListener("keydown", (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); show(cur + k, true); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); show(e.key === "Home" ? 0 : n - 1, true); }
  });
  root.querySelector("[data-prev]").addEventListener("click", () => show(cur - 1));
  root.querySelector("[data-next]").addEventListener("click", () => show(cur + 1));
  root.addEventListener("pointerenter", () => { hold = true; tick(); });
  root.addEventListener("pointerleave", () => { hold = root.contains(document.activeElement); tick(); });
  root.addEventListener("focusin", () => { hold = true; tick(); });
  root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) { hold = root.matches(":hover"); tick(); } });
  document.addEventListener("visibilitychange", tick);
  // dokunmatik: yatay kaydırma
  let x0 = null;
  host.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  host.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
  });

  show(0);
  // ana sayfa görünmüyorken karusel ve video durur
  return { active(v) { if (v === on) return; on = v; show(cur); } };
}

// görev sayfası: bulunamazsa false döner, yönlendirici ana sayfaya düşer
export function renderTask(host, id) {
  if (id !== G.id) return false;
  const g = G;
  host.innerHTML = `<header class="task-head">
      <div class="task-meta">${ders(g.ders)}<span>${HAFTA.aralik} haftası</span></div>
      <h1 id="gorev-h">${g.t}</h1>
      <dl class="task-facts">
        <div><dt>Son gün</dt><dd>${g.teslim}</dd></div>
        <div><dt>Durum</dt><dd><span class="state" data-state="${g.durum}">${g.durum}</span></dd></div>
        <div><dt>Önerilen araç</dt><dd>${g.arac}</dd></div>
      </dl>
    </header>
    <section aria-labelledby="t-tal"><h2 id="t-tal">Talimatlar</h2><p>${g.talimat}</p></section>
    <section aria-labelledby="t-kri"><h2 id="t-kri">Kriterler</h2>
      <ol class="crit">${g.kriterler.map(([k, z]) => `<li><span>${k}</span>${z ? '<span class="req">Zorunlu</span>' : ""}</li>`).join("")}</ol>
    </section>
    <div class="task-actions">
      <a class="cta" href="#araclar">${g.durum === "Yapılacak" ? "Göreve başla" : "Gönderimi gör"}${ARROW}</a>
      <a class="ghost" href="#ana">Ana sayfaya dön</a>
    </div>`;
  return true;
}
