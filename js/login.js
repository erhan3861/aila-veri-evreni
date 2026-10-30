// AI-LA okul giriş sayfası. Okul rengi ve adı adres satırından: giris.html?okul=Bilim%20Koleji&renk=mavi
// Arka planda okulun cam monogramı (monogram.js): okulun adının ilk harfi, okul renginde.
import { mountMonogram } from "./monogram.js";
import { initLoginForms } from "./login-forms.js";
import { hexToOklch, oklchToHex } from "./oklch.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- okul ---------- */
const THEMES = {
  mavi: { c: "#345de0", c2: "#8fa6ff" },
  turkuaz: { c: "#008978", c2: "#5fd3c0" },
  mor: { c: "#914db8", c2: "#d99bf0" },
  turuncu: { c: "#c9582b", c2: "#ffb27a" },
  deniz: { c: "#1e8a5a", c2: "#74d9a9" },   // deniz yeşili: turkuazdan belirgin daha yeşil
};
const q = new URLSearchParams(location.search);
const theme = THEMES[q.get("renk")] || THEMES.mavi; // varsayılan: mavi
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

/* ---------- sekmeler ve formlar (ortak modül) ---------- */
// form odaktayken monogram karta döner (dinler); yazılan alana dikkat dalgası (en çok 350 ms'de bir);
// gönderirken çekirdek nabız atar (düşünür)
let lastPing = 0;
const pingTo = (el) => {
  const now = performance.now();
  if (!mono || now - lastPing < 350) return;
  lastPing = now;
  const r = el.getBoundingClientRect();
  mono.ping([r.left + Math.min(40, r.width * 0.1), r.top + r.height / 2]);
};
const forms = initLoginForms({
  school,
  hooks: {
    focus: (el) => { mono?.setMood("listen"); if (el.matches("input, select")) pingTo(el); },
    input: (el) => pingTo(el),
    blur: () => mono?.setMood("idle"),
    busy: (on, focused) => mono?.setMood(on ? "think" : focused ? "listen" : "idle"),
  },
});

/* ---------- başlat ---------- */
(document.fonts?.ready || Promise.resolve()).then(() => {
  forms.start();
  startMonogram();
});
