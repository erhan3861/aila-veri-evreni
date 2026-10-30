// AI-LA veri evreni — simülasyon verisi. Gerçek öğrenci verisi değildir.

export const PRODUCTS = [
  { id: "t14", name: "TALENT14", logo: "assets/talent14.png", desc: "Dijital beceri ve teknoloji eğitimi" },
  { id: "okumino", name: "Okumino", logo: "assets/okumino-logo.png", tall: true, desc: "Hızlı okuma çalışmaları" },
  { id: "codemino", name: "Codemino", logo: "assets/codemino-logo.png", tall: true, desc: "Kodlama becerileri" },
  { id: "tc", name: "TALENT CUP", logo: "assets/talentcup-mark.png", desc: "Öğrenci yarışmaları ve projeler", mark: true },
  { id: "aig", name: "AI-GALAXY", logo: "assets/ai-galaxy.png", desc: "Yapay zekâ okuryazarlığı", mono: true },
  // kurumun kullandığı içerik platformu (hangisi entegre olursa): markasız, yazıyla
  { id: "icerik", name: "Dijital İçerik Platformu", label: true, desc: "Kurumunuzun içerik platformu" },
];

// Altı beceri alanı: Türkiye Yüzyılı Maarif Modeli beceri çerçevesi (MEB, 2024). Her alanın 3 alt kırılımı
// grafikte yaprak düğümdür; parantezdeki kodlar çerçevedeki kısaltmalar (kontrol için).
// shape: renge ek olarak düğüm biçimi (renk tek başına anlam taşımasın)
export const AREAS = [
  { id: "kavramsal", name: "Kavramsal Beceriler", short: "Kavramsal", shape: "circle",
    skills: ["Temel beceriler", "Bütünleşik beceriler", "Üst düzey düşünme"] },              // KB1, KB2, KB3
  { id: "alan", name: "Alan Becerileri", short: "Alan", shape: "diamond",
    skills: ["Matematik", "Fen bilimleri", "Türkçe"] },                                     // derse özgü alan becerileri
  { id: "egilim", name: "Eğilimler", short: "Eğilimler", shape: "square",
    skills: ["Benlik eğilimleri", "Sosyal eğilimler", "Entelektüel eğilimler"] },           // E1, E2, E3
  { id: "sdo", name: "Sosyal-Duygusal Öğrenme Becerileri", short: "Sosyal-Duygusal", shape: "triangle",
    skills: ["Benlik", "Sosyal yaşam", "Ortak / uyum"] },                                   // SDB1, SDB2, SDB3
  { id: "okuryazarlik", name: "Okuryazarlık Becerileri", short: "Okuryazarlık", shape: "hex",
    skills: ["Bilgi okuryazarlığı", "Dijital okuryazarlık", "Görsel okuryazarlık"] },        // OB1, OB2, OB4
  { id: "erdem", name: "Erdem-Değer-Eylem", short: "Erdem-Değer", shape: "ring",
    skills: ["Sorumluluk", "Saygı", "Dürüstlük"] },                                         // değerlerden örnekler
];

// Hangi platformun verisi hangi beceriyi besliyor: [ürün, alan, alt kırılım sırası]
// (ekosistem → beceri haritası kenarları ve canlı akış)
export const FLOWS = [
  ["t14", "kavramsal", 2], ["t14", "okuryazarlik", 1],
  ["okumino", "okuryazarlik", 0], ["okumino", "kavramsal", 0],
  ["codemino", "kavramsal", 2], ["codemino", "alan", 0],
  ["tc", "sdo", 1], ["tc", "egilim", 1], ["tc", "erdem", 0],
  ["aig", "okuryazarlik", 2], ["aig", "erdem", 2],
  ["icerik", "alan", 1], ["icerik", "egilim", 2],
];

// sub: her alanın 3 alt kırılımının puanı (alan puanı bunların ortalaması)
export const STUDENTS = [
  {
    id: "elif", name: "Elif Y.", grade: "7. Sınıf", sources: 6, score: 84,
    sub: { kavramsal: [86, 82, 78], alan: [74, 88, 79], egilim: [82, 71, 90], sdo: [80, 82, 78], okuryazarlik: [62, 85, 89], erdem: [84, 80, 83] },
    advice: "Okumino'da çıkarım ve kaynak karşılaştırma görevleriyle bilgi okuryazarlığını güçlendir.",
    events: [
      ["okumino", "okuryazarlik", 0, 2, "Kaynak karşılaştırma görevi"],
      ["t14", "kavramsal", 2, 1, "Problem çözme görevi 3/4 adım"],
      ["icerik", "alan", 1, 1, "Fotosentez dersi: ara sorular tamam"],
      ["codemino", "kavramsal", 2, 2, "Hata ayıklama görevi"],
      ["tc", "sdo", 1, 1, "Takım projesine katkı"],
      ["aig", "erdem", 2, 1, "Modül 4: Yapay zekâ ve dürüstlük"],
    ],
  },
  {
    id: "kerem", name: "Kerem A.", grade: "10. Sınıf", sources: 5, score: 79,
    sub: { kavramsal: [84, 88, 86], alan: [90, 77, 70], egilim: [80, 64, 85], sdo: [72, 58, 66], okuryazarlik: [78, 86, 70], erdem: [82, 74, 80] },
    advice: "Talent Cup takım projelerinde dönüşümlü rol alarak sosyal yaşam becerilerini geliştir.",
    events: [
      ["codemino", "alan", 0, 1, "Döngüler modülü tamamlandı"],
      ["tc", "sdo", 1, 2, "Takım toplantısına katıldı"],
      ["t14", "okuryazarlik", 1, 1, "Dijital güvenlik görevi"],
      ["icerik", "egilim", 2, 2, "Kimya dersi: deney sorusu üretti"],
      ["okumino", "kavramsal", 0, 1, "Okuma hızı +18 kelime/dk"],
    ],
  },
  {
    id: "zeynep", name: "Zeynep K.", grade: "4. Sınıf", sources: 4, score: 77,
    sub: { kavramsal: [72, 66, 60], alan: [64, 70, 78], egilim: [86, 84, 80], sdo: [82, 88, 79], okuryazarlik: [68, 74, 84], erdem: [80, 86, 78] },
    advice: "İçerik platformundaki kısa adım adım derslerle üst düzey düşünme sorularına alış.",
    events: [
      ["aig", "okuryazarlik", 2, 1, "Modül 2: Yapay zekâ nedir?"],
      ["okumino", "okuryazarlik", 0, 2, "Ana fikir alıştırması"],
      ["tc", "egilim", 1, 1, "Sınıf yarışmasına katıldı"],
      ["icerik", "alan", 1, 1, "Kesirler dersi: mini sınav"],
    ],
  },
];
