// AI-LA panel 2. Renk: panel2.html?renk=turkuaz|mor|turuncu|deniz (varsayılan mavi). Rol login'den gelir; demoda ?rol=ogretmen|yonetici
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { hexToOklch, oklchToHex } from "../oklch.js";

const $ = (s, r = document) => r.querySelector(s);

const THEMES = { mavi: "#345de0", turkuaz: "#008978", mor: "#914db8", turuncu: "#c9582b", deniz: "#1e8a5a" };
const q = new URLSearchParams(location.search);
const c = THEMES[q.get("renk")] || THEMES.mavi;
const [L, C, H] = hexToOklch(c);
const vio = oklchToHex([Math.min(L + 0.05, 0.62), Math.max(C, 0.16), H + 38]); // aynı rengin mora kayan eşi
const st = document.documentElement.style;
st.setProperty("--s", c);
st.setProperty("--s-ink", oklchToHex([Math.min(L, 0.45), C, H]));
st.setProperty("--s-tint", oklchToHex([0.965, Math.min(C * 0.18, 0.03), H]));
st.setProperty("--v", vio);
st.setProperty("--v-tint", oklchToHex([0.965, 0.03, H + 38]));
// araç ikonları için okul renginden mora dört ton
const hues = [0, 14, 26, 38].map((d) => [oklchToHex([0.5, Math.max(C, 0.15), H + d]), oklchToHex([0.955, 0.035, H + d])]);

const ROLES = {
  ogrenci: { name: "Elif", avatar: "EY" },
  ogretmen: { name: "Ayşe Hoca", avatar: "AK" },
  yonetici: { name: "Mehmet Bey", avatar: "MD" },
};
const R = ROLES[q.get("rol")] || ROLES.ogrenci;
$("[data-name]").textContent = R.name;
$("[data-avatar]").textContent = R.avatar;

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ARROW = '<svg class="icon go" aria-hidden="true"><use href="#i-arrow" /></svg>';

