const PARTICLE_DEBUG = true;

class ParticleBackground {
  static sceneSettings = [
    { density: 0.72, speedX: 1.5, speedY: 7.5, turbulence: 2.2, size: 0.92, opacity: 0.38 },
    { density: 0.78, speedX: 4.2, speedY: 5.6, turbulence: 1.8, size: 0.96, opacity: 0.4 },
    { density: 0.9, speedX: 1.2, speedY: 4.5, turbulence: 5.2, size: 1.22, opacity: 0.44 },
    { density: 0.54, speedX: 1.8, speedY: 3.2, turbulence: 1.1, size: 0.88, opacity: 0.3 },
    { density: 0.8, speedX: 10.5, speedY: 2.2, turbulence: 2.5, size: 1.02, opacity: 0.4 },
    { density: 0.36, speedX: 0.25, speedY: 0.55, turbulence: 0.55, size: 0.92, opacity: 0.24 }
  ];

  constructor(canvas, reducedMotion) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    if (!this.context) throw new Error("ParticleBackground requires a Canvas 2D context.");

    this.reducedMotion = reducedMotion;
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.frame = 0;
    this.renderedFrames = 0;
    this.lastTime = 0;
    this.sceneIndex = 0;
    this.current = { ...ParticleBackground.sceneSettings[0] };
    this.target = { ...this.current };
    this.darkSceneColors = PARTICLE_DEBUG
      ? ["rgba(248, 238, 215,", "rgba(224, 218, 202,", "rgba(222, 184, 143,"]
      : ["rgba(205, 201, 190,", "rgba(177, 171, 158,", "rgba(190, 166, 139,"];
    this.lightSceneColors = PARTICLE_DEBUG
      ? ["rgba(37, 34, 31,", "rgba(84, 78, 71,", "rgba(129, 101, 73,"]
      : ["rgba(55, 51, 47,", "rgba(98, 91, 83,", "rgba(139, 111, 82,"];
    this.colors = this.darkSceneColors;
    this.canvas.dataset.debug = String(PARTICLE_DEBUG);

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);

    this.resize();
    window.addEventListener("resize", this.resize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.handleVisibility();

    console.info("Particle canvas initialized");
    console.info(`Particle count: ${this.particles.length}`);
    console.info(`Canvas size: ${this.canvas.width} x ${this.canvas.height}`);
    console.info("Active scene: 01");
  }

  getParticleLimit() {
    const mobile = window.innerWidth <= 640;
    const limitedDevice = (navigator.hardwareConcurrency || 4) <= 4 || navigator.connection?.saveData;

    if (PARTICLE_DEBUG) return mobile ? 50 : 100;
    if (this.reducedMotion) return mobile ? 10 : 14;
    if (mobile) return limitedDevice ? 24 : 30;
    return limitedDevice ? 52 : 68;
  }

  getParticleSizeProfile() {
    const mobile = window.innerWidth <= 640;
    const layerRoll = Math.random();

    if (layerRoll < 0.55) {
      return {
        layer: "background",
        size: 0.6 + Math.random() * 0.4,
        min: 0.6,
        max: 1,
        depth: 0.3 + Math.random() * 0.18,
        speedFactor: 0.55,
        opacityFactor: 0.5
      };
    }

    if (layerRoll < 0.93) {
      return {
        layer: "middle",
        size: 1 + Math.random() * 0.7,
        min: 1,
        max: 1.7,
        depth: 0.55 + Math.random() * 0.2,
        speedFactor: 1,
        opacityFactor: 0.78
      };
    }

    return {
      layer: "foreground",
      size: 1.7 + Math.random() * (mobile ? 0.7 : 1.1),
      min: 1.7,
      max: mobile ? 2.4 : 2.8,
      depth: 0.82 + Math.random() * 0.18,
      speedFactor: 1.25,
      opacityFactor: 1
    };
  }

  createParticle() {
    const sizeProfile = this.getParticleSizeProfile();

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      layer: sizeProfile.layer,
      depth: sizeProfile.depth,
      speedFactor: sizeProfile.speedFactor,
      opacityFactor: sizeProfile.opacityFactor,
      baseSize: sizeProfile.size,
      minSize: sizeProfile.min,
      maxSize: sizeProfile.max,
      alpha: PARTICLE_DEBUG ? 0.45 + Math.random() * 0.4 : 0.12 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.35 + Math.random() * 0.75,
      colorIndex: Math.floor(Math.random() * this.colors.length)
    };
  }

  reconcileParticles() {
    const limit = this.getParticleLimit();

    while (this.particles.length < limit) this.particles.push(this.createParticle());
    if (this.particles.length > limit) this.particles.length = limit;
    this.canvas.dataset.particleCount = String(limit);
  }

  resize() {
    const previousWidth = this.width || window.innerWidth;
    const previousHeight = this.height || window.innerHeight;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.particles.forEach((particle) => {
      particle.x = (particle.x / previousWidth) * this.width;
      particle.y = (particle.y / previousHeight) * this.height;
    });
    this.reconcileParticles();
    console.info(`Particle count: ${this.particles.length}`);
    console.info(`Canvas size: ${this.canvas.width} x ${this.canvas.height}`);
  }

  setScene(index) {
    const safeIndex = Number.isFinite(index)
      ? Math.max(0, Math.min(index, ParticleBackground.sceneSettings.length - 1))
      : 0;
    const sceneChanged = safeIndex !== this.sceneIndex;

    this.sceneIndex = safeIndex;
    this.colors = this.sceneIndex === 0 ? this.darkSceneColors : this.lightSceneColors;
    this.target = ParticleBackground.sceneSettings[this.sceneIndex];
    this.canvas.dataset.activeScene = String(this.sceneIndex + 1).padStart(2, "0");
    if (sceneChanged) console.info(`Active scene: ${this.canvas.dataset.activeScene}`);
  }

  interpolateSettings(deltaSeconds) {
    const blend = Math.min(1, deltaSeconds * 3.2);

    Object.keys(this.current).forEach((key) => {
      this.current[key] += (this.target[key] - this.current[key]) * blend;
    });
  }

  updateParticle(particle, deltaSeconds, elapsedSeconds) {
    const motionScale = this.reducedMotion ? 0.08 : (PARTICLE_DEBUG ? 1.65 : 1);
    const drift = Math.sin(elapsedSeconds * particle.phaseSpeed + particle.phase);
    const depthSpeed = particle.speedFactor;

    particle.x += (this.current.speedX * depthSpeed + drift * this.current.turbulence) * deltaSeconds * motionScale;
    particle.y += (this.current.speedY * depthSpeed + Math.cos(elapsedSeconds * 0.28 + particle.phase) * this.current.turbulence * 0.35) * deltaSeconds * motionScale;

    const margin = 12;
    if (particle.x > this.width + margin) particle.x = -margin;
    if (particle.x < -margin) particle.x = this.width + margin;
    if (particle.y > this.height + margin) particle.y = -margin;
    if (particle.y < -margin) particle.y = this.height + margin;
  }

  drawParticle(particle) {
    const depthScale = 0.9 + particle.depth * 0.1;
    const sceneScale = 0.95 + (this.current.size - 1) * 0.25;
    const radius = Math.max(
      particle.minSize,
      Math.min(particle.maxSize, particle.baseSize * depthScale * sceneScale)
    );
    const baseAlpha = PARTICLE_DEBUG ? particle.alpha : particle.alpha * this.current.opacity;
    const alpha = baseAlpha * particle.opacityFactor;

    this.context.beginPath();
    this.context.fillStyle = `${this.colors[particle.colorIndex]}${alpha})`;
    this.context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    this.context.fill();
  }

  render(timestamp) {
    const elapsedSeconds = timestamp / 1000;
    const deltaSeconds = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 0.05);
    this.lastTime = timestamp;
    this.interpolateSettings(deltaSeconds);
    this.context.clearRect(0, 0, this.width, this.height);

    const visibleCount = PARTICLE_DEBUG
      ? this.particles.length
      : Math.min(this.particles.length, Math.round(this.particles.length * this.current.density));
    for (let index = 0; index < visibleCount; index += 1) {
      const particle = this.particles[index];
      this.updateParticle(particle, deltaSeconds, elapsedSeconds);
      this.drawParticle(particle);
    }

    this.renderedFrames += 1;
    if (PARTICLE_DEBUG && this.renderedFrames % 30 === 0) {
      this.canvas.dataset.renderedFrames = String(this.renderedFrames);
    }

    this.frame = window.requestAnimationFrame(this.render);
  }

  handleVisibility() {
    if (document.hidden) {
      window.cancelAnimationFrame(this.frame);
      this.frame = 0;
      return;
    }

    if (!this.frame) {
      this.lastTime = 0;
      this.frame = window.requestAnimationFrame(this.render);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dossierButton = document.querySelector(".ctf-dossier-action");
  const dossierStatus = document.querySelector("#ctf-dossier-status");
  const projectVideo = document.querySelector(".ctf-visual-media video");
  const mariaScene = document.querySelector(".ctf-scene-maria");
  const agePreviewButtons = [...document.querySelectorAll("[data-age-preview]")];
  const ageModal = document.querySelector("[data-age-modal]");
  const ageModalImage = document.querySelector("[data-age-modal-image]");
  const ageModalTitle = document.querySelector("[data-age-modal-title]");
  const ageModalClose = document.querySelector("[data-age-modal-close]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const languageScene = document.querySelector(".ctf-scene-language");
  const processVideos = [...document.querySelectorAll("[data-process-video]")];
  const productionScene = document.querySelector(".ctf-scene-production");
  const productionVideo = document.querySelector("[data-production-video]");
  const territoryScene = document.querySelector(".ctf-scene-territory");
  const experienceVideos = [...document.querySelectorAll("[data-experience-video]")];
  const finaleScene = document.querySelector(".ctf-scene-finale");
  const scheduleScene = document.querySelector(".ctf-scene-schedule");
  const closingScene = document.querySelector(".ctf-scene-closing");
  const closingMaria = document.querySelector(".ctf-closing-maria");
  const particleCanvas = document.querySelector(".ctf-particle-canvas");
  const particleBackground = particleCanvas ? new ParticleBackground(particleCanvas, reducedMotion) : null;

  function closeAgeModal() {
    if (ageModal?.open) ageModal.close();
  }

  agePreviewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sourceImage = button.querySelector("img");
      if (!ageModal || !ageModalImage || !ageModalTitle || !sourceImage) return;

      ageModalImage.src = sourceImage.currentSrc || sourceImage.src;
      ageModalImage.alt = sourceImage.alt;
      ageModalTitle.textContent = button.dataset.title || sourceImage.alt;
      ageModal.dataset.age = button.closest("[data-age]")?.dataset.age || "";
      ageModal.showModal();
      document.body.classList.add("ctf-age-modal-open");
    });
  });

  ageModalClose?.addEventListener("click", closeAgeModal);
  ageModal?.addEventListener("click", (event) => {
    if (event.target === ageModal) closeAgeModal();
  });
  ageModal?.addEventListener("close", () => {
    document.body.classList.remove("ctf-age-modal-open");
  });

  function configureProjectVideo() {
    if (!projectVideo) return;
    projectVideo.muted = true;
    projectVideo.defaultPlaybackRate = 0.5;
    projectVideo.playbackRate = 0.5;
  }

  configureProjectVideo();
  projectVideo?.addEventListener("loadedmetadata", configureProjectVideo);

  if (dossierButton) {
    dossierButton.addEventListener("click", () => {
      const dossierUrl = dossierButton.dataset.dossierUrl?.trim();

      if (!dossierUrl) {
        if (dossierStatus) dossierStatus.textContent = "Dossier próximamente disponible.";
        return;
      }

      window.open(dossierUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (projectVideo && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        configureProjectVideo();
        projectVideo.play().catch(() => {});
      } else {
        projectVideo.pause();
      }
    }, { threshold: 0.2 });

    videoObserver.observe(projectVideo);
  }

  if (mariaScene && "IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver(([entry]) => {
      mariaScene.classList.toggle("is-visible", entry.isIntersecting);
    }, { threshold: 0.18 });

    sceneObserver.observe(mariaScene);
  } else if (mariaScene) {
    mariaScene.classList.add("is-visible");
  }

  if (languageScene && "IntersectionObserver" in window) {
    const languageObserver = new IntersectionObserver(([entry]) => {
      languageScene.classList.toggle("is-visible", entry.isIntersecting);
    }, { threshold: 0.16 });

    languageObserver.observe(languageScene);
  } else if (languageScene) {
    languageScene.classList.add("is-visible");
  }

  let processPlaybackRun = 0;
  let processVideosEnabled = false;

  processVideos.forEach((video) => {
    video.addEventListener("play", () => {
      if (!processVideosEnabled) video.pause();
    });
  });

  function waitForVideoReady(video) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();

    return new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("error", finish);
        resolve();
      };
      const timeoutId = window.setTimeout(finish, 1800);

      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
    });
  }

  async function setProcessVideosActive(isActive) {
    const playbackRun = ++processPlaybackRun;
    processVideosEnabled = isActive;

    processVideos.forEach((video) => {
      video.pause();
      if (isActive) video.currentTime = 0;
    });

    if (!isActive || !processVideos.length) return;

    await Promise.allSettled(processVideos.map(waitForVideoReady));
    if (playbackRun !== processPlaybackRun) return;

    processVideos.forEach((video) => {
      video.currentTime = 0;
    });
    await Promise.allSettled(processVideos.map((video) => video.play()));
  }

  let productionPlaybackRun = 0;
  let productionVideoEnabled = false;

  productionVideo?.addEventListener("play", () => {
    if (!productionVideoEnabled) productionVideo.pause();
  });

  async function setProductionVideoActive(isActive) {
    const playbackRun = ++productionPlaybackRun;
    productionVideoEnabled = isActive;
    if (!productionVideo) return;

    productionVideo.pause();
    if (!isActive) return;

    productionVideo.currentTime = 0;
    await waitForVideoReady(productionVideo);
    if (playbackRun !== productionPlaybackRun) return;

    productionVideo.currentTime = 0;
    await productionVideo.play().catch(() => {});
  }

  let experiencePlaybackRun = 0;
  let experienceVideosEnabled = false;

  experienceVideos.forEach((video) => {
    video.addEventListener("play", () => {
      if (!experienceVideosEnabled) video.pause();
    });
  });

  async function setExperienceVideosActive(isActive) {
    const playbackRun = ++experiencePlaybackRun;
    experienceVideosEnabled = isActive;

    experienceVideos.forEach((video) => {
      video.pause();
      if (isActive) video.currentTime = 0;
    });

    if (!isActive || !experienceVideos.length) return;

    await Promise.allSettled(experienceVideos.map(waitForVideoReady));
    if (playbackRun !== experiencePlaybackRun) return;

    experienceVideos.forEach((video) => {
      video.currentTime = 0;
    });
    await Promise.allSettled(experienceVideos.map((video) => video.play()));
  }

  if (productionScene && "IntersectionObserver" in window) {
    const productionObserver = new IntersectionObserver(([entry]) => {
      productionScene.classList.toggle("is-visible", entry.isIntersecting);
    }, { threshold: 0.16 });

    productionObserver.observe(productionScene);
  } else if (productionScene) {
    productionScene.classList.add("is-visible");
  }

  if (territoryScene && "IntersectionObserver" in window) {
    const territoryObserver = new IntersectionObserver(([entry]) => {
      territoryScene.classList.toggle("is-visible", entry.isIntersecting);
      setExperienceVideosActive(entry.isIntersecting);
    }, { threshold: 0.16 });

    territoryObserver.observe(territoryScene);
  } else if (territoryScene) {
    territoryScene.classList.add("is-visible");
    setExperienceVideosActive(true);
  }

  if (finaleScene && "IntersectionObserver" in window) {
    const finaleObserver = new IntersectionObserver(([entry]) => {
      finaleScene.classList.toggle("is-visible", entry.isIntersecting);
    }, { threshold: 0.16 });

    finaleObserver.observe(finaleScene);
  } else if (finaleScene) {
    finaleScene.classList.add("is-visible");
  }

  [scheduleScene, closingScene].forEach((scene) => {
    if (!scene) return;
    if (!("IntersectionObserver" in window)) { scene.classList.add("is-visible"); return; }
    const observer = new IntersectionObserver(([entry]) => scene.classList.toggle("is-visible", entry.isIntersecting), { threshold: 0.16 });
    observer.observe(scene);
  });

  const closingImageSource = closingMaria?.dataset.imageSrc?.trim();
  const closingImage = closingMaria?.querySelector("img");
  if (closingImageSource && closingImage) {
    closingImage.src = closingImageSource;
    closingImage.hidden = false;
    closingMaria.removeAttribute("aria-hidden");
  }

  const presentationScenes = [...document.querySelectorAll(".ctf-scene")]
    .filter((scene) => /^escena-0[1-8]$/.test(scene.id))
    .sort((firstScene, secondScene) => firstScene.id.localeCompare(secondScene.id));
  const presentationNav = document.querySelector(".ctf-presentation-nav");
  const previousSceneButton = document.querySelector(".ctf-presentation-prev");
  const nextSceneButton = document.querySelector(".ctf-presentation-next");
  const currentSceneLabel = document.querySelector(".ctf-presentation-current");

  if (presentationScenes.length && presentationNav && previousSceneButton && nextSceneButton && currentSceneLabel) {
    let activeSceneIndex = 0;
    let scrollFrame = 0;
    let presentationScrollLockedUntil = 0;
    let isTransitioning = false;
    let scrollEntryTimer = 0;
    const lastSceneIndex = presentationScenes.length - 1;

    function showLightScrollEntry(scene) {
      window.clearTimeout(scrollEntryTimer);
      presentationScenes.forEach((item) => item.classList.remove("is-scroll-entering"));
      scene.classList.add("is-scroll-entering");
      scrollEntryTimer = window.setTimeout(() => scene.classList.remove("is-scroll-entering"), 360);
    }

    function updatePresentationState(index, source = "navigation") {
      const previousIndex = activeSceneIndex;
      activeSceneIndex = Math.max(0, Math.min(index, lastSceneIndex));
      const sceneNumber = String(activeSceneIndex + 1).padStart(2, "0");
      const sceneChanged = activeSceneIndex !== previousIndex;

      if (source === "scroll" && activeSceneIndex !== previousIndex && !isTransitioning && !reducedMotion) {
        showLightScrollEntry(presentationScenes[activeSceneIndex]);
      }

      particleBackground?.setScene(activeSceneIndex);
      document.body.dataset.activeScene = sceneNumber;
      if (source === "initial" || sceneChanged) {
        setProcessVideosActive(presentationScenes[activeSceneIndex] === languageScene);
        setProductionVideoActive(presentationScenes[activeSceneIndex] === productionScene);
      }
      currentSceneLabel.textContent = sceneNumber;
      previousSceneButton.disabled = isTransitioning || activeSceneIndex === 0;
      nextSceneButton.disabled = isTransitioning || activeSceneIndex === lastSceneIndex;
      presentationNav.setAttribute(
        "aria-label",
        `Navegación de presentación. Escena ${activeSceneIndex + 1} de ${presentationScenes.length}`
      );
    }

    function findSceneNearestViewportCenter() {
      if (performance.now() < presentationScrollLockedUntil) return;

      const viewportCenter = window.innerHeight / 2;
      let nearestIndex = activeSceneIndex;
      let nearestDistance = Number.POSITIVE_INFINITY;

      presentationScenes.forEach((scene, index) => {
        const bounds = scene.getBoundingClientRect();
        const sceneCenter = Math.max(bounds.top, Math.min(viewportCenter, bounds.bottom));
        const distance = Math.abs(viewportCenter - sceneCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      updatePresentationState(nearestIndex, "scroll");
    }

    function queueViewportSync() {
      if (scrollFrame) return;

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        findSceneNearestViewportCenter();
      });
    }

    function wait(milliseconds) {
      return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    }

    function pauseSceneVideos(scene) {
      scene.querySelectorAll("video").forEach((video) => video.pause());
    }

    function resumeSceneVideos(scene) {
      scene.querySelectorAll("video").forEach((video) => {
        const shouldPlay = video === projectVideo ||
          video.dataset.autoplay === "true";

        if (shouldPlay && video.src) {
          if (video === projectVideo) configureProjectVideo();
          video.play().catch(() => {});
        }
      });
    }

    function getTransitionTiming(pair) {
      if (reducedMotion) return { exit: 80, enter: 100 };
      return { exit: 160, enter: 260 };
    }

    async function navigateToScene(index) {
      const nextIndex = Math.max(0, Math.min(index, lastSceneIndex));
      if (isTransitioning || nextIndex === activeSceneIndex) return;

      const currentScene = presentationScenes[activeSceneIndex];
      const targetScene = presentationScenes[nextIndex];
      const direction = nextIndex > activeSceneIndex ? "forward" : "backward";
      const edgeStart = Math.min(activeSceneIndex, nextIndex) + 1;
      const edgeEnd = Math.max(activeSceneIndex, nextIndex) + 1;
      const pair = Math.abs(nextIndex - activeSceneIndex) === 1
        ? `${String(edgeStart).padStart(2, "0")}-${String(edgeEnd).padStart(2, "0")}`
        : "jump";
      const timing = getTransitionTiming(pair);

      isTransitioning = true;
      presentationScrollLockedUntil = performance.now() + timing.exit + timing.enter + 160;
      presentationNav.setAttribute("aria-busy", "true");
      previousSceneButton.disabled = true;
      nextSceneButton.disabled = true;
      document.body.dataset.transitionDirection = direction;
      document.body.dataset.transitionPair = pair;
      currentScene.classList.add("is-transition-leaving");
      pauseSceneVideos(currentScene);

      await wait(timing.exit);

      targetScene.classList.add("is-transition-entering");
      targetScene.scrollIntoView({ behavior: "auto", block: "start" });
      updatePresentationState(nextIndex, "transition");
      window.history.replaceState(null, "", `#${targetScene.id}`);
      currentScene.classList.remove("is-transition-leaving");

      await new Promise((resolve) => window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      }));
      targetScene.classList.add("is-transition-arriving");
      targetScene.classList.remove("is-transition-entering");

      await wait(timing.enter);

      targetScene.classList.remove("is-transition-arriving");
      delete document.body.dataset.transitionDirection;
      delete document.body.dataset.transitionPair;
      presentationNav.removeAttribute("aria-busy");
      isTransitioning = false;
      updatePresentationState(nextIndex, "transition-end");
      resumeSceneVideos(targetScene);
      queueViewportSync();
    }

    function isEditableTarget(target) {
      return target instanceof Element && Boolean(
        target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
      );
    }

    previousSceneButton.addEventListener("click", () => navigateToScene(activeSceneIndex - 1));
    nextSceneButton.addEventListener("click", () => navigateToScene(activeSceneIndex + 1));

    document.addEventListener("keydown", (event) => {
      if (
        ageModal?.open ||
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) return;

      let targetIndex = null;

      if (event.key === "ArrowRight" || event.key === " ") targetIndex = activeSceneIndex + 1;
      if (event.key === "ArrowLeft") targetIndex = activeSceneIndex - 1;
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = lastSceneIndex;
      if (targetIndex === null) return;

      event.preventDefault();
      navigateToScene(targetIndex);
    });

    if ("IntersectionObserver" in window) {
      const presentationObserver = new IntersectionObserver(queueViewportSync, {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0
      });

      presentationScenes.forEach((scene) => presentationObserver.observe(scene));
    }

    window.addEventListener("scroll", queueViewportSync, { passive: true });
    window.addEventListener("resize", queueViewportSync, { passive: true });

    const initialHashIndex = presentationScenes.findIndex((scene) => `#${scene.id}` === window.location.hash);
    updatePresentationState(initialHashIndex >= 0 ? initialHashIndex : 0, "initial");
    queueViewportSync();
  }
});
