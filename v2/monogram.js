// Okulun cam monogramı (img2threejs: aila_site/monogram3d/object-sculpt-spec.json).
// Harf, okulun adının ilk harfinden çalışma anında üretilir: Sora 800'ün gerçek glif çizimi
// (opentype.js) → THREE.Shape → pahlı ekstrüzyon. Her kurum için ayrı model gerekmez.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as opentype from "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.module.js";
import { BRAIN } from "./brain-data.js";
import { hexToOklch, oklchToHex } from "../oklch.js";

// ---------- yeniden kurulum verisi (spec'in kodda kalan kopyası) ----------
export const MONOGRAM = {
  depth: 0.28,          // glif yüksekliğine oranla
  bevel: 0.035,
  bevelSegments: 6,
  core: { scale: 0.88, depth: 0.3 },  // iç çekirdek: camın kıracağı renk (arka plan nesnesi yerine)
  curveSegments: 24,
  // inceltme 1: thickness 0.6 / attenuation 0.9 camı neredeyse opak koyu bir bloğa çeviriyordu
  glass: { ior: 1.5, thickness: 0.35, roughness: 0.06, clearcoatRoughness: 0.0525, attenuationDistance: 2.2 },
  font: {
    latin: "https://cdn.jsdelivr.net/npm/@fontsource/sora@5.2.8/files/sora-latin-800-normal.woff",
    ext: "https://cdn.jsdelivr.net/npm/@fontsource/sora@5.2.8/files/sora-latin-ext-800-normal.woff", // Ş, Ğ, İ ...
  },
};

const fontCache = {};
async function loadFont(ch) {
  const key = /^[\u0000-\u007F]$/.test(ch) || "ÇÖÜçöü".includes(ch) ? "latin" : "ext"; // Ç Ö Ü Latin-1'de, Ş Ğ İ latin-ext'te
  if (!fontCache[key]) fontCache[key] = fetch(MONOGRAM.font[key]).then((r) => r.arrayBuffer()).then((b) => opentype.parse(b));
  return fontCache[key];
}

// glif çizimi → THREE şekilleri (y yukarı; TrueType dış hatlar saat yönünde, delikler ters)
function glyphShapes(font, ch) {
  const path = font.charToGlyph(ch).getPath(0, 0, 100);
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === "M") sp.moveTo(c.x, -c.y);
    else if (c.type === "L") sp.lineTo(c.x, -c.y);
    else if (c.type === "Q") sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === "C") sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return sp.toShapes(false);
}

// ---------- fabrika: tıklanabilir/patlatılabilir tek gövde ----------
export async function createSchoolMonogramModel(ch, colors) {
  const font = await loadFont(ch);
  const shapes = glyphShapes(font, ch);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 100 * MONOGRAM.depth, bevelEnabled: true, bevelThickness: 100 * MONOGRAM.bevel, bevelSize: 100 * MONOGRAM.bevel * 0.8,
    bevelSegments: MONOGRAM.bevelSegments, curveSegments: MONOGRAM.curveSegments,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox, h = bb.max.y - bb.min.y;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  geo.scale(1 / h, 1 / h, 1 / h);                    // harf yüksekliği = 1 birim
  geo.computeVertexNormals();
  const g = MONOGRAM.glass;
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 1, ior: g.ior, thickness: g.thickness, roughness: g.roughness,
    clearcoat: 1, clearcoatRoughness: g.clearcoatRoughness,
    attenuationColor: new THREE.Color(colors.c), attenuationDistance: g.attenuationDistance,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "glyph"; mesh.userData.part = "glyph";
  // çekirdek: aynı glif, %88 boyda ve ince, okul renginde; yalnız camın içinden görünür
  const core = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.c), emissive: new THREE.Color(colors.c), emissiveIntensity: 0.35, roughness: 0.35, metalness: 0,
  }));
  core.name = "core"; core.userData.part = "core";
  core.scale.set(MONOGRAM.core.scale, MONOGRAM.core.scale, MONOGRAM.core.depth);
  const root = new THREE.Group();
  root.name = `monogram-${ch}`;
  root.add(core, mesh);
  root.userData = { parts: { glyph: mesh, core }, spec: MONOGRAM, explode: (t) => { mesh.position.z = t * 0.3; core.position.z = -t * 0.2; } };
  return root;
}


