// AI-LA veri evreni: tek parçacık sistemi, üç düzen.
//   galaksi (img2threejs, M51 referansı) → ekosistem (6 platform kümesi) → beceri grafiği.
// Her parçacık üç konumu birden taşır; geçişi vertex shader yapar (parçacık başına gecikme + yay),
// CPU kare başına yalnızca birkaç uniform yazar. Galaksi ölçüleri: aila_site/galaksi3d/object-sculpt-spec.json
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { PRODUCTS, AREAS, FLOWS } from "./data.js";

// ---------- yeniden kurulum verisi (spec'in kodda kalan kopyası) ----------
export const GALAXY = {
  pitchDeg: 11.7,          // ölçülen değer; 14° kolları 1,35 turda bırakıyordu, M51 ~1,75 tur (gözden geçirme 2)
  r0: 0.1,                 // kolların başladığı yarıçap (disk = 1)
  bulgeScale: 0.11,
  armSigma: [0.022, 0.045], // kola dik saçılma: a + b·r (inceltme 1: 0.035 + 0.07r kolları dağıtıyordu)
  hiiClumps: 70,
  dustOffset: -0.045,      // toz şeridi kolun iç (içbükey) yüzünde
  colors: { core: "#ecddc8", inner: "#b49787", arm: "#aebfd8", hii: "#ff5c7a", dust: "#3a2620", nucleus: "#fff4e0" },
  share: { arm: 0.54, disk: 0.1, bulge: 0.14, hii: 0.035, fringe: 0.055, halo: 0.13 },
};

// altı yetkinlik alanı: OKLCH'de eşit açıklık ve doygunluk, yalnızca ton döner (color-motion)
export const AREA_COLORS = ["#7cb6ff", "#f58fc5", "#f3b45b", "#5fd3b5", "#b49bff", "#ff8f78"];

const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const hex = (h) => new THREE.Color(h);
const lerpC = (a, b, t) => a.clone().lerp(b, t);