/* ---------- araçlar: ana sayfada ilk sekizi, Araçlar sayfasında hepsi ---------- */
const TOOLS = [
  ["i-image", "Görsel Oluştur", "Metinden ya da görselden etkileyici görseller üret.", "gorsel"],
  ["i-video", "Video Oluştur", "Metin, görsel ya da şablonla videolar hazırla.", "video"],
  ["i-chat", "Sohbet", "Seviyeni bilen asistanla soru sor, plan yap.", "yazi"],
  ["i-music", "Müzik Oluştur", "Hayalindeki müziği birlikte üret.", "ses"],
  ["i-code", "Kod Yaz", "Python ve daha fazlasıyla projeler geliştir.", "kod"],
  ["i-cube", "3D Oluştur", "Fikirlerini üç boyutlu modellere dönüştür.", "gorsel"],
  ["i-agent", "Ajan", "Kendi yapay zekâ ajanını kur, görev ver.", "ogrenme"],
  ["i-template", "Şablonlar", "Hazır şablonlarla hızlıca üretime başla.", "gorsel"],
  ["i-wand", "Görsel Düzenle", "Arka planı değiştir, ayrıntı ekle, stil ver.", "gorsel"],
  ["i-video", "Görselden Video", "Bir resmi kısa bir sahneye çevir.", "video"],
  ["i-slides", "Sunum Hazırla", "Konunu anlat, slaytları birlikte kurun.", "yazi"],
  ["i-doc", "Özet Çıkar", "Uzun bir metni anlaşılır notlara dönüştür.", "yazi"],
  ["i-mic", "Seslendirme", "Metnini doğal bir sesle okut.", "ses"],
  ["i-code", "Kod Açıkla", "Bir kodun ne yaptığını adım adım öğren.", "kod"],
  ["i-book", "Soru Çöz", "Takıldığın soruyu ipucuyla birlikte çöz.", "ogrenme"],
  ["i-layers", "Akışlar", "Adım adım ilerleyen öğrenme senaryoları.", "ogrenme"],
];
const CATS = [["tum", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"], ["yazi", "Yazı"], ["ses", "Ses"], ["kod", "Kod"], ["ogrenme", "Öğrenme"]];
const toolCard = ([icon, t, d], i) => {
  const [hue, tint] = hues[i % 4];
  return `<li><a class="tool" href="#" style="--hue:${hue};--tint:${tint}">
    <span class="tool-icon"><svg class="icon" aria-hidden="true"><use href="#${icon}" /></svg></span>
    <strong>${t}</strong><span>${d}</span>${ARROW}</a></li>`;
};
$("[data-tools]").innerHTML = TOOLS.slice(0, 8).map(toolCard).join("");

const allTools = $("[data-all-tools]"), toolsEmpty = $("[data-tools-empty]");
let cat = "tum", term = "";
const norm = (x) => x.toLocaleLowerCase("tr");
const renderTools = () => {
  const list = TOOLS.filter((t) => (cat === "tum" || t[3] === cat) && (!term || norm(t[1] + " " + t[2]).includes(term)));
  allTools.innerHTML = list.map(toolCard).join("");
  toolsEmpty.hidden = list.length > 0;
};
const chips = (host, items, onPick) => {
  host.innerHTML = items.map(([id, label], i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-id="${id}">${label}</button>`).join("");
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", host).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    onPick(b.dataset.id);
  });
};
chips($("[data-tool-chips]"), CATS, (id) => { cat = id; renderTools(); });
renderTools();
// üst çubuktaki arama araçları süzer; başka sayfadayken Araçlar'a geçer
$("[data-search]").addEventListener("input", (e) => {
  term = norm(e.target.value.trim());
  renderTools();
  if (term && view !== "araclar") location.hash = "araclar";
});

/* ---------- son aktiviteler ---------- */
const ACTS = [
  { img: "uzay", t: "Görsel oluşturuldu", d: "gunes_sistemi_poster", w: "2 saat önce" },
  { img: "foto", play: true, t: "Video oluşturuldu", d: "fotosentez_ozet", w: "4 saat önce" },
  { img: "okumino", t: "Okumino egzersizi bitti", d: "Kelebeğin yolculuğu · %88 anlama", w: "Dün" },
  { img: "codemino", t: "Codemino görevi tamamlandı", d: "Bölüm 3 · Döngüler", w: "Dün" },
  { img: "muzik", t: "Müzik oluşturuldu", d: "sakin_odak", w: "2 gün önce" },
];
const thumb = (a, cls = "act-thumb") => `<span class="${cls}${a.play ? " play" : ""}"><img src="assets/thumbs/${a.img}.jpg" alt="" loading="lazy">${a.play ? '<svg class="icon" aria-hidden="true"><use href="#i-video" /></svg>' : ""}</span>`;
$("[data-acts]").innerHTML = ACTS.map((a) => `<li class="act">${thumb(a)}<span class="act-text"><strong>${a.t}</strong><span>${a.d}</span><span>${a.w}</span></span></li>`).join("");

// Kendini Tanı kartındaki altı Maarif alanı (beceri haritasıyla aynı rakamlar)
$("[data-kt-bars]").innerHTML = [82, 80, 81, 80, 79, 82].map((v) => `<i style="--p:${v}%"></i>`).join("");

/* ---------- ekosistem ---------- */
const ECO = [
  { img: "talent14", logo: "assets/talent14.png", name: "Talent14", text: "Dijital beceri ve teknoloji eğitimi.", feeds: "Kavramsal · Okuryazarlık" },
  { img: "ai-galaxy", logo: "assets/ai-galaxy.png", mono: true, name: "AI-GALAXY", text: "Yapay zekâ okuryazarlığı modülleri ve üretim stüdyosu.", feeds: "Okuryazarlık · Erdem-Değer" },
  { img: "okumino", logo: "assets/okumino-logo.png", name: "Okumino", text: "Hızlı okuma ve anlama egzersizleri, seviyene göre.", feeds: "Okuryazarlık · Kavramsal" },
  { img: "codemino", logo: "assets/codemino-logo.png", name: "Codemino", text: "Oyun içinde blok kodlama görevleri.", feeds: "Kavramsal · Alan" },
  { img: "talentcup", logo: "assets/talentcup-mark.png", tc: true, name: "Talent Cup", text: "Öğrenci yarışmaları ve takım projeleri.", feeds: "Sosyal-Duygusal · Eğilimler" },
  { img: "icerik", label: "Dijital İçerik Platformu", name: "Dijital İçerik Platformu", text: "Okulunun kullandığı ders içerikleri ve ara sorular.", feeds: "Alan · Eğilimler" },
];
$("[data-eco]").innerHTML = ECO.map((p) => `<li><a class="eco" href="#">
  <span class="eco-shot"><img src="assets/carousel/${p.img}.jpg" alt="" loading="lazy"></span>
  <span class="eco-body">
    <span class="eco-logo">${p.label ? `<b class="eco-word">${p.label}</b>` : p.tc ? `<span class="eco-tc"><img src="${p.logo}" alt="">TALENT CUP</span>` : `<img src="${p.logo}" alt="${p.name}"${p.mono ? ' class="mono"' : ""}>`}</span>
    <span class="eco-text">${p.text}</span>
    <span class="eco-feeds"><svg class="icon" aria-hidden="true"><use href="#i-compass" /></svg>${p.feeds}</span>
  </span></a></li>`).join("");

/* ---------- projelerim ---------- */
const PROJ = [
  { img: "uzay", t: "Güneş Sistemi posteri", k: "gorsel", kl: "Görsel", w: "Bugün" },
  { img: "foto", play: true, t: "Fotosentez özeti", k: "video", kl: "Video", w: "Bugün" },
  { img: "muzik", t: "sakin_odak", k: "ses", kl: "Müzik", w: "2 gün önce" },
  { img: "afis", t: "Bilim şenliği afişi", k: "gorsel", kl: "Şablon", w: "2 gün önce" },
  { img: "oyun", t: "Altın toplayan kahraman", k: "kod", kl: "Kod", w: "3 gün önce" },
  { img: "masal", t: "Dağların masalı", k: "gorsel", kl: "Görsel", w: "Geçen hafta" },
  { img: "robot", t: "Yardımcı robot Pıtır", k: "3d", kl: "3D", w: "Geçen hafta" },
  { img: "codemino", t: "Codemino · Döngüler", k: "kod", kl: "Codemino", w: "Geçen hafta" },
];
const PCATS = [["tum", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"], ["ses", "Ses"], ["kod", "Kod"], ["3d", "3D"]];
const projGrid = $("[data-proj]");
const renderProj = (k) => {
  projGrid.innerHTML = PROJ.filter((p) => k === "tum" || p.k === k).map((p) => `<li><a class="proj" href="#">
    ${thumb(p, "proj-shot")}<span class="proj-meta"><strong>${p.t}</strong><span><b>${p.kl}</b> · ${p.w}</span></span></a></li>`).join("");
};
chips($("[data-proj-chips]"), PCATS, renderProj);
renderProj("tum");

/* ---------- topluluk ---------- */
const FEED = [
  { img: "masal", who: "Deniz K.", g: "7-B", t: "Dağların masalı için kapak", likes: 48 },
  { img: "robot", who: "Mert A.", g: "7-A", t: "Sınıf robotumuz Pıtır", likes: 36 },
  { img: "afis", who: "Ece T.", g: "8-A", t: "Bilim şenliği afişi", likes: 31 },
  { img: "oyun", who: "Can Y.", g: "6-C", t: "İlk platform oyunum", likes: 27 },
  { img: "uzay", who: "Elif Y.", g: "7-A", t: "Güneş sistemi posteri", likes: 22 },
  { img: "muzik", who: "Zeynep K.", g: "5-B", t: "Ders çalışırken dinlenecek müzik", likes: 19 },
];
$("[data-feed]").innerHTML = FEED.map((f) => `<li><article class="post">
  ${thumb(f, "post-shot")}
  <div class="post-meta"><span class="post-av">${f.who.split(" ").map((x) => x[0]).join("")}</span>
    <span class="post-text"><strong>${f.t}</strong><span>${f.who} · ${f.g}</span></span>
    <button type="button" class="like" aria-pressed="false" aria-label="Beğen"><svg class="icon" aria-hidden="true"><use href="#i-heart" /></svg><b>${f.likes}</b></button></div>
</article></li>`).join("");
$("[data-feed]").addEventListener("click", (e) => {
  const b = e.target.closest(".like"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true", n = b.querySelector("b");
  b.setAttribute("aria-pressed", String(on)); n.textContent = +n.textContent + (on ? 1 : -1);
});
$("[data-top]").innerHTML = FEED.slice(0, 4).map((f, i) => `<li><span class="rank">${i + 1}</span>${thumb(f, "top-shot")}<span class="top-text"><strong>${f.t}</strong><span>${f.who} · ${f.likes} beğeni</span></span></li>`).join("");

/* ---------- sayfalar: menü adresle (#araclar …) değişir, sayfa yeniden yüklenmez ---------- */
let view = "ana", skillMap = null;
const VIEWS = $$("[data-view]").map((v) => v.dataset.view);
const go = () => {
  const h = location.hash.slice(1);
  view = VIEWS.includes(h) ? h : "ana";
  $$("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== view; });
  $$("[data-nav]").forEach((a) => { if (a.dataset.nav === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  document.title = `${$(`[data-nav="${view}"]`).textContent.trim()} · AI-LA`;
  if (view === "kendini-tani") {
    if (!skillMap) {
      import("./skillmap.js").then(({ mountSkillMap }) => {
        skillMap = mountSkillMap({ stage: $("[data-km-stage]"), canvas: $("[data-km-canvas]"), labels: $("[data-km-labels]"), karne: $("[data-karne]"), advice: $("[data-advice]"), scoreEl: $("[data-km-score]") });
        if (view === "kendini-tani") skillMap.start();
      });
    } else skillMap.start();
  } else skillMap?.stop();
};
addEventListener("hashchange", go);
go();

/* ---------- kenar menüyü daralt / aç (tercih bu tarayıcıda hatırlanır) ---------- */
const app = $(".app"), sideBtn = $("[data-side-toggle]");
const setSide = (collapsed) => {
  app.classList.toggle("is-collapsed", collapsed);
  sideBtn.setAttribute("aria-expanded", String(!collapsed));
  sideBtn.setAttribute("aria-label", collapsed ? "Menüyü aç" : "Menüyü daralt");
};
try { setSide(localStorage.getItem("aila-side") === "dar"); } catch (e) { /* depolama kapalıysa açık başlar */ }
sideBtn.addEventListener("click", () => {
  const c = !app.classList.contains("is-collapsed");
  setSide(c);
  try { localStorage.setItem("aila-side", c ? "dar" : "genis"); } catch (e) { /* yok say */ }
});

/* ---------- karşılama nesnesi: cam küre içinde kristal ve iki ince halka ---------- */
const canvas = $("[data-crystal]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
try {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.2, 9);

  const sCol = new THREE.Color(c), vCol = new THREE.Color(vio);
  const rig = new THREE.Group();
  scene.add(rig);

  // kristal: düz yüzlü, okul renginden mora yüz yüz değişen ton
  const geo = new THREE.IcosahedronGeometry(1.15, 0).toNonIndexed();
  geo.scale(1, 1.22, 1);
  const col = [], tmp = new THREE.Color();
  for (let f = 0; f < geo.attributes.position.count / 3; f++) {
    const y = (geo.attributes.position.getY(f * 3) + geo.attributes.position.getY(f * 3 + 1) + geo.attributes.position.getY(f * 3 + 2)) / 3;
    tmp.copy(sCol).lerp(vCol, THREE.MathUtils.clamp(0.5 - y * 0.45 + (f % 3) * 0.08, 0, 1)).lerp(new THREE.Color("#ffffff"), (f % 4) * 0.07);
    for (let k = 0; k < 3; k++) col.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const crystal = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    vertexColors: true, flatShading: true, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08,
    iridescence: 0.6, iridescenceIOR: 1.4, transparent: true, opacity: 0.94, envMapIntensity: 1.3,
  }));
  rig.add(crystal);

  // cam kabuk: içi görünsün diye ince, kenarda parlayan
  const shell = new THREE.Mesh(new THREE.SphereGeometry(2.05, 96, 64), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.04, metalness: 0, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.3,
    transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.6, side: THREE.FrontSide,
  }));
  rig.add(shell);
  // kenar ışığı: kabuğun kenarlarını açan fresnel katman
  const rim = new THREE.Mesh(new THREE.SphereGeometry(2.06, 96, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: vCol.clone().lerp(new THREE.Color("#ffffff"), 0.35) } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 uCol; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-max(dot(vN,vV),0.),3.); gl_FragColor = vec4(uCol*f*.9, f*.9); }",
  }));
  rig.add(rim);

  const ringMat = new THREE.MeshPhysicalMaterial({ color: vCol.clone().lerp(new THREE.Color("#ffffff"), 0.55), roughness: 0.1, clearcoat: 1, iridescence: 1, transparent: true, opacity: 0.75, envMapIntensity: 1.4 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.022, 16, 240), ringMat);
  ring1.rotation.set(1.2, 0.35, 0.2);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.012, 12, 240), ringMat.clone());
  ring2.material.opacity = 0.45;
  ring2.rotation.set(1.35, -0.3, -0.25);
  scene.add(ring1, ring2);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(vCol, 0.8); fill.position.set(-4, -2, 2); scene.add(fill);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // nesne yüksekliğe sığsın: küçük kartta da halkalar kesilmesin
    camera.position.z = Math.max(10.5, 9.6 / Math.min(1, camera.aspect));
    camera.updateProjectionMatrix();
    if (reduce) draw(4000); // hareketsiz modda boyut değişince kare yeniden çizilir
  };

  let px = 0, py = 0, visible = true, raf = 0;
  addEventListener("pointermove", (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; });
  const draw = (t) => {
    const s = t / 1000;
    crystal.rotation.y = s * 0.35; crystal.rotation.x = Math.sin(s * 0.4) * 0.12;
    ring1.rotation.z = 0.2 + s * 0.12; ring2.rotation.z = -0.25 - s * 0.08;
    rig.position.y = Math.sin(s * 0.8) * 0.06;
    scene.rotation.y += (px * 0.25 - scene.rotation.y) * 0.05;
    scene.rotation.x += (py * 0.15 - scene.rotation.x) * 0.05;
    renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  const loop = (t) => { raf = 0; draw(t); if (visible && !document.hidden) raf = requestAnimationFrame(loop); };
  if (reduce) draw(4000);
  else {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });
  }
} catch (e) {
  canvas.remove(); // WebGL yoksa karşılama yalnız metinle kalır
}
