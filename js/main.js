(function () {
  var root = document.documentElement;
  var menu = document.getElementById("menu");
  var menuBtn = document.getElementById("menu-btn");
  var themeBtn = document.getElementById("theme-btn");
  var status = document.getElementById("status");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxTitle = document.getElementById("lightbox-title");
  var lastFocus = null;

  function theme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function lang() {
    return root.getAttribute("data-lang") === "en" ? "en" : "pt";
  }

  function syncAlts() {
    var en = lang() === "en";
    document.querySelectorAll("[data-alt-pt]").forEach(function (img) {
      var alt = img.getAttribute(en ? "data-alt-en" : "data-alt-pt");
      if (alt) img.alt = alt;
      img.lang = en ? "en" : "pt-MZ";
    });
  }

  function syncControls() {
    var en = lang() === "en";
    var dark = theme() === "dark";
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      var on = btn.getAttribute("data-set-lang") === lang();
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var ptBtn = document.querySelector('[data-set-lang="pt"]');
    var enBtn = document.querySelector('[data-set-lang="en"]');
    if (ptBtn) ptBtn.setAttribute("aria-label", en ? "Portuguese" : "Português");
    if (enBtn) enBtn.setAttribute("aria-label", en ? "English" : "Inglês");
    if (menu) menu.setAttribute("aria-label", en ? "Sections" : "Secções");
    if (themeBtn) {
      themeBtn.title = dark
        ? (en ? "Switch to light theme" : "Ativar tema claro")
        : (en ? "Switch to dark theme" : "Ativar tema escuro");
    }
    document.title = en
      ? "Tako — personal finance in meticais"
      : "Tako — finanças pessoais em meticais";
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", dark ? "#0a1113" : "#f4f6f7");
  }

  function announce() {
    if (!status) return;
    var en = lang() === "en";
    var dark = theme() === "dark";
    status.textContent = en
      ? (dark ? "English, dark theme" : "English, light theme")
      : (dark ? "Português, tema escuro" : "Português, tema claro");
  }

  function applyTheme(next, persist) {
    root.setAttribute("data-theme", next);
    if (persist) {
      try { localStorage.setItem("tako-theme", next); } catch (e) {}
    }
    syncControls();
  }

  function applyLang(next, persist) {
    root.setAttribute("data-lang", next);
    root.lang = next === "en" ? "en" : "pt-MZ";
    if (persist) {
      try { localStorage.setItem("tako-lang", next); } catch (e) {}
    }
    syncAlts();
    syncControls();
  }

  themeBtn.addEventListener("click", function () {
    applyTheme(theme() === "dark" ? "light" : "dark", true);
    announce();
  });

  document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-set-lang"), true);
      announce();
    });
  });

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus();
    }
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", function (event) {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target) || menuBtn.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (lightbox.open) return;
    if (menu.classList.contains("is-open")) {
      closeMenu();
      menuBtn.focus();
    }
  });

  function visibleImg(btn) {
    var imgs = btn.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].offsetWidth > 0) return imgs[i];
    }
    return imgs[0];
  }

  document.querySelectorAll(".shot-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var img = visibleImg(btn);
      var figure = btn.closest("figure");
      var caption = figure ? figure.querySelector("figcaption") : null;
      lastFocus = btn;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.lang = img.lang || root.lang;
      lightboxTitle.textContent = caption ? caption.innerText : img.alt;
      lightbox.showModal();
      document.getElementById("lightbox-close").focus();
    });
  });

  document.getElementById("lightbox-close").addEventListener("click", function () {
    lightbox.close();
  });

  lightbox.addEventListener("click", function (event) {
    var rect = lightbox.getBoundingClientRect();
    var inside = rect.top <= event.clientY && event.clientY <= rect.bottom &&
      rect.left <= event.clientX && event.clientX <= rect.right;
    if (!inside) lightbox.close();
  });

  lightbox.addEventListener("close", function () {
    if (lastFocus) lastFocus.focus();
  });

  var media = window.matchMedia("(prefers-color-scheme: dark)");
  if (media.addEventListener) {
    media.addEventListener("change", function (event) {
      var stored = null;
      try { stored = localStorage.getItem("tako-theme"); } catch (e) {}
      if (stored !== "light" && stored !== "dark") {
        applyTheme(event.matches ? "dark" : "light", false);
      }
    });
  }

  syncAlts();
  syncControls();
})();
