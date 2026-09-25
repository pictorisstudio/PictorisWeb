const mapSection = document.querySelector(".tamsa-map-section");

function loadStyle(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

let loadPromise;

function loadMap() {
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all([
    loadStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
  ]).then(() => import("./tamsa-map.js"));

  return loadPromise;
}

if (mapSection) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadMap().catch(console.error);
    }, { rootMargin: "160px 0px" });

    observer.observe(mapSection);
  } else {
    loadMap().catch(console.error);
  }
}
