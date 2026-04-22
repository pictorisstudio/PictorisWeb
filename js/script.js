/**
 * Pictoris Studio — script.js
 * v2 — hero entrance + page transitions + WhatsApp + mejoras generales
 */

/* ============================================
   PAGE TRANSITION OVERLAY
   Se inyecta antes del DOMContentLoaded
============================================ */
const transitionOverlay = document.createElement("div");
transitionOverlay.id = "page-transition";
transitionOverlay.innerHTML = `<div class="pt-inner"></div>`;
document.documentElement.appendChild(transitionOverlay);

// Entrada: fade out del overlay al cargar
window.addEventListener("load", () => {
  requestAnimationFrame(() => {
    transitionOverlay.classList.add("pt-out");
  });
});

// Salida: interceptar clicks en links internos
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");
  const isInternal =
    href &&
    !href.startsWith("http") &&
    !href.startsWith("//") &&
    !href.startsWith("mailto") &&
    !href.startsWith("tel") &&
    !href.startsWith("#") &&
    link.target !== "_blank";

  if (isInternal) {
    e.preventDefault();
    transitionOverlay.classList.remove("pt-out");
    transitionOverlay.classList.add("pt-in");

    setTimeout(() => {
      window.location.href = href;
    }, 420);
  }
});


document.addEventListener("DOMContentLoaded", () => {

  /* ============================================
     MENÚ MÓVIL
  ============================================ */
  const body = document.body;
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const navLinks = document.querySelectorAll(".main-nav a");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("nav-open");
      body.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );
      menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("nav-open");
        body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
        menuToggle.textContent = "☰";
      });
    });
  }


  /* ============================================
     HERO: ANIMACIÓN DE ENTRADA CON STAGGER
     Cada elemento aparece secuencialmente
  ============================================ */
  const heroEnterEls = [
    document.querySelector(".eyebrow"),
    document.querySelector(".hero h1"),
    document.querySelector(".hero-text"),
    document.querySelector(".hero-actions"),
    document.querySelector(".hero-panel"),
  ].filter(Boolean);

  heroEnterEls.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(32px)";
    el.style.transition = `opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${i * 120 + 200}ms,
                           transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${i * 120 + 200}ms`;
  });

  // Pequeño delay para que el video esté cargando mientras entramos
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroEnterEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
  });

  // Línea decorativa del hero: grow horizontal
  const eyebrow = document.querySelector(".eyebrow");
  if (eyebrow) {
    eyebrow.classList.add("eyebrow-line");
  }


  /* ============================================
     HEADER: scroll shrink + show/hide
  ============================================ */
  const siteHeader = document.querySelector(".site-header");
  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }

    if (scrollY > lastScrollY + 8 && scrollY > 200) {
      siteHeader.classList.add("header-hidden");
    } else if (scrollY < lastScrollY - 4) {
      siteHeader.classList.remove("header-hidden");
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });


  /* ============================================
     REVEAL ON SCROLL — stagger por grupo
  ============================================ */
  const revealTargets = document.querySelectorAll(
    ".project-card, .service-card, .immersive-card, .about-card, .about-stat, .final-cta-content, .section-heading, .featured-note"
  );

  if (revealTargets.length > 0) {
    const parentGroups = new Map();

    revealTargets.forEach((el) => {
      el.classList.add("reveal");
      const parent = el.parentElement;
      if (!parentGroups.has(parent)) parentGroups.set(parent, []);
      parentGroups.get(parent).push(el);
    });

    parentGroups.forEach((children) => {
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 90}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));
  }


  /* ============================================
     PARALLAX EN HERO ORBS + VIDEO
  ============================================ */
  const orb1 = document.querySelector(".hero-orb-1");
  const orb2 = document.querySelector(".hero-orb-2");
  const heroVideoEl = document.querySelector(".hero-video");

  let rafParallax = null;

  window.addEventListener("scroll", () => {
    if (rafParallax) return;
    rafParallax = requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      if (orb1) orb1.style.transform = `translateY(${scrollY * 0.18}px)`;
      if (orb2) orb2.style.transform = `translateY(${-scrollY * 0.12}px)`;

      if (heroVideoEl && scrollY < window.innerHeight * 1.2) {
        heroVideoEl.style.transform = `translateY(${scrollY * 0.26}px) scale(1.08)`;
      }

      rafParallax = null;
    });
  }, { passive: true });


  /* ============================================
     CURSOR PERSONALIZADO (solo desktop)
  ============================================ */
  const isTouchDevice = window.matchMedia("(hover: none)").matches;

  if (!isTouchDevice) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    const cursorDot = document.createElement("div");
    cursorDot.className = "custom-cursor-dot";
    document.body.appendChild(cursorDot);

    let cursorX = -100, cursorY = -100;
    let dotX = -100, dotY = -100;

    document.addEventListener("mousemove", (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
    });

    function animateDot() {
      dotX += (cursorX - dotX) * 0.14;
      dotY += (cursorY - dotY) * 0.14;
      cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
      requestAnimationFrame(animateDot);
    }
    animateDot();

    const interactiveEls = document.querySelectorAll(
      "a, button, .project-card, .service-card, .immersive-card, .btn"
    );

    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("cursor-expand"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-expand"));
    });

    document.addEventListener("mouseleave", () => cursor.classList.add("cursor-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("cursor-hidden"));
  }


  /* ============================================
     CARD SPOTLIGHT GLOW (mouse tracking)
  ============================================ */
  const cards = document.querySelectorAll(".project-card, .service-card, .immersive-card");

  cards.forEach((card) => {
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
  });


  /* ============================================
     TILT EN HERO PANEL (solo desktop)
  ============================================ */
  const heroPanel = document.querySelector(".hero-panel-inner");

  if (heroPanel && !isTouchDevice) {
    heroPanel.addEventListener("mousemove", (e) => {
      const rect = heroPanel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      heroPanel.style.transform = `perspective(900px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg)`;
    });

    heroPanel.addEventListener("mouseleave", () => {
      heroPanel.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }


  /* ============================================
     LAZY LOAD DE VIDEOS
  ============================================ */
  const lazyVideos = document.querySelectorAll("video[preload='metadata']");

  if ("IntersectionObserver" in window && lazyVideos.length > 0) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.play().catch(() => {});
          } else {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    lazyVideos.forEach((video) => videoObserver.observe(video));
  }

  // Hero video: pausa fuera de viewport
  const heroVideoElement = document.querySelector(".hero-video-element");
  if (heroVideoElement) {
    const heroSection = document.querySelector(".hero");
    new IntersectionObserver(
      ([entry]) => {
        entry.isIntersecting
          ? heroVideoElement.play().catch(() => {})
          : heroVideoElement.pause();
      },
      { threshold: 0.1 }
    ).observe(heroSection || heroVideoElement);
  }


  /* ============================================
     CONTADORES ANIMADOS [data-count]
  ============================================ */
  document.querySelectorAll("[data-count]").forEach((el) => {
    new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        const duration = 1400;

        (function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      },
      { threshold: 0.6 }
    ).observe(el);
  });


  /* ============================================
     INYECCIÓN DE ESTILOS DINÁMICOS
  ============================================ */
  const dynamicStyles = `

    /* ── Page Transition ─────────────────────── */
    #page-transition {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pt-inner {
      width: 100%;
      height: 100%;
      background: #07050d;
      transform-origin: bottom center;
      transform: scaleY(1);
      transition: transform 0.42s cubic-bezier(0.76, 0, 0.24, 1);
    }
    #page-transition.pt-out .pt-inner {
      transform: scaleY(0);
      transform-origin: top center;
    }
    #page-transition.pt-in .pt-inner {
      transform: scaleY(1);
      transform-origin: bottom center;
      transition: transform 0.38s cubic-bezier(0.76, 0, 0.24, 1);
    }

    /* ── Header states ───────────────────────── */
    .site-header {
      transition: transform 0.38s ease, background 0.28s ease, box-shadow 0.28s ease;
    }
    .site-header.scrolled {
      background: rgba(7, 5, 13, 0.92) !important;
      box-shadow: 0 2px 32px rgba(0, 0, 0, 0.36);
    }
    .site-header.header-hidden {
      transform: translateY(-100%);
    }

    /* ── Reveal scroll ───────────────────────── */
    .reveal {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.72s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Hero panel tilt ─────────────────────── */
    .hero-panel-inner {
      transition: transform 0.28s ease;
      will-change: transform;
    }

    /* ── Card spotlight ──────────────────────── */
    .project-card,
    .service-card,
    .immersive-card {
      --mouse-x: 50%;
      --mouse-y: 50%;
    }
    .project-card::after,
    .service-card::after,
    .immersive-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        circle at var(--mouse-x) var(--mouse-y),
        rgba(108, 59, 255, 0.11) 0%,
        transparent 65%
      );
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 1;
    }
    .project-card:hover::after,
    .service-card:hover::after,
    .immersive-card:hover::after {
      opacity: 1;
    }

    /* ── Hero video parallax ─────────────────── */
    .hero-video {
      will-change: transform;
    }

    /* ── Eyebrow line decoration ─────────────── */
    .eyebrow-line {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }
    .eyebrow-line::before {
      content: "";
      display: inline-block;
      width: 0;
      height: 1px;
      background: var(--color-accent, #2d8cff);
      animation: lineGrow 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;
    }
    @keyframes lineGrow {
      to { width: 28px; }
    }

    /* ── Custom cursor ───────────────────────── */
    .custom-cursor {
      position: fixed;
      top: 0; left: 0;
      width: 40px; height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(108, 59, 255, 0.55);
      pointer-events: none;
      z-index: 9999;
      transition: width 0.22s ease, height 0.22s ease,
                  border-color 0.22s ease, opacity 0.22s ease,
                  background 0.22s ease;
      will-change: transform;
      mix-blend-mode: screen;
    }
    .custom-cursor.cursor-expand {
      width: 58px; height: 58px;
      border-color: rgba(45, 140, 255, 0.6);
      background: rgba(45, 140, 255, 0.04);
    }
    .custom-cursor.cursor-hidden { opacity: 0; }
    .custom-cursor-dot {
      position: fixed;
      top: 0; left: 0;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(108, 59, 255, 0.9);
      pointer-events: none;
      z-index: 10000;
      will-change: transform;
    }
  `;

  const styleTag = document.createElement("style");
  styleTag.textContent = dynamicStyles;
  document.head.appendChild(styleTag);

});