// ---------- galaksi: img2threejs fabrikası (disk yarıçapı 1, xy düzlemi) ----------
export function createAilaGalaxyModel(count, seed = 11) {
  const r = rng(seed), G = GALAXY, C = Object.fromEntries(Object.entries(G.colors).map(([k, v]) => [k, hex(v)]));
  const k = Math.tan(THREE.MathUtils.degToRad(G.pitchDeg));
  const thMax = Math.log(1 / G.r0) / k;
  const pts = [];  // {p:[x,y,z], c:Color, w:okul ağırlığı, s:boy, role}
  const dust = [];
  const armPoint = (u, phase) => {
    const th = u * thMax, rad = G.r0 * Math.exp(k * th), a = th + phase;
    const x = rad * Math.cos(a), y = rad * Math.sin(a);
    // log spiralin teğeti ve içe bakan normali
    const tx = k * Math.cos(a) - Math.sin(a), ty = k * Math.sin(a) + Math.cos(a);
    const tl = Math.hypot(tx, ty);
    let nx = -ty / tl, ny = tx / tl;
    if (nx * x + ny * y > 0) { nx = -nx; ny = -ny; }
    return { x, y, rad, nx, ny };
  };
  const diskColor = (rad) => rad < 0.25 ? lerpC(C.core, C.inner, rad / 0.25) : lerpC(C.inner, C.arm, Math.min(1, (rad - 0.25) / 0.45));
  const n = (share) => Math.round(count * share);

  for (let i = 0; i < n(G.share.arm); i++) {
    const a = armPoint(Math.pow(r(), 0.85), r() < 0.5 ? 0 : Math.PI);
    const sig = G.armSigma[0] + G.armSigma[1] * a.rad;
    const off = gauss(r) * sig, along = gauss(r) * sig * 0.6;
    pts.push({ p: [a.x + a.nx * off - a.ny * along, a.y + a.ny * off + a.nx * along, gauss(r) * 0.02 * (1 - a.rad * 0.5)],
      c: diskColor(a.rad), w: THREE.MathUtils.smoothstep(a.rad, 0.15, 0.7) * 0.2, s: 0.9 + r() * 1.3, role: "arm" });
    if (r() < 0.24) dust.push([a.x + a.nx * (G.dustOffset + gauss(r) * 0.012), a.y + a.ny * (G.dustOffset + gauss(r) * 0.012), 0.01]);
  }
  // yaygın disk: kolların arasındaki sönük ışık (inceltme 1: referansta kollar arası boş değil)
  for (let i = 0; i < n(G.share.disk); i++) {
    const rad = Math.min(1, -0.32 * Math.log(1 - r() * 0.95)), th = r() * Math.PI * 2;
    pts.push({ p: [rad * Math.cos(th), rad * Math.sin(th), gauss(r) * 0.015], c: diskColor(rad).multiplyScalar(0.7), w: 0.1, s: 0.35 + r() * 0.4, role: "arm" });
  }
  for (let i = 0; i < n(G.share.bulge); i++) {
    const rad = Math.min(0.35, -G.bulgeScale * Math.log(1 - r() * 0.98)), th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
    pts.push({ p: [rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph) * 0.6],
      c: lerpC(C.nucleus, C.core, rad / 0.35), w: 0, s: 0.7 + r() * 0.8, role: "bulge" });
  }
  const perClump = Math.max(4, Math.round(n(G.share.hii) / G.hiiClumps));
  for (let c = 0; c < G.hiiClumps; c++) {
    const a = armPoint(0.45 + r() * 0.55, r() < 0.5 ? 0 : Math.PI);
    for (let j = 0; j < perClump; j++) {
      pts.push({ p: [a.x - a.nx * 0.03 + gauss(r) * 0.012, a.y - a.ny * 0.03 + gauss(r) * 0.012, gauss(r) * 0.01],
        c: C.hii, w: 0.55, s: 0.8 + r() * 0.9, role: "hii" });
    }
  }
  for (let i = 0; i < n(G.share.fringe); i++) {
    const rad = 0.7 + r() * 0.35, th = r() * Math.PI * 2;
    pts.push({ p: [rad * Math.cos(th), rad * Math.sin(th), gauss(r) * 0.03], c: C.arm, w: 0.4, s: 0.35 + r() * 0.5, role: "fringe" });
  }
  // halo: diskin çevresinde seyrek alan yıldızları; sonraki düzenlerde arka plan olarak kalır
  for (let i = 0; i < n(G.share.halo); i++) {
    const rad = 1.1 + r() * 1.6, th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
    pts.push({ p: [rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph)],
      c: lerpC(C.arm, hex("#ffffff"), r()), w: 0.15, s: 0.25 + r() * 0.45, role: "halo" });
  }
  // çekirdek: tek büyük yumuşak sprite
  pts.push({ p: [0, 0, 0], c: C.nucleus, w: 0, s: 26, role: "nucleus" });
  return { points: pts, dust, spec: G };
}

// ---------- ekosistem ve grafik düzenleri (dünya birimi, ekran düzenine göre kurulur) ----------
function layouts(L) {
  const prodE = PRODUCTS.map((_, i) => {
    const a = -Math.PI / 2 + Math.PI / 6 + (i / PRODUCTS.length) * Math.PI * 2;
    return new THREE.Vector3(L.eco.x + Math.cos(a) * L.eco.rx, L.eco.y + Math.sin(a) * L.eco.ry, 0);
  });
  const coreE = new THREE.Vector3(L.eco.x, L.eco.y, 0);
  const K = L.graph;
  const center = new THREE.Vector3(K.x, K.y, 0);
  const hubs = AREAS.map((_, i) => {
    const a = -Math.PI / 2 + (i / AREAS.length) * Math.PI * 2;
    return new THREE.Vector3(K.x + Math.cos(a) * K.hub * 1.12, K.y + Math.sin(a) * K.hub * 1.12, (i % 2 ? 0.1 : -0.1));
  });
  const leaves = AREAS.map((area, i) => {
    const a0 = -Math.PI / 2 + (i / AREAS.length) * Math.PI * 2;
    return area.skills.map((_, j) => {
      const a = a0 + (j - (area.skills.length - 1) / 2) * 0.5;
      return new THREE.Vector3(hubs[i].x + Math.cos(a) * K.leaf, hubs[i].y + Math.sin(a) * K.leaf, hubs[i].z * 1.6);
    });
  });
  const prodK = PRODUCTS.map((_, i) => {
    const a = -Math.PI / 2 + Math.PI / 6 + (i / PRODUCTS.length) * Math.PI * 2;
    return new THREE.Vector3(K.x + Math.cos(a) * K.prod, K.y + Math.sin(a) * K.prod * K.prodSquash, 0);
  });
  return { prodE, coreE, center, hubs, leaves, prodK };
}

