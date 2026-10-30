// AI-LA panel (login sonrası tek sayfa). Okul adı ve rengi: panel.html?okul=Bilim%20Koleji&renk=mor
// Rol login'den gelir (oturum); demoda adresten okunur: panel.html?rol=ogretmen | yonetici
import { hexToOklch, oklchToHex } from "../oklch.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const THEMES = { mavi: "#345de0", turkuaz: "#008978", mor: "#914db8", turuncu: "#c9582b", deniz: "#1e8a5a" };
const q = new URLSearchParams(location.search);
const school = (q.get("okul") || "Demo Koleji").slice(0, 40);
const c = THEMES[q.get("renk")] || THEMES.mavi; // varsayılan: mavi
const [L, C, H] = hexToOklch(c);
const st = document.documentElement.style;
st.setProperty("--s", c);
st.setProperty("--s-ink", oklchToHex([Math.min(L, 0.45), C, H]));          // açık zeminde metin için koyu eş
st.setProperty("--s-tint", oklchToHex([0.965, Math.min(C * 0.18, 0.03), H]));
st.setProperty("--s-deep", oklchToHex([0.28, Math.min(C * 0.75, 0.12), H])); // Kendini Tanı kartı
$$("[data-school]").forEach((e) => { e.textContent = school; });
$$("[data-initial]").forEach((e) => { e.textContent = school.charAt(0).toLocaleUpperCase("tr"); });
document.title = `Ana sayfa · ${school} AI`;
$("[data-date]").textContent = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

/* ---------- rollere göre içerik (demo verisi) ---------- */
const ROLES = {
  ogrenci: {
    name: "Elif", avatar: "EY", sub: "Bugün 2 görevin ve 1 yeni dersin var.",
    today: [["Fen", "Fotosentez: ara sorular", "Bugün"], ["Talent Cup", "Takım projesi taslağı", "Cuma"]],
    kt: ["Beceri karnen hazır", "Bağlı platformlardaki çalışmaların altı beceri alanında toplandı.", "Kendini Tanı"],
    ai: [
      ["i-tools", "Araçlar", "Üretim, araştırma ve öğrenme araçları"],
      ["i-chat", "Sohbet", "Seviyeni bilen kişisel yapay zekâ"],
      ["i-flow", "Akışlar", "Adım adım ilerleyen öğrenme senaryoları"],
      ["i-agent", "Ajanlar", "Senin için görev yürüten asistanlar"],
      ["i-task", "Görevler", "Teslimler ve gelişim adımları"],
      ["i-people", "Topluluk", "Paylaşımlar ve birlikte öğrenme"],
    ],
  },
  ogretmen: {
    name: "Ayşe Hoca", avatar: "AK", sub: "7-A için 3 teslim değerlendirme bekliyor.",
    today: [["7-A Fen", "3 teslim bekliyor", "Bugün"], ["Veli toplantısı", "Rapor taslağı hazır", "Perşembe"]],
    kt: ["Sınıfının beceri haritası", "7-A'nın altı beceri alanındaki gelişimi ve öne çıkan öğrenciler.", "Sınıfı incele"],
    ai: [
      ["i-tools", "Akıllı araçlar", "Ders planı, karma sınav, rapor"],
      ["i-chat", "Sohbet", "İçerik ve fikir geliştirme"],
      ["i-class", "Whiteboard", "Tahta için görsel ve özet"],
      ["i-people", "Sınıflarım", "Şube, öğrenci ve takip"],
      ["i-agent", "Ajanlar", "Değerlendirme ve raporlama"],
      ["i-flow", "Akışlar", "Hazır ders senaryoları"],
    ],
  },
  yonetici: {
    name: "Mehmet Bey", avatar: "MD", sub: "Bu hafta 12 yeni veli talebi geldi.",
    today: [["Mini CRM", "12 yeni veli talebi", "Bu hafta"], ["Lisans", "Kredi kullanımı %68", "Ekim"]],
    kt: ["Okulun beceri görünümü", "Kademelere göre altı beceri alanı ve gelişim alanları.", "Okulu incele"],
    ai: [
      ["i-people", "Kullanıcılar", "Öğrenci, öğretmen ve yönetici erişimi"],
      ["i-shield", "Yapay zekâ politikaları", "Rol yetkileri ve model sınırları"],
      ["i-inbox", "Mini CRM", "Veli ve yarışma başvuruları"],
      ["i-chart", "Kredi ve rapor", "Kullanım, maliyet ve performans"],
      ["i-agent", "Ajan ve akış", "Kurum geneli şablonlar"],
      ["i-tools", "Kurumsal hafıza", "Belgeler ve bilgi kaynakları"],
    ],
  },
};

