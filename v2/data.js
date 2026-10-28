// AI-LA veri evreni — simülasyon verisi. Gerçek öğrenci verisi değildir; Elif'in rakamları
// index.html'deki "Kendini Tanı" raporuyla aynıdır, diğer iki öğrenci aynı yapıda örnektir.

export const PRODUCTS = [
  { id: "t14", name: "TALENT14", logo: "assets/talent14.png", desc: "Dijital beceri ve teknoloji eğitimi" },
  { id: "okumino", name: "Okumino", logo: "assets/okumino-logo.png", tall: true, desc: "Hızlı okuma çalışmaları" },
  { id: "codemino", name: "Codemino", logo: "assets/codemino-logo.png", tall: true, desc: "Kodlama becerileri" },
  { id: "tc", name: "TALENT CUP", logo: "assets/talentcup-mark.png", desc: "Öğrenci yarışmaları ve projeler", mark: true },
  { id: "aig", name: "AI-GALAXY", logo: "assets/ai-galaxy.png", desc: "Yapay zekâ okuryazarlığı", mono: true },
  { id: "genwi", name: "genwi", logo: "assets/genwi.webp", desc: "Görsel, video ve ses stüdyosu", mono: true, plus: true },
];

// Altı yetkinlik alanı = rapordaki altı çubuk. Her alanın 2-3 alt becerisi grafikte yaprak düğümdür.
// shape: renge ek olarak düğüm biçimi (renk tek başına anlam taşımasın)
export const AREAS = [
  { id: "arastirma", name: "Araştırma ve Keşif", short: "Araştırma", shape: "circle", skills: ["Soru sorma", "Kaynak tarama", "Hipotez kurma"] },
  { id: "gorsel", name: "Görsel Üretim", short: "Görsel", shape: "diamond", skills: ["Prompt yazımı", "Kompozisyon", "Görsel hikâye"] },
  { id: "akis", name: "Akış / Süreç Takibi", short: "Akış", shape: "square", skills: ["Adım planlama", "Görev sürekliliği"] },
  { id: "okuma", name: "Eleştirel Okuma", short: "Okuma", shape: "triangle", skills: ["Çıkarım", "Ana fikir", "Okuma hızı"] },
  { id: "olcme", name: "Ölçme-Değerlendirme", short: "Ölçme", shape: "hex", skills: ["Öz değerlendirme", "Hata analizi"] },
  { id: "isbirligi", name: "İşbirliği ve Topluluk", short: "İşbirliği", shape: "ring", skills: ["Takım projesi", "Geri bildirim verme"] },
];

// Hangi platformun verisi hangi alanı besliyor (ekosistem → beceri haritası kenarları)
export const FLOWS = [
  ["t14", "arastirma"], ["t14", "akis"], ["t14", "olcme"],
  ["okumino", "okuma"],
  ["codemino", "akis"], ["codemino", "olcme"],
  ["tc", "isbirligi"], ["tc", "gorsel"],
  ["aig", "arastirma"], ["aig", "gorsel"],
  ["genwi", "gorsel"],
];

export const STUDENTS = [
  {
    id: "elif", name: "Elif Y.", grade: "7. Sınıf", sources: 6, score: 84,
    areas: { arastirma: 82, gorsel: 88, akis: 61, okuma: 58, olcme: 64, isbirligi: 76 },
    profiles: ["Keşfederek öğrenen", "Görsel odaklı"],
    signals: [
      ["TALENT14", "Uygulamalı görevler güçlü; ileri seviye problem çözmede tekrar ihtiyacı var."],
      ["Okumino", "Eleştirel okuma ve çıkarım adımlarında ek destek faydalı."],
      ["AI-LA", "Chat yoğun, akış ve görev kullanımı düşük: yapılandırılmış öğrenme önerilir."],
    ],
    advice: [
      "Serbest keşiften kısa, yapılandırılmış akışlara geçiş",
      "Görsel içerikle başlayıp görev modülünde mikro uygulama",
      "TALENT14 ve Okumino verisine göre çıkarım odaklı ölçme seti",
    ],
    // canlı akış: [ürün, alan, artış, olay]
    events: [
      ["okumino", "okuma", 2, "Çıkarım testi tamamlandı"],
      ["t14", "akis", 1, "Akış görevi 3/4 adım"],
      ["genwi", "gorsel", 1, "Görsel hikâye paylaşıldı"],
      ["codemino", "olcme", 2, "Hata ayıklama görevinde öz değerlendirme"],
      ["tc", "isbirligi", 1, "Takım projesine katkı"],
      ["aig", "arastirma", 1, "Modül 4: Kaynak doğrulama"],
    ],
  },
  {
    id: "kerem", name: "Kerem A.", grade: "10. Sınıf", sources: 5, score: 79,
    areas: { arastirma: 71, gorsel: 62, akis: 86, okuma: 74, olcme: 81, isbirligi: 58 },
    profiles: ["Adım adım çalışan", "Geri bildirimle gelişen"],
    signals: [
      ["Codemino", "Algoritma görevlerinde istikrarlı; yeni kavramlarda örnek ihtiyacı var."],
      ["TALENT CUP", "Takım içi rol alma düşük; bireysel teslimde güçlü."],
      ["AI-LA", "Akış kullanımı yüksek: proje tabanlı ajanlara hazır."],
    ],
    advice: [
      "Takım projelerinde dönüşümlü rol (sunucu, araştırmacı, tasarımcı)",
      "Görsel üretim için kısa prompt alıştırmaları",
      "Codemino ölçme setinden ileri seviye problem havuzu",
    ],
    events: [
      ["codemino", "akis", 1, "Döngüler modülü tamamlandı"],
      ["tc", "isbirligi", 2, "Takım toplantısına katıldı"],
      ["t14", "olcme", 1, "Haftalık değerlendirme"],
      ["genwi", "gorsel", 2, "İlk video taslağı"],
      ["okumino", "okuma", 1, "Okuma hızı +18 kelime/dk"],
    ],
  },
  {
    id: "zeynep", name: "Zeynep K.", grade: "4. Sınıf", sources: 4, score: 77,
    areas: { arastirma: 79, gorsel: 84, akis: 55, okuma: 66, olcme: 52, isbirligi: 83 },
    profiles: ["Keşfederek öğrenen", "Geri bildirimle gelişen"],
    signals: [
      ["AI-GALAXY", "Yapay zekâ kavramlarını oyunlaştırılmış görevlerle hızlı öğreniyor."],
      ["Okumino", "Okuma hızı yaş ortalamasında; ana fikirde destek faydalı."],
      ["AI-LA", "Sınıf arkadaşlarıyla ortak görevlerde motivasyon yüksek."],
    ],
    advice: [
      "Görsel hikâyeyle başlayan kısa okuma görevleri",
      "Her görev sonunda iki soruluk öz değerlendirme",
      "AI-GALAXY modüllerinde adım adım akış kartları",
    ],
    events: [
      ["aig", "arastirma", 1, "Modül 2: Yapay zekâ nedir?"],
      ["okumino", "okuma", 2, "Ana fikir alıştırması"],
      ["tc", "isbirligi", 1, "Sınıf yarışmasına katıldı"],
      ["genwi", "gorsel", 1, "Masal karakteri çizdi"],
    ],
  },
];
