document.addEventListener("DOMContentLoaded", async () => {
  // Lade Header, Footer und Accessibility-Widget
  const loadComponent = async (selector, file) => {
    try {
      const res = await fetch(file);
      const html = await res.text();
      document.querySelector(selector).innerHTML = html;
      return true; // Erfolgsstatus zurückgeben
    } catch (error) {
      console.error(`Fehler beim Laden von ${file}:`, error);
      return false;
    }
  };

  // Komponenten laden
  await loadComponent("header", "components/header.html");
  await loadComponent("footer", "components/footer.html");
  const widgetLoaded = await loadComponent(".accessibility-container", "components/accessibility-widget.html");

  // TODO: JSON Übersetzungen
  // . Sprachbutton initialisieren 
  const languageButton = document.getElementById('language-toggle-btn');
  if (languageButton) {
      languageButton.addEventListener('click', () => {
          const currentLang = document.documentElement.lang || 'de';
          const newLang = currentLang === 'de' ? 'en' : 'de';
          
          document.documentElement.lang = newLang;
          languageButton.textContent = newLang === 'de' ? 'DE | EN' : 'EN | DE';
          localStorage.setItem('preferredLang', newLang);
          
          console.log("Sprache geändert zu:", newLang);
          alert(`Sprache gewechselt zu ${newLang.toUpperCase()}`);
      });
  }

  //TODO: Funktional machen
  // Kontaktformular 
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              document.getElementById('form-success').style.display = 'block';
              contactForm.reset();
          } catch (error) {
              alert("Fehler! Bitte versuche es später erneut.");
          }
      });
  }

  // Accessibility-Widget initialisieren NACH dem Laden
  if (widgetLoaded) {
    initAccessibility(); 
  }
});

// Accessibility-Funktionen auslagern
function initAccessibility() {
  // 1. Alle benötigten Elemente selektieren
  const floaterBtn = document.querySelector('.floater-btn');
  const panel = document.querySelector('.accessibility-panel');
  const closeBtn = document.querySelector('.close-panel');
  const themeBtns = document.querySelectorAll('[data-theme]');
  const fontSizeBtns = document.querySelectorAll('[data-size]');
  const currentSizeDisplay = document.querySelector('.current-size');

  // 2. Existenzprüfung
  if (!floaterBtn || !panel || !closeBtn || themeBtns.length === 0 || fontSizeBtns.length === 0 || !currentSizeDisplay) {
    console.error("Fehlende Accessibility-Elemente:", {
      floaterBtn, panel, closeBtn, themeBtns, fontSizeBtns, currentSizeDisplay
    });
    return;
  }

  // 3. Panel-Steuerung
  floaterBtn.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  closeBtn.addEventListener('click', () => {
    panel.hidden = true;
  });

  // 4. Theme-Switch
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      
      // UI aktualisieren
      themeBtns.forEach(b => b.style.background = 'transparent');
      btn.style.background = theme === 'auto' ? 'var(--color-accent)' : 'var(--color-bg)';
      
      // Theme anwenden
      if (theme === 'auto') {
        document.body.classList.remove('force-light', 'force-dark');
        localStorage.removeItem('theme');
      } else {
        document.body.classList.remove('force-light', 'force-dark');
        document.body.classList.add(`force-${theme}`);
        localStorage.setItem('theme', theme);
      }
    });
  });

  // 5. Schriftgröße
  fontSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentSize = parseInt(document.documentElement.style.getPropertyValue('--font-scale') || '100');
      const newSize = btn.dataset.size === '+' ? currentSize + 10 : currentSize - 10;
      
      if (newSize >= 80 && newSize <= 150) {
        document.documentElement.style.setProperty('--font-scale', `${newSize}%`);
        currentSizeDisplay.textContent = `${newSize}%`;
        localStorage.setItem('fontScale', newSize);
      }
    });
  });

  // 6. Gespeicherte Einstellungen laden
  const savedTheme = localStorage.getItem('theme');
  const savedSize = localStorage.getItem('fontScale');

  // Theme wiederherstellen
  if (savedTheme) {
    document.body.classList.add(`force-${savedTheme}`);
    document.querySelector(`[data-theme="${savedTheme}"]`).style.background = 
      savedTheme === 'auto' ? 'var(--color-accent)' : 'var(--color-bg)';
  } else {
    document.querySelector('[data-theme="auto"]').style.background = 'var(--color-accent)';
  }

  // Schriftgröße wiederherstellen
  if (savedSize) {
    document.documentElement.style.setProperty('--font-scale', `${savedSize}%`);
    currentSizeDisplay.textContent = `${savedSize}%`;
  } else {
    document.documentElement.style.setProperty('--font-scale', '100%');
    currentSizeDisplay.textContent = '100%';
  }
}

// Icon-Theme-Wechsel
function updateIcons() {
  const isDark = document.body.classList.contains('force-dark');
  document.querySelectorAll('.theme-icon').forEach(icon => {
    const newSrc = isDark ? icon.dataset.dark : icon.dataset.light;
    if (icon.src !== newSrc) icon.src = newSrc;
  });
}

// Initial und bei Änderungen
updateIcons();
new MutationObserver(updateIcons).observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});

// CONTACT 
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
      
      // reCAPTCHA validieren
      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse) {
        alert("Bitte bestätige, dass du kein Roboter bist");
        submitBtn.disabled = false;
        return;
      }

      const formData = new FormData(contactForm);
      formData.append('g-recaptcha-response', recaptchaResponse);

      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        document.getElementById('form-success').style.display = 'block';
        contactForm.reset();
        grecaptcha.reset();
      } else {
        throw new Error('Formular konnte nicht gesendet werden');
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler! Bitte versuche es später erneut.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}