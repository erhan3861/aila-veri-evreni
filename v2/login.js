// AI-LA okul giriş sayfası. Okul rengi ve adı adres satırından: giris.html?okul=Bilim%20Koleji&renk=mavi
// Arka planda okulun cam monogramı (monogram.js): okulun adının ilk harfi, okul renginde.
import { mountMonogram } from "./monogram.js";
import { hexToOklch, oklchToHex } from "../oklch.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- okul ---------- */
const THEMES = {
  bordo: { c: "#b01e32", c2: "#f08a7e" },
  mavi: { c: "#345de0", c2: "#8fa6ff" },
  turkuaz: { c: "#008978", c2: "#5fd3c0" },
  mor: { c: "#914db8", c2: "#d99bf0" },
  turuncu: { c: "#c9582b", c2: "#ffb27a" },
  deniz: { c: "#1e8a5a", c2: "#74d9a9" },   // deniz yeşili: turkuazdan belirgin daha yeşil
};
const q = new URLSearchParams(location.search);
const theme = THEMES[q.get("renk")] || THEMES.bordo;
const school = (q.get("okul") || "Demo Koleji").slice(0, 40);

const [, C, H] = hexToOklch(theme.c);
const bg = oklchToHex([0.155, Math.min(C * 0.2, 0.04), H]); // gece zemini okulun tonunda, her renkte aynı ağırlık
const root = document.documentElement.style;
root.setProperty("--s", theme.c); root.setProperty("--s2", theme.c2); root.setProperty("--bg", bg);
$('meta[name="theme-color"]').content = bg;
$$("[data-school]").forEach((el) => { el.textContent = school; });
$$("[data-initial]").forEach((el) => { el.textContent = school.charAt(0).toLocaleUpperCase("tr"); });
document.title = `Giriş · ${school} AI`;