// Maarif Modeli'nin altı beceri alanı: Kendini Tanı halkası (Elif'in beceri haritasıyla aynı rakamlar)
const SKILLS = [["Kavramsal", 82, "#7cb6ff"], ["Alan", 80, "#f58fc5"], ["Eğilimler", 81, "#f3b45b"], ["Sosyal-Duygusal", 80, "#5fd3b5"], ["Okuryazarlık", 79, "#b49bff"], ["Erdem-Değer", 82, "#ff8f78"]];

const ECO = [
  { logo: "assets/talent14.png", name: "Talent14", text: "Dijital beceri ve teknoloji eğitimi", group: "Okulunuza bağlı" },
  { logo: "assets/ai-galaxy.png", name: "AI-GALAXY", text: "Yapay zekâ okuryazarlığı ve üretim", group: "Okulunuza bağlı", mono: true },
  { logo: "assets/okumino-logo.png", name: "Okumino", text: "Hızlı okuma ve anlama", group: "Okulunuza bağlı" },
  { logo: "assets/codemino-logo.png", name: "Codemino", text: "Oyun içinde kodlama", group: "Okulunuza bağlı" },
  { logo: "assets/talentcup-mark.png", name: "Talent Cup", text: "Yarışmalar ve proje programları", group: "Hemen erişilebilir", mark: true },
  { label: "Dijital İçerik Platformu", name: "Dijital İçerik Platformu", text: "Kurumunuzun içerik platformu", group: "Hemen erişilebilir" },
];

/* ---------- halka ---------- */
const ring = $("[data-ring]");
(() => {
  const cx = 60, cy = 60, r = 46, gap = 4, n = SKILLS.length, seg = 360 / n;
  const arc = (a0, a1) => {
    const p = (a) => [cx + r * Math.cos((a - 90) * Math.PI / 180), cy + r * Math.sin((a - 90) * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  ring.innerHTML = SKILLS.map(([, v, col], i) => {
    const a0 = i * seg + gap / 2, a1 = (i + 1) * seg - gap / 2, af = a0 + (a1 - a0) * (v / 100);
    return `<path d="${arc(a0, a1)}" stroke="rgba(255,255,255,.14)" stroke-width="9" fill="none" stroke-linecap="round"/>
            <path d="${arc(a0, af)}" stroke="${col}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  }).join("");
})();
// halkanın yanındaki altı alan: halkayla aynı renk, kısa çubuk + puan
$("[data-kt-skills]").innerHTML = SKILLS.map(([n, v, col]) =>
  `<li><span class="ks-name">${n}</span><b>${v}</b><i style="--v:${v}%;--c:${col}"></i></li>`).join("");

/* ---------- ekosistem ---------- */
$("[data-eco]").innerHTML = ECO.map((p) => `
  <li><a class="eco" href="#" data-name="${p.name}">
    <span class="eco-logo">${p.label ? `<b class="eco-word">${p.label}</b>` : p.mark ? `<span class="eco-tc"><img src="${p.logo}" alt="">TALENT CUP</span>` : `<img src="${p.logo}" alt="${p.name}"${p.mono ? ' class="mono"' : ""}>`}</span>
    <span class="eco-text">${p.text}</span>
    <span class="eco-foot"><span class="eco-group">${p.group}</span><svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg></span>
  </a></li>`).join("");

/* ---------- rol ---------- */
const render = (key) => {
  const R = ROLES[key];
  $("[data-hello]").textContent = `Merhaba, ${R.name}`;
  $("[data-sub]").textContent = R.sub;
  $("[data-avatar]").textContent = R.avatar;
  $("[data-badge]").textContent = R.today.length;
  $("[data-today]").innerHTML = R.today.map(([tag, t, when]) => `<li><span class="t-tag">${tag}</span><span class="t-text">${t}</span><span class="t-when">${when}</span></li>`).join("");
  $("[data-kt-title]").textContent = R.kt[0];
  $("[data-kt-text]").textContent = R.kt[1];
  $("[data-kt-btn]").firstChild.textContent = R.kt[2];
  $("[data-ai]").innerHTML = R.ai.map(([icon, t, d]) => `
    <li><a class="ai" href="#">
      <span class="ai-icon"><svg class="icon" aria-hidden="true"><use href="#${icon}" /></svg></span>
      <span class="ai-text"><strong>${t}</strong><span>${d}</span></span>
      <svg class="icon ai-go" aria-hidden="true"><use href="#i-arrow" /></svg>
    </a></li>`).join("");
};
render(q.get("rol") in ROLES ? q.get("rol") : "ogrenci");
