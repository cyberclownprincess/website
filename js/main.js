// ==================== GLOBALE FUNKTIONEN ====================

/**
 * Lädt Übersetzungen und aktualisiert die Seite
 * @param {string} lang - Sprachcode ('de' oder 'en')
 */
async function loadLanguage(lang) {
  try {
    const response = await fetch("../translations/lang.json");
    if (!response.ok)
      throw new Error("Übersetzungen konnten nicht geladen werden");
    const translations = await response.json();

    // Texte ersetzen
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (translations[lang]?.[key]) {
        element.innerHTML = translations[lang][key];
      } else {
        console.warn(`Fehlende Übersetzung für: ${key}`);
      }
    });

    const logo = document.getElementById("header-logo");
    if (logo) {
      const isDarkMode = document.body.classList.contains("force-dark");
      logo.src = isDarkMode
        ? "img/RikaLogo_dunkel.svg"
        : "img/RikaLogo_hell.svg";
    }
    manageFocusAfterLoad();
  } catch (error) {
    console.error("Fehler beim Laden der Übersetzungen:", error);
  }
}

/**
 * Initialisiert die Sprachumschaltung
 */
function initLanguage() {
  const savedLang = localStorage.getItem("preferredLang") || "en";
  document.documentElement.lang = savedLang;
  loadLanguage(savedLang);

  // Toggle-Button Event
  const languageButton = document.getElementById("language-toggle-btn");
  if (languageButton) {
    languageButton.textContent = savedLang === "de" ? "DE | EN" : "EN | DE";
    languageButton.addEventListener("click", () => {
      const newLang = document.documentElement.lang === "de" ? "en" : "de";
      document.documentElement.lang = newLang;
      localStorage.setItem("preferredLang", newLang);
      loadLanguage(newLang);
      languageButton.textContent = newLang === "de" ? "DE | EN" : "EN | DE";
    });
    
    languageButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const newLang = document.documentElement.lang === "de" ? "en" : "de";
        document.documentElement.lang = newLang;
        localStorage.setItem("preferredLang", newLang);
        loadLanguage(newLang);
        languageButton.textContent = newLang === "de" ? "DE | EN" : "EN | DE";
      }
    });
  }
}

/**
 * Lädt HTML-Komponenten (Header, Footer, etc.)
 * @param {string} selector - CSS-Selector
 * @param {string} file - Pfad zur HTML-Datei
 */
async function loadComponent(selector, file) {
  try {
    const response = await fetch(file);
    if (!response.ok)
      throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    document.querySelector(selector).innerHTML = await response.text();
    if (selector === "header") {
      manageFocusAfterLoad();
    }
    return true;
  } catch (error) {
    console.error(`Fehler beim Laden von ${file}:`, error);
    return false;
  }
}

// ==================== BARRIEREFREIHEIT & DARK MODE ====================

function initAccessibility() {
  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => document.querySelectorAll(selector);

  const elements = {
    floaterBtn: select(".floater-btn"),
    panel: select(".accessibility-panel"),
    closeBtn: select(".close-panel"),
    themeBtns: selectAll("[data-theme]"),
    fontSizeBtns: selectAll("[data-size]"),
    currentSizeDisplay: select(".current-size"),
  };

  // Panel-Steuerung
  elements.floaterBtn?.addEventListener("click", () => {
    elements.panel.hidden = !elements.panel.hidden;
  });

  elements.floaterBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      elements.panel.hidden = !elements.panel.hidden;
      if (!elements.panel.hidden) {
        setTimeout(() => elements.closeBtn.focus(), 100);
      }
    }
  });

  elements.closeBtn?.addEventListener("click", () => {
    elements.panel.hidden = true;
  });

  elements.closeBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      elements.panel.hidden = true;
      elements.floaterBtn.focus();
    }
  });

  // Theme-Switch
  elements.themeBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      document.body.classList.remove("force-light", "force-dark");
      if (theme !== "auto") document.body.classList.add(`force-${theme}`);
      localStorage.setItem("theme", theme === "auto" ? "" : theme);
      elements.themeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateIcons();
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Schriftgröße
  elements.fontSizeBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentSize = parseInt(
        document.documentElement.style.getPropertyValue("--font-scale") || 100
      );
      const newSize = Math.min(
        150,
        Math.max(
          80,
          btn.dataset.size === "+" ? currentSize + 10 : currentSize - 10
        )
      );
      document.documentElement.style.setProperty("--font-scale", `${newSize}%`);
      elements.currentSizeDisplay.textContent = `${newSize}%`;
      localStorage.setItem("fontScale", newSize);
    });
  });

  // Initialisierung
  const savedTheme = localStorage.getItem("theme");
  const savedSize = localStorage.getItem("fontScale") || 100;
  if (savedTheme) {
    const btn = select(`[data-theme="${savedTheme}"]`);
    btn?.click(); // Triggert auch .active + updateIcons
  }
  document.documentElement.style.setProperty("--font-scale", `${savedSize}%`);
  elements.currentSizeDisplay.textContent = `${savedSize}%`;

  new MutationObserver(() => {
    const logo = document.getElementById("header-logo");
    if (logo) {
      const isDarkMode = document.body.classList.contains("force-dark");
      logo.src = isDarkMode
        ? "img/RikaLogo_dunkel.svg"
        : "img/RikaLogo_hell.svg";
    }
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

// Hilfsfunktion für Icons (Dark/Light)
function updateIcons() {
  const isDark = document.body.classList.contains("force-dark");
  document.querySelectorAll(".theme-icon").forEach((icon) => {
    const newSrc = isDark ? icon.dataset.dark : icon.dataset.light;
    if (newSrc && icon.src !== newSrc) icon.src = newSrc;
  });
}

// ==================== KONTAKTFORMULAR ====================

function initContactForm() {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (typeof grecaptcha !== "undefined" && !grecaptcha.getResponse()) {
        showNotification("Bitte bestätige, dass du kein Roboter bist", "error");
        return;
      }

      const response = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(await response.text());
      showNotification("Nachricht gesendet!", "success");
      contactForm.reset();
      if (typeof grecaptcha !== "undefined") grecaptcha.reset();
    } catch (error) {
      console.error("Formularfehler:", error);
      showNotification("Fehler beim Senden", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  contactForm.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.focus();
    }
  });
}

