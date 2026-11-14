document.addEventListener("DOMContentLoaded", () => {
  const dossierButton = document.querySelector(".ctf-dossier-action");
  const dossierStatus = document.querySelector("#ctf-dossier-status");
  const projectVideo = document.querySelector(".ctf-visual-media video");
  const mariaScene = document.querySelector(".ctf-scene-maria");
  const ageBlocks = [...document.querySelectorAll(".ctf-age")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileLayout = window.matchMedia("(max-width: 640px)");

  ageBlocks.forEach((ageBlock) => ageBlock.querySelector("video")?.pause());

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
        projectVideo.play().catch(() => {});
      } else {
        projectVideo.pause();
      }
    }, { threshold: 0.2 });

    videoObserver.observe(projectVideo);
  }

  function prepareAgeVideo(ageBlock) {
    const video = ageBlock.querySelector("video");
    const source = video?.dataset.videoSrc?.trim();

    if (!video || !source) return null;
    if (video.dataset.sourceReady === "true") return video;

    video.src = source;
    video.preload = "metadata";
    video.dataset.sourceReady = "true";
    ageBlock.classList.add("has-media");
    video.load();
    return video;
  }

  function activateAge(activeBlock) {
    ageBlocks.forEach((ageBlock) => {
      const video = ageBlock.querySelector("video");
      const isActive = ageBlock === activeBlock;
      ageBlock.classList.toggle("is-active", isActive);

      if (!video) return;
      if (isActive) {
        const preparedVideo = prepareAgeVideo(ageBlock);
        if (preparedVideo) {
          preparedVideo.play().catch(() => {});
        } else {
          video.pause();
        }
      } else {
        video.pause();
      }
    });
  }

  function pauseAllAges() {
    ageBlocks.forEach((ageBlock) => {
      ageBlock.classList.remove("is-active");
      ageBlock.querySelector("video")?.pause();
    });
  }

  if (mariaScene && ageBlocks.length && "IntersectionObserver" in window) {
    let sequenceTimers = [];

    const clearSequence = () => {
      sequenceTimers.forEach(window.clearTimeout);
      sequenceTimers = [];
    };

    const sceneObserver = new IntersectionObserver(([entry]) => {
      mariaScene.classList.toggle("is-visible", entry.isIntersecting);

      if (!entry.isIntersecting) {
        clearSequence();
        pauseAllAges();
        return;
      }

      if (!mobileLayout.matches) {
        clearSequence();
        ageBlocks.forEach((ageBlock, index) => {
          const delay = reducedMotion ? 0 : index * 650;
          sequenceTimers.push(window.setTimeout(() => activateAge(ageBlock), delay));
        });
      }
    }, { threshold: 0.18 });

    sceneObserver.observe(mariaScene);

    const ageObserver = new IntersectionObserver((entries) => {
      if (!mobileLayout.matches) return;

      const centered = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (centered) activateAge(centered.target);
    }, {
      threshold: [0.35, 0.55, 0.75],
      rootMargin: "-22% 0px -22% 0px",
    });

    ageBlocks.forEach((ageBlock) => {
      ageObserver.observe(ageBlock);
      ageBlock.addEventListener("mouseenter", () => {
        if (!mobileLayout.matches) activateAge(ageBlock);
      });
      ageBlock.addEventListener("focus", () => activateAge(ageBlock));
    });
  } else if (mariaScene) {
    mariaScene.classList.add("is-visible");
  }
});