/* ---------- cam monogram ---------- */
const canvas = $("[data-canvas]");
const narrow = matchMedia("(max-width: 899px)");
let mono = null, last = performance.now(), raf = 0;
// başlığın altındaki alan: beyin ortada ve baskın; cam harf beynin kalbinde ama küçük (yüksekliğin %30'u),
// beynin silüeti ve kıvrımları etrafında okunur kalır (köşedeki harf kopuk duruyordu)
const placeFor = () => {
  const r = $("[data-stage]").getBoundingClientRect();
  const bh = Math.min(r.height * 0.74, (r.width / 1.43) * 0.66);          // beyin yüksekliği (en-boy 1.43); başlığın altında ikinci planda
  const bx = r.left + r.width * (narrow.matches ? 0.5 : 0.46), by = r.top + r.height * 0.47;
  const len = bh * 1.43;
  return { x: bx - len * 0.04, y: by + bh * 0.04, h: bh * 0.3, brain: { x: bx, y: by, h: bh } };
};
const frame = (now) => {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  mono.frame(now / 1000, dt, reduce);
  if (!reduce) loop();
};
const loop = () => { if (mono && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
document.addEventListener("visibilitychange", loop);
addEventListener("resize", () => { clearTimeout(placeFor.t); placeFor.t = setTimeout(() => { mono?.layout(placeFor()); if (reduce && mono) requestAnimationFrame(frame); }, 120); });
const startMonogram = async () => {
  try {
    mono = await mountMonogram(canvas, { char: school.charAt(0).toLocaleUpperCase("tr"), c: theme.c, c2: theme.c2, bg, mobile: narrow.matches });
    mono.layout(placeFor());
    reduce ? requestAnimationFrame(frame) : loop();
  } catch (err) { console.info("[giriş] 3B monogram yok, düz zemin:", err.message); }
};

/* ---------- sekmeler (WAI-ARIA, otomatik etkinleştirme) ---------- */
const tabsEl = $("[data-tabs]");
const tabs = $$('[role="tab"]', tabsEl);
const ind = $(".tab-ind", tabsEl);
tabsEl.classList.add("js");
const moveInd = () => { const t = tabs.find((x) => x.getAttribute("aria-selected") === "true"); ind.style.width = `${t.offsetWidth}px`; ind.style.transform = `translateX(${t.offsetLeft}px)`; };
const selectTab = (tab, focus) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
  moveInd();
  if (focus) tab.focus();
  history.replaceState(null, "", `#${tab.id.slice(2)}`);
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
// #yarisma ya da #form ile doğrudan o sekmeye gelinebilir (okul sayfasındaki üç düğme)
const fromHash = tabs.find((t) => `#${t.id.slice(2)}` === location.hash);

/* ---------- şifre göster ---------- */
$("[data-pw]").addEventListener("click", (e) => {
  const b = e.currentTarget, input = $("#g-sifre"), show = input.type === "password";
  input.type = show ? "text" : "password";
  b.setAttribute("aria-pressed", String(show));
  b.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster");
  $("use", b).setAttribute("href", show ? "#i-eye-off" : "#i-eye");
});

/* ---------- aktivasyon kodu: büyük harf, 4-4-3 tireli ---------- */
const kod = $("#y-kod");
kod.addEventListener("input", () => {
  const raw = kod.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
  kod.value = [raw.slice(0, 4), raw.slice(4, 8), raw.slice(8)].filter(Boolean).join("-");
});

// form odaktayken monogram karta döner (dinler)
const panel = $(".panel");
// yazılan alana monogramdan dikkat dalgası (en çok 350 ms'de bir)
let lastPing = 0;
const pingTo = (el) => {
  const now = performance.now();
  if (!mono || now - lastPing < 350) return;
  lastPing = now;
  const r = el.getBoundingClientRect();
  mono.ping([r.left + Math.min(40, r.width * 0.1), r.top + r.height / 2]);
};
panel.addEventListener("focusin", (e) => { mono?.setMood("listen"); if (e.target.matches("input, select")) pingTo(e.target); });
panel.addEventListener("input", (e) => pingTo(e.target));
panel.addEventListener("focusout", () => setTimeout(() => { if (!panel.contains(document.activeElement)) mono?.setMood("idle"); }, 0));

/* ---------- formlar ---------- */
const RULES = {
  kullanici: { valueMissing: "E-posta adresinizi ya da kullanıcı adınızı yazın." },
  sifre: { valueMissing: "Şifrenizi yazın." },
  kod: { valueMissing: "Aktivasyon kodunu yazın.", pattern: [/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{3}$/, "Kod 11 karakter olmalı, örneğin OKUL-2026-K4F."] },
  ad: { valueMissing: "Öğrencinin adını ve soyadını yazın." },
  veli: { valueMissing: "Adınızı ve soyadınızı yazın." },
  tel: { valueMissing: "Telefon numaranızı yazın.", pattern: [/^0?5\d{9}$/, "Numarayı 05XX XXX XX XX biçiminde, 11 hane olarak yazın."], clean: (v) => v.replace(/[\s()-]/g, "").replace(/^\+?90/, "0") },
  sinif: { valueMissing: "Öğrencinin sınıfını seçin." },
  onay: { valueMissing: "Devam etmek için aydınlatma metnini onaylayın." },
};
const validate = (f) => {
  const r = RULES[f.name]; if (!r) return true;
  let msg = "";
  if (f.validity.valueMissing) msg = r.valueMissing;
  else if (r.pattern && !r.pattern[0].test(r.clean ? r.clean(f.value) : f.value)) msg = r.pattern[1];
  const err = document.getElementById(`e-${f.name}`);
  if (err) err.textContent = msg;
  if (f.type !== "checkbox") f.setAttribute("aria-invalid", String(Boolean(msg)));
  return !msg;
};
const DONE = {
  giris: () => `Demo: giriş simüle edildi. Gerçek sitede ${school} ana sayfanız açılır.`,
  yarisma: () => "Demo: kod kabul edildi. Sıradaki adımda velinizin onayını isteriz.",
  form: () => `Demo: talebiniz alındı. ${school} kayıt ekibi sizi arayacak.`,
};
const LABEL = { giris: "Giriş Yap", yarisma: "Devam Et", form: "Talep Gönder" };
const WORKING = { giris: "Ana sayfanızı hazırlıyorum", yarisma: "Kodu doğruluyorum", form: "Talebinizi iletiyorum" };
$$("[data-form]").forEach((form) => {
  let tried = false;
  const kind = form.dataset.form, btn = $(".btn-primary", form), status = $("[data-status]", form);
  form.addEventListener("input", (e) => { if (tried) validate(e.target); });
  form.addEventListener("change", (e) => { if (tried) validate(e.target); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); tried = true; status.textContent = ""; status.classList.remove("bad");
    const fields = $$("input, select", form).filter((x) => RULES[x.name]);
    const bad = fields[fields.map(validate).indexOf(false)];
    if (bad) { bad.focus(); return; }
    // bekleme göstergesi monogramın çekirdeği: düşünürken nabız atar
    btn.disabled = true; btn.textContent = WORKING[kind]; mono?.setMood("think");
    // TODO: gerçek uçlar — giriş: kurum SSO / AI-LA oturum, yarışma: aktivasyon API, form: Mini CRM
    await new Promise((r) => setTimeout(r, 900));
    btn.disabled = false; btn.innerHTML = `${LABEL[kind]}<svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg>`;
    mono?.setMood(panel.contains(document.activeElement) ? "listen" : "idle");
    status.textContent = DONE[kind]();
  });
});
$("[data-sso]").addEventListener("click", () => { const s = $("#p-giris [data-status]"); s.classList.remove("bad"); s.textContent = "Demo: gerçek sitede okulunuzun oturum sayfası açılır."; });

/* ---------- başlat ---------- */
(document.fonts?.ready || Promise.resolve()).then(() => {
  if (fromHash) selectTab(fromHash, false); else moveInd();
  startMonogram();
});