// ---------- sahne ----------
const VERT = /* glsl */`
  attribute vec3 pE; attribute vec3 pK;
  attribute vec4 cG; attribute vec4 cE; attribute vec4 cK;
  attribute vec4 sz;      // boy: galaksi, ekosistem, grafik; w = tohum
  attribute vec4 stream;  // xyz: akışın kaynağı (platform), w: hız (0 = sabit)
  uniform float uE, uK, uTime, uPR, uScale, uDust, uSpin;
  uniform mat4 uGal;
  uniform vec3 uS2;
  varying vec3 vCol; varying float vA;
  float ease(float t) { return t < .5 ? 4. * t * t * t : 1. - pow(-2. * t + 2., 3.) / 2.; }
  void main() {
    float seed = sz.w;
    vec3 g = position;
    float r = length(g.xy);
    float ang = uSpin * .045 / (.22 + r);          // diferansiyel dönüş: iç bölge hızlı
    float c = cos(ang), s = sin(ang);
    g.xy = vec2(c * g.x - s * g.y, s * g.x + c * g.y);
    vec3 G = (uGal * vec4(g, 1.)).xyz;
    vec3 E = pE + vec3(.018 * sin(uTime * .7 + seed * 40.), .018 * cos(uTime * .6 + seed * 31.), 0.);
    vec3 K = pK;
    float flowT = fract(uTime * stream.w + seed);
    if (stream.w > 0.) K = mix(stream.xyz, pK, flowT);
    float d = seed * .35;                            // parçacık başına gecikme: sürü gibi akar
    float e1 = ease(clamp((uE - d) / .65, 0., 1.));
    float e2 = ease(clamp((uK - d) / .65, 0., 1.));
    vec3 p = mix(G, E, e1);
    p.z += sin(3.14159 * e1) * (seed - .5) * 1.2;   // uçuşta yay
    p.xy += sin(3.14159 * e1) * vec2(-(p.y), p.x) * .06;
    p = mix(p, K, e2);
    p.z += sin(3.14159 * e2) * (seed - .5) * .9;
    vec4 col = mix(mix(cG, cE, e1), cK, e2);
    vCol = mix(col.rgb, uS2, col.w);
    float size = mix(mix(sz.x, sz.y, e1), sz.z, e2);
    vA = 1.;
    if (stream.w > 0.) vA = mix(1., smoothstep(0., .12, flowT) * smoothstep(1., .82, flowT), e2);
    vA *= mix(1., 1. - e1, uDust);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_PointSize = size * uPR * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */`
  uniform float uAlpha, uDark;
  varying vec3 vCol; varying float vA;
  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    float a = pow(1. - d * 2., 1.7) * vA * uAlpha;
    gl_FragColor = uDark > .5 ? vec4(vCol, a * .7) : vec4(vCol * a, a);
  }`;

export function createUniverse(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 7);
  const COUNT = mobile ? 6000 : 14000;
  const galaxy = createAilaGalaxyModel(COUNT);
  const uniforms = {
    uE: { value: 0 }, uK: { value: 0 }, uTime: { value: 0 }, uSpin: { value: 0 }, uPR: { value: renderer.getPixelRatio() },
    uScale: { value: 46 }, uGal: { value: new THREE.Matrix4() }, uS2: { value: new THREE.Color("#a6aefb") },
    uAlpha: { value: 1 }, uDust: { value: 0 }, uDark: { value: 0 },
  };
  const starMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const dustUniforms = { ...uniforms, uDust: { value: 1 }, uDark: { value: 1 }, uAlpha: { value: 0.75 } };
  const dustMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: dustUniforms, transparent: true, depthWrite: false, blending: THREE.NormalBlending });

  const stars = new THREE.Points(new THREE.BufferGeometry(), starMat);
  const dust = new THREE.Points(new THREE.BufferGeometry(), dustMat);
  stars.frustumCulled = dust.frustumCulled = false;
  dust.renderOrder = 1; stars.renderOrder = 2;
  scene.add(dust, stars);

  const ecoLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const graphLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(ecoLines, graphLines);

  // canlı veri darbeleri: platformdan beceri alanına giden parlak noktalar
  const PULSES = 10;
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PULSES * 3), 3));
  const pulseMat = new THREE.PointsMaterial({ size: mobile ? 14 : 18, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTexture(), color: 0xffffff });
  const pulses = new THREE.Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  scene.add(pulses);
  const live = []; // {from, to, t0, dur, i, onArrive}

  let L = null, anchors = null;
  const v = new THREE.Vector3();

  function build(layout) {
    L = layout;
    anchors = layouts(L);
    const r = rng(23);
    const N = galaxy.points.length;
    const pos = new Float32Array(N * 3), pE = new Float32Array(N * 3), pK = new Float32Array(N * 3);
    const cG = new Float32Array(N * 4), cE = new Float32Array(N * 4), cK = new Float32Array(N * 4);
    const sz = new Float32Array(N * 4), st = new Float32Array(N * 4);
    const white = hex("#eef1ff"), warm = hex("#fff1dc");
    const flowsIdx = FLOWS.map(([p, a]) => [PRODUCTS.findIndex((x) => x.id === p), AREAS.findIndex((x) => x.id === a)]);
    const put = (arr, i, x, y, z) => { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; };
    const putC = (arr, i, c, w) => { arr[i * 4] = c.r; arr[i * 4 + 1] = c.g; arr[i * 4 + 2] = c.b; arr[i * 4 + 3] = w; };
    const ball = (c, s) => [c.x + gauss(r) * s, c.y + gauss(r) * s, c.z + gauss(r) * s * 0.6];
    const onLine = (a, b, j) => { const t = 0.12 + r() * 0.76; return [a.x + (b.x - a.x) * t + gauss(r) * j, a.y + (b.y - a.y) * t + gauss(r) * j, a.z + (b.z - a.z) * t]; };

    galaxy.points.forEach((g, i) => {
      put(pos, i, ...g.p);
      putC(cG, i, g.c, g.w);
      const seed = r();
      const halo = g.role === "halo";
      // --- ekosistem ---
      let e, ec, ew, es;
      const q = r();
      if (g.role === "nucleus") { e = [anchors.coreE.x, anchors.coreE.y, 0]; ec = warm; ew = 0.35; es = 30; }
      else if (halo) { e = [anchors.coreE.x + gauss(r) * 2.6, anchors.coreE.y + gauss(r) * 1.6, -1 - r() * 2]; ec = white; ew = 0.2; es = 0.3 + r() * 0.4; }
      else if (q < 0.14) { e = ball(anchors.coreE, 0.17); ec = warm; ew = 0.55; es = 0.6 + r() * 0.8; }
      else if (q < 0.86) { const pi = Math.floor(r() * PRODUCTS.length); e = ball(anchors.prodE[pi], 0.12); ec = white; ew = 0.45; es = 0.5 + r() * 0.9; }
      else { const pi = Math.floor(r() * PRODUCTS.length); e = onLine(anchors.coreE, anchors.prodE[pi], 0.012); ec = white; ew = 0.75; es = 0.35 + r() * 0.3; }
      put(pE, i, ...e); putC(cE, i, ec, ew);
      // --- beceri grafiği ---
      let k, kc, kw, ks, sp = 0, src = [0, 0, 0];
      const z = r();
      if (g.role === "nucleus") { k = [anchors.center.x, anchors.center.y, 0]; kc = warm; kw = 0.3; ks = 34; }
      else if (halo) { k = [anchors.center.x + gauss(r) * 2.8, anchors.center.y + gauss(r) * 1.8, -1.5 - r() * 2]; kc = white; kw = 0.15; ks = 0.3 + r() * 0.3; }
      else if (z < 0.06) { k = ball(anchors.center, 0.09); kc = warm; kw = 0.3; ks = 0.8 + r(); }
      else if (z < 0.36) { const ai = Math.floor(r() * AREAS.length); k = ball(anchors.hubs[ai], 0.075); kc = hex(AREA_COLORS[ai]); kw = 0; ks = 0.7 + r() * 0.9; }
      else if (z < 0.46) { const ai = Math.floor(r() * AREAS.length); const lf = anchors.leaves[ai]; k = ball(lf[Math.floor(r() * lf.length)], 0.03); kc = hex(AREA_COLORS[ai]); kw = 0; ks = 0.5 + r() * 0.5; }
      else if (z < 0.56) { const ai = Math.floor(r() * AREAS.length); const lf = anchors.leaves[ai];
        k = r() < 0.5 ? onLine(anchors.center, anchors.hubs[ai], 0.006) : onLine(anchors.hubs[ai], lf[Math.floor(r() * lf.length)], 0.004);
        kc = hex(AREA_COLORS[ai]).multiplyScalar(0.7); kw = 0; ks = 0.3 + r() * 0.25; }
      else if (z < 0.70) { const pi = Math.floor(r() * PRODUCTS.length); k = ball(anchors.prodK[pi], 0.06); kc = white; kw = 0.4; ks = 0.4 + r() * 0.6; }
      else { const [pi, ai] = flowsIdx[Math.floor(r() * flowsIdx.length)]; const h = anchors.hubs[ai], p = anchors.prodK[pi];
        k = [h.x, h.y, h.z]; src = [p.x + gauss(r) * 0.03, p.y + gauss(r) * 0.03, p.z]; sp = 0.07 + r() * 0.09; kc = white; kw = 0.85; ks = 0.45 + r() * 0.4; }
      put(pK, i, ...k); putC(cK, i, kc, kw);
      sz[i * 4] = g.s; sz[i * 4 + 1] = es; sz[i * 4 + 2] = ks; sz[i * 4 + 3] = seed;
      st[i * 4] = src[0]; st[i * 4 + 1] = src[1]; st[i * 4 + 2] = src[2]; st[i * 4 + 3] = sp;
    });
    const geo = stars.geometry;
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("pE", new THREE.BufferAttribute(pE, 3));
    geo.setAttribute("pK", new THREE.BufferAttribute(pK, 3));
    geo.setAttribute("cG", new THREE.BufferAttribute(cG, 4));
    geo.setAttribute("cE", new THREE.BufferAttribute(cE, 4));
    geo.setAttribute("cK", new THREE.BufferAttribute(cK, 4));
    geo.setAttribute("sz", new THREE.BufferAttribute(sz, 4));
    geo.setAttribute("stream", new THREE.BufferAttribute(st, 4));

    // toz: yalnızca galakside görünür, ekosisteme geçerken söner
    const D = galaxy.dust.length, dp = new Float32Array(D * 3), dc = new Float32Array(D * 4), ds = new Float32Array(D * 4), dz = new Float32Array(D * 4);
    const dustC = hex(GALAXY.colors.dust);
    galaxy.dust.forEach((p, i) => { put(dp, i, ...p); putC(dc, i, dustC, 0); ds[i * 4] = 1.1 + r(); ds[i * 4 + 1] = 0.01; ds[i * 4 + 2] = 0.01; ds[i * 4 + 3] = r(); });
    const dg = dust.geometry;
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    dg.setAttribute("pE", new THREE.BufferAttribute(dp.slice(), 3));
    dg.setAttribute("pK", new THREE.BufferAttribute(dp.slice(), 3));
    ["cG", "cE", "cK"].forEach((n) => dg.setAttribute(n, new THREE.BufferAttribute(dc, 4)));
    dg.setAttribute("sz", new THREE.BufferAttribute(ds, 4));
    dg.setAttribute("stream", new THREE.BufferAttribute(dz, 4));

    // çizgiler
    const ep = [];
    anchors.prodE.forEach((p) => ep.push(anchors.coreE.x, anchors.coreE.y, 0, p.x, p.y, 0));
    ecoLines.geometry.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3));
    const gp = [], gc = [];
    const seg = (a, b, col, k = 1) => { gp.push(a.x, a.y, a.z, b.x, b.y, b.z); const c = hex(col).multiplyScalar(k); gc.push(c.r, c.g, c.b, c.r, c.g, c.b); };
    AREAS.forEach((_, i) => {
      seg(anchors.center, anchors.hubs[i], AREA_COLORS[i], 0.5);
      anchors.leaves[i].forEach((lf) => seg(anchors.hubs[i], lf, AREA_COLORS[i], 0.25));
    });
    flowsIdx.forEach(([pi, ai]) => seg(anchors.prodK[pi], anchors.hubs[ai], "#ffffff", 0.09));
    graphLines.geometry.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    graphLines.geometry.setAttribute("color", new THREE.Float32BufferAttribute(gc, 3));

    // galaksi yerleşimi: eğik disk, ekranın sağında
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(L.gal.x, L.gal.y, 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(L.gal.tilt, 0, L.gal.roll)),
      new THREE.Vector3(L.gal.r, L.gal.r, L.gal.r));
    uniforms.uGal.value.copy(m);
  }

  function size(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // ekran pikseli → z=0 düzleminde dünya birimi (kamera z=7, fov 35)
  const unitsPerPx = (h) => (2 * 7 * Math.tan(THREE.MathUtils.degToRad(17.5))) / h;

  function project(p, w, h) {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
  }

  // galaksi düzleminde bir noktanın dünya konumu (rol kartlarının yörüngesi için)
  const galPoint = (x, y) => new THREE.Vector3(x, y, 0).applyMatrix4(uniforms.uGal.value);

  function pulse(pi, ai, onArrive) {
    const slot = [...Array(PULSES).keys()].find((i) => !live.some((l) => l.i === i));
    if (slot === undefined) return;
    live.push({ i: slot, from: anchors.prodK[pi], to: anchors.hubs[ai], t0: performance.now(), dur: 1400, onArrive });
  }

  function render(t, state) {
    uniforms.uTime.value = t;
    uniforms.uSpin.value = state.spin;
    uniforms.uE.value = state.e;
    uniforms.uK.value = state.k;
    dustUniforms.uTime.value = t; dustUniforms.uSpin.value = state.spin; dustUniforms.uE.value = state.e; dustUniforms.uK.value = state.k;
    ecoLines.material.opacity = 0.16 * THREE.MathUtils.smoothstep(state.e, 0.75, 1) * (1 - THREE.MathUtils.smoothstep(state.k, 0, 0.3));
    graphLines.material.opacity = 0.55 * THREE.MathUtils.smoothstep(state.k, 0.7, 1);
    // darbeler
    const arr = pulseGeo.attributes.position.array;
    arr.fill(9999);
    const now = performance.now();
    for (let j = live.length - 1; j >= 0; j--) {
      const l = live[j];
      const u = Math.min(1, (now - l.t0) / l.dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      v.copy(l.from).lerp(l.to, e);
      arr[l.i * 3] = v.x; arr[l.i * 3 + 1] = v.y; arr[l.i * 3 + 2] = v.z;
      if (u >= 1) { live.splice(j, 1); l.onArrive?.(); }
    }
    pulseGeo.attributes.position.needsUpdate = true;
    pulseMat.opacity = THREE.MathUtils.smoothstep(state.k, 0.85, 1);
    camera.position.x = state.px * 0.22;
    camera.position.y = -state.py * 0.14;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  function setSchool(c2) { uniforms.uS2.value.set(c2); }

  return { build, size, render, project, pulse, setSchool, galPoint, unitsPerPx, get anchors() { return anchors; }, camera, renderer, galaxy };
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,.75)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
