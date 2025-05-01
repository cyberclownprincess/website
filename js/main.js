// Header und Footer dynamisch laden
document.addEventListener("DOMContentLoaded", () => {
    const loadComponent = async (selector, file) => {
      try {
        const res = await fetch(file);
        const html = await res.text();
        document.querySelector(selector).innerHTML = html;
  
        // Aktiven Link markieren
        const currentPage = window.location.pathname.split("/").pop();
        document.querySelectorAll(".nav-link").forEach(link => {
          if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
          }
        });
      } catch (error) {
        console.error(`Fehler beim Laden von ${file}:`, error);
      }
    };
  
    loadComponent("header", "components/header.html");
    loadComponent("footer", "components/footer.html");
  });