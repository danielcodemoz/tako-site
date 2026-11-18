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

  var shotIndex = 0;
  var lockedScroll = 0;

  function shotButtons() {
    return Array.prototype.slice.call(document.querySelectorAll(".shot-btn"));
  }

  function showShot(index) {
    var buttons = shotButtons();
    if (!buttons.length) return;
    shotIndex = (index + buttons.length) % buttons.length;
    var btn = buttons[shotIndex];
    var img = visibleImg(btn);
    var figure = btn.closest("figure");
    var caption = figure ? figure.querySelector("figcaption") : null;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightboxImg.lang = img.lang || root.lang;
    lightboxTitle.textContent = caption ? caption.innerText : img.alt;
  }

  function lockPage() {
    lockedScroll = window.scrollY;
    root.classList.add("lightbox-open");
    document.body.style.top = -lockedScroll + "px";
  }

  function unlockPage() {
    root.classList.remove("lightbox-open");
    document.body.style.top = "";
    window.scrollTo(0, lockedScroll);
  }

  document.querySelectorAll(".shot-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lastFocus = btn;
      showShot(shotButtons().indexOf(btn));
      lockPage();
      lightbox.showModal();
      document.getElementById("lightbox-close").focus();
    });
  });

  document.getElementById("lightbox-close").addEventListener("click", function () {
    lightbox.close();
  });

  document.getElementById("lightbox-prev").addEventListener("click", function () {
    showShot(shotIndex - 1);
  });

  document.getElementById("lightbox-next").addEventListener("click", function () {
    showShot(shotIndex + 1);
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) lightbox.close();
  });

  var swipeX = null;
  lightbox.addEventListener("touchstart", function (event) {
    if (event.touches.length === 1) swipeX = event.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", function (event) {
    if (swipeX == null) return;
    var dx = event.changedTouches[0].clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) < 48) return;
    showShot(shotIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", function (event) {
    if (!lightbox.open) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showShot(shotIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showShot(shotIndex + 1);
    }
  });

  lightbox.addEventListener("close", function () {
    unlockPage();
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

  function syncHeaderOffset(reset) {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var y = window.scrollY;
    root.style.setProperty("--header-offset", header.offsetHeight + "px");
    if (reset && !location.hash && y > 0 && y <= header.offsetHeight) window.scrollTo(0, 0);
  }

  syncHeaderOffset(true);
  window.addEventListener("resize", function () { syncHeaderOffset(false); });

  syncAlts();
  syncControls();

  (function cycleCurrency() {
    var words = {
      pt: ["metical", "dólar", "rand", "euro", "real", "libra", "kwanza"],
      en: ["metical", "dollar", "rand", "euro", "real", "pound", "kwanza"]
    };
    var slots = [
      { word: document.querySelector(".pt.long .fx .word"), list: words.pt },
      { word: document.querySelector(".en.long .fx .word"), list: words.en }
    ].filter(function (slot) { return slot.word; });
    if (!slots.length) return;

    slots.forEach(function (slot) {
      slot.mark = slot.word.closest(".mark");
      slot.index = 0;
    });

    var motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function measure(slot, text) {
      var probe = slot.word.cloneNode(false);
      probe.textContent = text;
      probe.className = "word";
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;";
      slot.mark.appendChild(probe);
      var width = Math.ceil(probe.getBoundingClientRect().width);
      probe.remove();
      return width;
    }

    function fit(slot) {
      if (slot.mark.offsetParent === null && slot.mark.getClientRects().length === 0) return;
      slot.mark.style.width = measure(slot, slot.list[slot.index]) + "px";
    }

    function showStatic() {
      slots.forEach(function (slot) {
        slot.index = 0;
        slot.word.textContent = slot.list[0];
        slot.word.classList.remove("is-out", "is-in");
        slot.mark.style.width = "";
      });
    }

    if (motion.matches) {
      showStatic();
      return;
    }

    slots.forEach(fit);

    function step() {
      if (motion.matches) return;
      slots.forEach(function (slot) { slot.word.classList.add("is-out"); });
      window.setTimeout(function () {
        slots.forEach(function (slot) {
          slot.index = (slot.index + 1) % slot.list.length;
          slot.word.textContent = slot.list[slot.index];
          slot.word.classList.remove("is-out");
          slot.word.classList.add("is-in");
          fit(slot);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { slot.word.classList.remove("is-in"); });
          });
        });
      }, 180);
    }

    var timer = window.setInterval(step, 1600);
    window.addEventListener("resize", function () { slots.forEach(fit); });
    if (motion.addEventListener) {
      motion.addEventListener("change", function () {
        if (motion.matches) {
          window.clearInterval(timer);
          showStatic();
        }
      });
    }

    new MutationObserver(function () {
      slots.forEach(fit);
    }).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
  })();
})();