// küçük stüdyo ortamı: kenar parlamaları buradan
function studio(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x15131f, side: THREE.BackSide })));
  const panel = (w, h, pos, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
  panel(6, 1.2, [0, 4, 2], 6);       // tepe şerit ışığı: üst pahlarda ince beyaz çizgi
  panel(1.2, 5, [-4.5, 0, 2], 3.5);  // sol şerit: ön yüzde dikey parlama
  panel(1.2, 5, [4.5, 0, -1], 2);    // sağ arka
  panel(4, 4, [0, 0, 5], 0.6);       // önden zayıf dolgu: yüz kapkara kalmasın
  const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(s, 0.02).texture; pm.dispose(); return tex;
}

// ---------- yapay zekâ beyni ----------
// Harfin arkasında okul renginde bir nöron ağı (img2threejs: aila_site/beyin3d). Nöron konumları yan görünüş
// referansından örneklenir: kıvrımlar, dış hat, dolgu, beyincik (brain-data.js). Sinapslar boyunca ateşlenme
// gezer; yoğunluk okulun yapay zekâsının hâline bağlı. Noktalar ve çizgiler opak (renk zemine karıştırılır):
// önündeki cam harf ancak opak nesneleri kırabilir. (Önceki nokta ızgarası ve takımyıldız beğenilmedi.)
// height: place.brain verilmezse beynin harfe oranı
const NET = { z: -1.3, height: 1.9, rate: { idle: 1.4, listen: 4, think: 14 }, hop: 0.5, cascade: 2, maxPulses: 48 };
function brainNetwork({ bg, c2, renderer }) {
  const srgb = (h) => new THREE.Color(h).convertLinearToSRGB();
  const BG = srgb(bg), HOT = srgb(c2), WHITE = new THREE.Color(1, 1, 1);
  const pr = renderer.getPixelRatio(), n = BRAIN.n, P = BRAIN.p;
  // kıvrım ve dış hat parlak ve iri: beyni beyin gibi okutan onlar; dolgu soluk (inceltme: çizgiler baskındı)
  const KIND = [{ mix: 0.75, size: 2.2 }, { mix: 0.9, size: 2.4 }, { mix: 0.14, size: 1.3 }, { mix: 0.5, size: 1.8 }]; // kıvrım, dış hat, dolgu, beyincik
  const pos = new Float32Array(n * 3), base = new Float32Array(n * 3), tint = new Float32Array(n * 3), size = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = P[i * 4] / 1000; pos[i * 3 + 1] = P[i * 4 + 1] / 1000; pos[i * 3 + 2] = P[i * 4 + 2] / 1000;
    const k = KIND[P[i * 4 + 3]], c = BG.clone().lerp(HOT, k.mix);
    base.set([c.r, c.g, c.b], i * 3); size[i] = k.size * pr;
  }
  tint.set(base);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("tint", new THREE.BufferAttribute(tint, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
  const pointMat = () => new THREE.ShaderMaterial({
    vertexShader: `attribute float size; attribute vec3 tint; varying vec3 vC;
      void main() { vC = tint; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * (6.3 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; void main() { if (length(gl_PointCoord - .5) > .5) discard; gl_FragColor = vec4(vC, 1.); }`,
  });
  const neurons = new THREE.Points(geo, pointMat());
  // iki çizgi katmanı: kıvrım/dış hat çizgileri (referanstaki desen, belirgin) + seyrek ağ bağlantıları (soluk)
  const adj = Array.from({ length: n }, () => []);
  const lineLayer = (E, k) => {
    const m = E.length / 2, lp = new Float32Array(m * 6);
    for (let s = 0; s < m; s++) {
      const a = E[s * 2], b = E[s * 2 + 1];
      lp.set(pos.subarray(a * 3, a * 3 + 3), s * 6); lp.set(pos.subarray(b * 3, b * 3 + 3), s * 6 + 3);
      adj[a].push(b); adj[b].push(a);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(bg).lerp(new THREE.Color(c2), k) }));
  };
  const folds = lineLayer(BRAIN.e, 0.42), links = lineLayer(BRAIN.l, 0.1);
  // ateşlenme darbeleri
  const pp = new Float32Array(NET.maxPulses * 3).fill(999), ps = new Float32Array(NET.maxPulses).fill(5.5 * pr), pt = new Float32Array(NET.maxPulses * 3);
  const spark = HOT.clone().lerp(WHITE, 0.55);
  for (let i = 0; i < NET.maxPulses; i++) pt.set([spark.r, spark.g, spark.b], i * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pulseGeo.setAttribute("tint", new THREE.BufferAttribute(pt, 3));
  pulseGeo.setAttribute("size", new THREE.BufferAttribute(ps, 1));
  const sparks = new THREE.Points(pulseGeo, pointMat());
  const group = new THREE.Group(); group.add(links, folds, neurons, sparks);
  [neurons, folds, links, sparks].forEach((o) => { o.frustumCulled = false; });

  const flash = new Float32Array(n), live = [];
  let acc = 0;
  const fire = (from, hops) => {
    if (live.length >= NET.maxPulses || !adj[from].length) return;
    live.push({ a: from, b: adj[from][Math.floor(Math.random() * adj[from].length)], t: 0, hops });
  };
  return {
    group,
    burst(k = 10) { for (let i = 0; i < k; i++) fire(Math.floor(Math.random() * n), NET.cascade); },
    update(dt, mood) {
      acc += dt * NET.rate[mood];
      while (acc >= 1) { acc -= 1; fire(Math.floor(Math.random() * n), NET.cascade); }
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i]; p.t += dt / NET.hop;
        if (p.t >= 1) {
          flash[p.b] = 1;
          live.splice(i, 1);
          if (p.hops > 0) { fire(p.b, p.hops - 1); if (Math.random() < 0.35) fire(p.b, p.hops - 1); }
        }
      }
      for (let i = 0; i < NET.maxPulses; i++) {
        const p = live[i];
        if (!p) { pp[i * 3] = 999; continue; }
        const e = p.t * p.t * (3 - 2 * p.t);
        for (let c = 0; c < 3; c++) pp[i * 3 + c] = pos[p.a * 3 + c] + (pos[p.b * 3 + c] - pos[p.a * 3 + c]) * e;
      }
      pulseGeo.attributes.position.needsUpdate = true;
      const fade = Math.exp(-dt * 3);
      for (let i = 0; i < n; i++) {
        if (flash[i] < 0.01) { if (flash[i]) { flash[i] = 0; tint[i * 3] = base[i * 3]; tint[i * 3 + 1] = base[i * 3 + 1]; tint[i * 3 + 2] = base[i * 3 + 2]; } continue; }
        const f = flash[i];
        tint[i * 3] = base[i * 3] + (spark.r - base[i * 3]) * f; tint[i * 3 + 1] = base[i * 3 + 1] + (spark.g - base[i * 3 + 1]) * f; tint[i * 3 + 2] = base[i * 3 + 2] + (spark.b - base[i * 3 + 2]) * f;
        flash[i] *= fade;
      }
      geo.attributes.tint.needsUpdate = true;
    },
  };
}

