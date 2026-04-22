/**
 * proyectos.js — Lógica exclusiva de la página de proyectos
 * Filtros, carga progresiva, vista grid/lista, spotlight en cards
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ============================================
     REFERENCIAS DEL DOM
  ============================================ */
  const grid         = document.getElementById("projects-grid");
  const filterBtns   = document.querySelectorAll(".filter-btn");
  const viewBtns     = document.querySelectorAll(".view-btn");
  const loadMoreBtn  = document.getElementById("load-more-btn");
  const loadMoreWrap = document.getElementById("load-more-wrapper");
  const emptyState   = document.getElementById("empty-state");
  const resetBtn     = document.getElementById("reset-filter");
  const countEl      = document.getElementById("visible-count");
  const loadCountEl  = document.getElementById("load-more-count");
  const filtersBar   = document.querySelector(".filters-bar");

  if (!grid) return;

  /* ============================================
     ESTADO
  ============================================ */
  let currentFilter = "all";
  let currentView   = "grid";

  // Todas las cards del DOM
  const allCards = Array.from(grid.querySelectorAll(".pf-card"));

  // Separar cards visibles por defecto y ocultas (carga progresiva)
  const initialCards = allCards.filter(c => !c.classList.contains("pf-card--hidden"));
  const extraCards   = allCards.filter(c =>  c.classList.contains("pf-card--hidden"));


  /* ============================================
     FILTROS
  ============================================ */
 function applyFilter(filter) {
  currentFilter = filter;

  filterBtns.forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  const loadedCards = allCards.filter(
    (card) => !card.classList.contains("pf-card--hidden")
  );

  const matchingLoadedCards = loadedCards.filter((card) => {
    return filter === "all" || card.dataset.category === filter;
  });

  loadedCards.forEach((card, index) => {
    const matches = filter === "all" || card.dataset.category === filter;

    if (matches) {
      card.style.display = "";
      card.style.animationDelay = `${index * 60}ms`;
      card.classList.add("pf-card--entering");
      card.addEventListener(
        "animationend",
        () => {
          card.classList.remove("pf-card--entering");
        },
        { once: true }
      );
    } else {
      card.style.display = "none";
    }
  });

  const hasVisibleResults = matchingLoadedCards.length > 0;

  emptyState.hidden = hasVisibleResults;
  grid.style.display = hasVisibleResults ? "" : "none";

  if (filter === "all") {
    const hiddenExtras = extraCards.filter((card) =>
      card.classList.contains("pf-card--hidden")
    );
    loadMoreWrap.hidden = hiddenExtras.length === 0;

    if (loadCountEl) {
      loadCountEl.textContent = `+${hiddenExtras.length}`;
    }
  } else {
    loadMoreWrap.hidden = true;
  }

const featured = grid.querySelector(".pf-card--featured");
if (featured) {
  if (filter === "all" && currentView === "grid") {
    featured.style.gridColumn = "";
    featured.classList.remove("pf-card--compact");
  } else {
    featured.style.gridColumn = "auto";
    featured.classList.add("pf-card--compact");
  }
}
  updateCount();
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyFilter(btn.dataset.filter);
  });
});

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    applyFilter("all");
  });
}
  /* ============================================
     VISTA GRID / LISTA
  ============================================ */
  function applyView(view) {
    currentView = view;
    grid.dataset.view = view;

    viewBtns.forEach(btn => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    // En lista, el featured no ocupa 2 columnas
const featured = grid.querySelector(".pf-card--featured");
if (featured) {
  const isFullFeatured = view === "grid" && currentFilter === "all";

  featured.style.gridColumn = isFullFeatured ? "" : "auto";
  featured.classList.toggle("pf-card--compact", !isFullFeatured);
}
  }

  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => applyView(btn.dataset.view));
  });


  /* ============================================
     CARGAR MÁS
  ============================================ */
  function loadMore() {
    // Tomar los próximos que siguen ocultos
    const toShow = extraCards.filter(c => c.classList.contains("pf-card--hidden"));

    if (toShow.length === 0) {
      loadMoreWrap.hidden = true;
      return;
    }

    toShow.forEach((card, i) => {
      card.classList.remove("pf-card--hidden");
      card.style.display = "";
      card.style.animationDelay = `${i * 80}ms`;
      card.classList.add("pf-card--entering");
      card.addEventListener("animationend", () => {
        card.classList.remove("pf-card--entering");
      }, { once: true });

      // Activar video de la card recién mostrada
      const video = card.querySelector(".pf-video");
      if (video) {
        video.setAttribute("preload", "metadata");
        video.play().catch(() => {});
      }

      // Registrar spotlight en la nueva card
      registerCardSpotlight(card);
    });

    // Actualizar contador
    updateCount();

    // Ocultar botón si ya no hay más
    const remaining = extraCards.filter(c => c.classList.contains("pf-card--hidden"));
    if (remaining.length === 0) {
      loadMoreWrap.hidden = true;
    } else {
      if (loadCountEl) loadCountEl.textContent = `+${remaining.length}`;
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMore);
  }

  // Inicializar contador del botón
  if (loadCountEl) {
    loadCountEl.textContent = `+${extraCards.length}`;
  }

  if (extraCards.length === 0 && loadMoreWrap) {
    loadMoreWrap.hidden = true;
  }


  /* ============================================
     CONTADOR DE PROYECTOS VISIBLES
  ============================================ */
  function updateCount() {
  if (!countEl) return;

  const visible = allCards.filter((card) => {
    const isLoaded = !card.classList.contains("pf-card--hidden");
    const matchesFilter =
      currentFilter === "all" || card.dataset.category === currentFilter;
    const isDisplayed = card.style.display !== "none";

    return isLoaded && matchesFilter && isDisplayed;
  }).length;

  const current = parseInt(countEl.textContent, 10) || 0;
  if (current === visible) return;

  countEl.style.transition = "opacity 0.2s ease";
  countEl.style.opacity = "0";

  setTimeout(() => {
    countEl.textContent = visible;
    countEl.style.opacity = "1";
  }, 180);
}
  /* ============================================
     SPOTLIGHT EN CARDS (mouse tracking)
  ============================================ */
  function registerCardSpotlight(card) {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x}%`);
      card.style.setProperty("--mouse-y", `${y}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
    });
  }

  allCards.forEach(card => registerCardSpotlight(card));


  /* ============================================
     LAZY LOAD DE VIDEOS EN CARDS
  ============================================ */
  const cardVideos = grid.querySelectorAll(".pf-video");

  if ("IntersectionObserver" in window) {
    const videoObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.2 }
    );

    cardVideos.forEach(v => videoObs.observe(v));
  }


  /* ============================================
     FILTERS BAR: sticky indicator
  ============================================ */
  if (filtersBar) {
    const headerH = document.querySelector(".site-header")?.offsetHeight || 78;

    const stickyObs = new IntersectionObserver(
      ([entry]) => {
        filtersBar.classList.toggle("is-sticky", !entry.isIntersecting);
      },
      { rootMargin: `-${headerH + 1}px 0px 0px 0px`, threshold: 0 }
    );

    // Sentinel justo antes del filtro
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "height:1px;pointer-events:none;";
    filtersBar.parentElement?.insertBefore(sentinel, filtersBar);
    stickyObs.observe(sentinel);
  }


  /* ============================================
     REVEAL EN SCROLL PARA CARDS
  ============================================ */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("pf-card--entering");
          entry.target.addEventListener("animationend", () => {
            entry.target.classList.remove("pf-card--entering");
          }, { once: true });
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );

  // Solo las que ya son visibles al cargar
  initialCards.forEach(card => revealObs.observe(card));


  /* ============================================
     ANIMACIÓN DE ENTRADA DEL PAGE HERO
  ============================================ */
  const heroEls = [
    document.querySelector(".page-hero-eyebrow"),
    document.querySelector(".page-hero h1"),
    document.querySelector(".page-hero-sub"),
  ].filter(Boolean);

  heroEls.forEach((el, i) => {
    el.style.cssText = `
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1) ${i * 110 + 120}ms,
                  transform 0.75s cubic-bezier(0.22,1,0.36,1) ${i * 110 + 120}ms;
    `;
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    heroEls.forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }));

applyView("grid");
applyFilter("all");
updateCount();

});