// ==================== HAUPTPROGRAMM ====================

function manageFocusAfterLoad() {
  const mainContent = document.querySelector("main");
  if (mainContent) {
    mainContent.setAttribute("tabindex", "-1");
    mainContent.focus();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Komponenten laden
    const [headerLoaded, footerLoaded, widgetLoaded] = await Promise.all([
      loadComponent("header", "components/header.html"),
      loadComponent("footer", "components/footer.html"),
      loadComponent(
        ".accessibility-container",
        "components/accessibility-widget.html"
      ),
      loadComponent(".socials-container", "components/socials.html")
    ]);

    // 2. Aktive Navigation setzen
    const currentPage =
      window.location.pathname.split("/").pop() || "home.html";
    document.querySelectorAll(".nav-link").forEach((link) => {
      const linkPage = link.getAttribute("href").split("/").pop();
      link.classList.toggle("active", linkPage === currentPage);
    });

    // 3. Sidebar- und Hamburger-Menü-Logik
    const hamburger = document.querySelector(".hamburger");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    document.body.appendChild(overlay);

    hamburger.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", isOpen);
    });

    hamburger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isOpen = sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
        hamburger.setAttribute("aria-expanded", isOpen);
      }
    });

    sidebar.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        hamburger.focus();
      }
    });

    sidebar.addEventListener("transitionend", () => {
      if (sidebar.classList.contains("open")) {
        const firstLink = sidebar.querySelector(".mobile-nav a");
        firstLink?.focus();
      }
    });

    document.querySelector(".sidebar").addEventListener("click", (e) => {
      const link = e.target.closest(".mobile-nav a");
      if (link) {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        hamburger.classList.remove("active");
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
          sidebar.classList.remove("open");
          overlay.classList.remove("active");
          hamburger.classList.remove("active");
        }
      }, 250);
    });

    // 4. Sprachumschaltung in der Sidebar
    const mobileLanguageBtn = document.getElementById(
      "mobile-language-toggle-btn"
    );
    if (mobileLanguageBtn) {
      mobileLanguageBtn.addEventListener("click", () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === "de" ? "en" : "de";
        document.documentElement.lang = newLang;
        loadLanguage(newLang);
        mobileLanguageBtn.textContent = newLang === "de" ? "DE | EN" : "EN | DE";
      });
      
      mobileLanguageBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const currentLang = document.documentElement.lang;
          const newLang = currentLang === "de" ? "en" : "de";
          document.documentElement.lang = newLang;
          loadLanguage(newLang);
          mobileLanguageBtn.textContent = newLang === "de" ? "DE | EN" : "EN | DE";
        }
      });
    }

    // 5. Initialisierungen
    initLanguage();
    initAccessibility();
    initContactForm();

    // 6. Observer für Theme-Änderungen
    new MutationObserver(updateIcons).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  } catch (error) {
    console.error("Initialisierungsfehler:", error);
  }
});

// Globale Tastatursteuerung
document.addEventListener("keydown", (e) => {
  // Skip-to-content Link (falls vorhanden)
  if (e.key === "Tab" && e.shiftKey) {
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.focus();
    }
  }
  
  // Schließen von Modals/Overlays mit Escape
  if (e.key === "Escape") {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".overlay");
    const hamburger = document.querySelector(".hamburger");
    
    if (sidebar?.classList.contains("open")) {
      sidebar.classList.remove("open");
      overlay?.classList.remove("active");
      hamburger?.focus();
    }
  }
});

// Hilfsfunktion für Benachrichtigungen
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}