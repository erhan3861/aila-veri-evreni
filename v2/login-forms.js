// Okul giriş sayfalarının ortak sekme ve form mantığı (giris.html, giris-ilkokul.html).
// Sayfaya özgü tepkiler hooks ile gelir: focus(el), input(el), blur(), busy(true|false, odakta).
// text ile düğme ve sonuç metinleri değiştirilebilir (ilkokul sayfası çocuğa hitap eder).
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initLoginForms({ school, hooks = {}, text = {} }) {
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

  // sayfanın kendi tepkileri (yetişkin sayfasında monogram dinler/düşünür, ilkokulda maskot)
  const panel = $(".panel");
  panel.addEventListener("focusin", (e) => hooks.focus?.(e.target));
  panel.addEventListener("input", (e) => hooks.input?.(e.target));
  panel.addEventListener("focusout", () => setTimeout(() => { if (!panel.contains(document.activeElement)) hooks.blur?.(); }, 0));

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
      btn.disabled = true; btn.textContent = (text.working || WORKING)[kind]; hooks.busy?.(true);
      // TODO: gerçek uçlar — giriş: kurum SSO / AI-LA oturum, yarışma: aktivasyon API, form: Mini CRM
      await new Promise((r) => setTimeout(r, 900));
      btn.disabled = false; btn.innerHTML = `${(text.label || LABEL)[kind]}<svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg>`;
      hooks.busy?.(false, panel.contains(document.activeElement));
      status.textContent = (text.done || DONE)[kind]();
    });
  });
  $("[data-sso]").addEventListener("click", () => { const s = $("#p-giris [data-status]"); s.classList.remove("bad"); s.textContent = "Demo: gerçek sitede okulunuzun oturum sayfası açılır."; });

  return { start() { if (fromHash) selectTab(fromHash, false); else moveInd(); } };
}