// ---------- stüdyo fonu ----------
// Fotoğraf stüdyosu fonu gibi: ışık sol üstten okulun tonunda düşer, sağ alta doğru derinleşir, kenarlar
// hafifçe kararır. Şekil yok (daireler/şeritler beğenilmedi). ±1 seviye sabit titreşim koyu geçişte
// bantlaşmayı önler; hareketsiz ve görünmez, kumlanma değil.
function backdropTones(c) {
  const [, C, H] = hexToOklch(c);
  return {
    light: oklchToHex([0.235, Math.min(C * 0.32, 0.07), H]),
    mid: oklchToHex([0.165, Math.min(C * 0.22, 0.045), H]),
    dark: oklchToHex([0.1, Math.min(C * 0.12, 0.025), H]),
  };
}
function studioBackdrop(c, w, h) {
  const T = backdropTones(c), cw = Math.min(1600, Math.round(w)), ch = Math.round(cw * h / w);
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const g = cv.getContext("2d");
  const lin = g.createLinearGradient(0, 0, cw * 0.8, ch);
  lin.addColorStop(0, T.light); lin.addColorStop(0.42, T.mid); lin.addColorStop(1, T.dark);
  g.fillStyle = lin; g.fillRect(0, 0, cw, ch);
  const vig = g.createRadialGradient(cw * 0.42, ch * 0.45, Math.min(cw, ch) * 0.35, cw * 0.42, ch * 0.45, Math.max(cw, ch) * 0.85);
  vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,.38)");
  g.fillStyle = vig; g.fillRect(0, 0, cw, ch);
  const img = g.getImageData(0, 0, cw, ch), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 2; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// ---------- sahne ----------
