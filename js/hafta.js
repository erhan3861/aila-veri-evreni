// Ana sayfa karuselinin haftalık içeriği. Her pazartesi yalnız bu dosya güncellenir.
// yarisma: açık bir yarışma yoksa null yapılır, slayt kendiliğinden çıkar.
// Görseller assets/hafta/ altında; öğrencilere hitap ettiği için hepsi Pixar tarzı 3D.
export const HAFTA = {
  aralik: "26 Ekim – 1 Kasım",

  // haftanın tek AI görevi; slayttan ve #gorev/<id> adresinden açılır
  gorev: {
    img: "assets/hafta/gorev-kedi.jpg",
    id: "oyun-kurali", ders: "Türkçe", t: "Oyunun kuralını anlat", teslim: "1 Kasım Pazar", durum: "Yapılacak", arac: "Sohbet",
    ozet: "Bildiğin bir oyunun kurallarını yapay zekâ ile adım adım anlat.",
    talimat: "Bildiğin bir sokak oyununu seç. Kurallarını, oyunu hiç bilmeyen birinin anlayacağı sırayla yaz. Oyunu oynarken çekilmiş bir fotoğraf ekle.",
    kriterler: [["Oyunun adı ve oyuncu sayısı yazılmış", true], ["Kurallar sıralı ve anlaşılır", true], ["En az beş cümle", false], ["Oyun denemesini gösteren görsel eklenmiş", true], ["Yazım ve noktalama doğru", false]],
  },

  yarisma: {
    img: "assets/hafta/kupa.jpg", ad: "Talent Cup 2026", slogan: "Öğren. Üret. Yarış.",
    metin: "Yarışma takvimini ve final projelerini talentcup.org’da takip et.",
    href: "https://www.talentcup.org/", cta: "Yarışmaya git",
  },

  proje: {
    img: "assets/hafta/proje.jpg", t: "Fidan diken robot ve orman dostları",
    metin: "Öğrencilerin yapay zekâ ile ürettiği kısa film. Talent14 Keşfet’te izle, beğendiğin projeye ilham ol.",
    href: "https://app.talent14.com/kesfet", cta: "Keşfet’te izle",
  },

  uretimGorsel: {
    img: "assets/hafta/uretim-gorsel.jpg", t: "Yıldızlar arasında balina yolculuğu",
    metin: "<span class='nw'>AI-GALAXY</span>’de Görsel Oluştur ile üretildi. Sıradaki sen ol.",
    href: "#araclar", cta: "Görsel oluştur",
  },

  uretimVideo: {
    video: "assets/hafta/uretim-video.mp4", poster: "assets/hafta/uretim-video.jpg", t: "Şaşkın kedi",
    metin: "Tek bir görselden sekiz saniyelik animasyon. <span class='nw'>AI-GALAXY</span>’de Video Oluştur ile hazırlandı.",
    href: "#araclar", cta: "Video oluştur",
  },

  ilham: {
    img: "assets/hafta/ilham.jpg",
    soz: "Hayal gücü bilgiden daha önemlidir.", kim: "Albert Einstein",
  },
};
