document.addEventListener("DOMContentLoaded", async () => {
  // Utility-Funktion für Komponentenladung
  const loadComponent = async (selector, file) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      document.querySelector(selector).innerHTML = await response.text();
      return true;
    } catch (error) {
      console.error(`Fehler beim Laden von ${file}:`, error);
      return false;
    }
  };

  // Initialisierung
  try {
    const [headerLoaded, footerLoaded, widgetLoaded] = await Promise.all([
      loadComponent("header", "components/header.html"),
      loadComponent("footer", "components/footer.html"),
      loadComponent(".accessibility-container", "components/accessibility-widget.html")
    ]);

    // Sprachumschaltung
    const initLanguageToggle = () => {
      const languageButton = document.getElementById('language-toggle-btn');
      if (!languageButton) return;

      languageButton.addEventListener('click', () => {
        const currentLang = document.documentElement.lang || 'de';
        const newLang = currentLang === 'de' ? 'en' : 'de';
        
        document.documentElement.lang = newLang;
        languageButton.textContent = newLang === 'de' ? 'DE | EN' : 'EN | DE';
        localStorage.setItem('preferredLang', newLang);
        
        console.log("Sprache geändert zu:", newLang);
        // alert durch visuelle Notifikation ersetzen
      });
    };

    // Kontaktformular
    const initContactForm = () => {
      const contactForm = document.getElementById('contact-form');
      if (!contactForm) return;

      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        
        try {
          submitBtn.disabled = true;
          
          if (typeof grecaptcha !== 'undefined') {
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
              showNotification("Bitte bestätige, dass du kein Roboter bist", 'error');
              return;
            }
          }

          const response = await fetch(contactForm.action, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { 'Accept': 'application/json' }
          });

          if (!response.ok) throw new Error(await response.text());
          
          showNotification("Nachricht gesendet!", 'success');
          contactForm.reset();
          if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
        } catch (error) {
          console.error("Formularfehler:", error);
          showNotification("Fehler beim Senden", 'error');
        } finally {
          submitBtn.disabled = false;
        }
      });
    };

    // Accessibility-Widget
    if (widgetLoaded) {
      initAccessibility();
    }

    initLanguageToggle();
    initContactForm();

  } catch (error) {
    console.error("Initialisierungsfehler:", error);
  }
});

// Accessibility-Funktionen
function initAccessibility() {
  const selectElement = (selector) => document.querySelector(selector);
  const selectAllElements = (selector) => document.querySelectorAll(selector);

  const elements = {
    floaterBtn: selectElement('.floater-btn'),
    panel: selectElement('.accessibility-panel'),
    closeBtn: selectElement('.close-panel'),
    themeBtns: selectAllElements('[data-theme]'),
    fontSizeBtns: selectAllElements('[data-size]'),
    currentSizeDisplay: selectElement('.current-size')
  };

  // Validierung
  if (Object.values(elements).some(el => el === null || (Array.isArray(el) && el.length === 0))) {
    console.error("Fehlende Elemente:", elements);
    return;
  }

  // Panel-Steuerung
  elements.floaterBtn.addEventListener('click', () => {
    elements.panel.hidden = !elements.panel.hidden;
  });

  elements.closeBtn.addEventListener('click', () => {
    elements.panel.hidden = true;
  });

  // Theme-Switch
  elements.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      
      // UI aktualisieren
      elements.themeBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
      });
      btn.classList.add('active');
      btn.style.background = theme === 'auto' ? 'var(--color-accent)' : 'var(--color-bg)';
      
      // Theme anwenden
      document.body.classList.remove('force-light', 'force-dark');
      if (theme !== 'auto') document.body.classList.add(`force-${theme}`);
      
      localStorage.setItem('theme', theme === 'auto' ? '' : theme);
      updateIcons();
    });
  });

  // Schriftgröße
elements.fontSizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const currentSize = parseInt(document.documentElement.style.getPropertyValue('--font-scale') || 100);
    const newSize = Math.min(150, Math.max(80, 
      btn.dataset.size === '+' ? currentSize + 10 : currentSize - 10
    ));
    
    document.documentElement.style.setProperty('--font-scale', `${newSize}%`);
    elements.currentSizeDisplay.textContent = `${newSize}%`;
    localStorage.setItem('fontScale', newSize);
  });
});

  // Initialisierung
  const savedTheme = localStorage.getItem('theme');
  const savedSize = localStorage.getItem('fontScale') || 100;

  if (savedTheme) {
    document.querySelector(`[data-theme="${savedTheme}"]`)?.click();
  } else {
    document.querySelector('[data-theme="auto"]')?.click();
  }

  document.documentElement.style.setProperty('--font-scale', `${savedSize}%`);
  elements.currentSizeDisplay.textContent = `${savedSize}%`;
}

// Hilfsfunktionen
function updateIcons() {
  const isDark = document.body.classList.contains('force-dark');
  document.querySelectorAll('.theme-icon').forEach(icon => {
    const newSrc = isDark ? icon.dataset.dark : icon.dataset.light;
    if (newSrc && icon.src !== newSrc) icon.src = newSrc;
  });
}

function showNotification(message, type = 'info') {
  // Implementierung einer visuellen Notifikation
  console[type](message);
}

// Observer für Theme-Änderungen
new MutationObserver(updateIcons).observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});