export async function mountMonogram(canvas, { char, c, c2, bg, mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);           // opak zemin: cam arkasını kırabilsin (fit'te stüdyo fonuyla değişir)
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5);

  const model = await createSchoolMonogramModel(char, { c, c2 });
  const rig = new THREE.Group(); rig.add(model); scene.add(rig);

  // arka plan boş: daireler ve şeritler amatör duruyordu (Ben). Camın kıracağı renk harfin içindeki çekirdekten gelir.
  // zemin gölgesi yok: harf boşlukta süzülüyor, gölge düzlemi altında koyu bir dikdörtgen bırakıyordu

  // beyin renkleri, beynin durduğu bölgenin tonuna karışır (düz zemine göre karışınca aydınlık fonda koyu kalıyordu)
  const brain = brainNetwork({ bg: backdropTones(c).mid, c2, renderer });
  scene.add(brain.group);

  const key = new THREE.PointLight(0xffffff, 18, 0, 2);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.15));

  let W = 1, H = 1, place = { x: 0, y: 0, h: 300 };
  const fit = () => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    scene.background?.dispose?.();
    scene.background = studioBackdrop(c, W, H);
    const u = (2 * 5 * Math.tan(THREE.MathUtils.degToRad(15))) / H; // z=0'da piksel başına birim
    rig.position.set((place.x - W / 2) * u, -(place.y - H / 2) * u, 0);
    rig.scale.setScalar(place.h * u);
    // beyin kendi alanında (place.brain), harfin gerisinde; z geride olduğu için perspektif payı
    const ub = u * (5 - NET.z) / 5, B = place.brain || { x: place.x, y: place.y, h: place.h * NET.height };
    brain.group.position.set((B.x - W / 2) * ub, -(B.y - H / 2) * ub, NET.z);
    brain.group.scale.setScalar(B.h * ub);
  };

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  // okulun yapay zekâsının hâli: idle | listen (form odakta: karta döner) | think (gönderim: çekirdek nabız atar)
  let mood = "idle", turn = 0, glow = 0;
  const core = model.userData.parts.core;
  addEventListener("pointermove", (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  return {
    layout(p) { place = p; fit(); },
    setMood(m) { mood = m; },
    // kullanıcı yazınca beyinde bir ateşlenme patlaması
    ping() { brain.burst(8); },
    frame(t, dt, still) {
      pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
      pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
      const tt = still ? 1.2 : t;
      model.position.y = still ? 0 : Math.sin(tt * 0.8) * 0.035;                 // süzülme
      turn += ((mood === "idle" ? 0 : 0.42) - turn) * (1 - Math.exp(-dt * 3));   // dinlerken karta döner
      const sway = mood === "idle" ? 1 : 0.35;
      model.rotation.y = turn + Math.sin(tt * 0.3) * 0.32 * sway + pointer.sx * 0.25 * sway; // yavaş salınım + imleç
      const target = mood === "think" ? 0.55 + 0.45 * Math.sin(tt * 5.5) ** 2 : mood === "listen" ? 0.12 : 0;
      glow += (target - glow) * (1 - Math.exp(-dt * 6));
      core.material.emissiveIntensity = 0.35 + glow * 0.9;                          // düşünürken çekirdek nabız atar
      key.intensity = 18 + glow * 14;
      model.rotation.x = pointer.sy * 0.12 - 0.05;
      const a = tt * 0.45;                                                         // ışık harfin etrafında döner, pahta parlama kayar
      key.position.set(rig.position.x + Math.cos(a) * 2.2 * rig.scale.x, rig.position.y + 1.1 * rig.scale.x, Math.sin(a) * 2.2 + 1.5);
      brain.group.rotation.y = Math.sin(tt * 0.12) * 0.3 + pointer.sx * 0.12;    // dar dönüş: yan siluet hep okunur, yarıküreler derinlik verir
      brain.group.rotation.x = pointer.sy * 0.08;
      if (!still) brain.update(dt, mood);
      renderer.render(scene, camera);
    },
    model, renderer,
  };
}
