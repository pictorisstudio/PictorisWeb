const tamsaRoutePoints = [
  {
    id: 1,
    name: "CASA QUINCHA CHICHIMUT",
    lat: 5.708284102454819,
    lng: -72.92146918458145,
    image: "assets/ProyectosTrasmedia/Tamsa/Chichimut.jpg",
  },
  { id: 2, name: "1 MASPAZ", lat: 5.70810835787271, lng: -72.92165562553818 },
  { id: 3, name: "2", lat: 5.708246669108742, lng: -72.92164763683145 },
  { id: 4, name: "3 CAUCHO Y TIEMPO", lat: 5.708180116345265, lng: -72.92145830381936 },
  { id: 5, name: "4", lat: 5.708295868866358, lng: -72.9215381112983 },
  { id: 6, name: "5 MARGO", lat: 5.708249020801266, lng: -72.92124213701132 },
  { id: 7, name: "6 GAREK", lat: 5.708061476422931, lng: -72.92092483594752 },
  { id: 8, name: "7 NEGRA", lat: 5.708060395627696, lng: -72.92070282586228 },
  { id: 9, name: "8 Wosnan", lat: 5.709258212614936, lng: -72.92030106669918 },
  { id: 10, name: "10 NEGRO JOSE / CHUCHO", lat: 5.709759513005534, lng: -72.91996280922339 },
  { id: 11, name: "11 YELA", lat: 5.708905177576256, lng: -72.91979626611729 },
  { id: 12, name: "12 AXA", lat: 5.708669278376319, lng: -72.91930668772719 },
  { id: 13, name: "13 TIERRARA", lat: 5.708529878090519, lng: -72.91942536504217 },
  { id: 14, name: "14", lat: 5.707773899433549, lng: -72.91925810750415 },
  { id: 15, name: "15 TRIANA", lat: 5.707727945394754, lng: -72.91895478244724 },
  { id: 16, name: "16 GODIE", lat: 5.707711864730487, lng: -72.91887830786636 },
  { id: 17, name: "17 GUACHE", lat: 5.706032003255337, lng: -72.92163289801319 },
  { id: 18, name: "19 HOWIE / KYNSHA", lat: 5.697396371049375, lng: -72.9226263083106 },
  { id: 19, name: "20 RITO", lat: 5.699102230831088, lng: -72.92244500423305 },
  { id: 20, name: "21", lat: 5.709130995596558, lng: -72.92535876720255 },
  { id: 21, name: "22", lat: 5.709165771725787, lng: -72.92541780883435 },
  { id: 22, name: "23", lat: 5.709525258712094, lng: -72.92635613279391 },
  { id: 23, name: "24", lat: 5.70660563064498, lng: -72.92528179448855 },
  { id: 24, name: "29 LEO", lat: 5.697781074358623, lng: -72.92349923643131 },
  { id: 25, name: "30", lat: 5.703872184301999, lng: -72.92067494406024 },
  { id: 26, name: "LA PILITA", lat: 5.711461977615887, lng: -72.92686097748866 },
  { id: 27, name: "31 Jaime Sierra", lat: 5.7075995819304, lng: -72.9191305569131 },
  { id: 28, name: "32 PAVEL", lat: 5.702856504906848, lng: -72.92246935148962 },
  { id: 29, name: "GRONE / JUANCHO", lat: 5.706012749617843, lng: -72.91957069008221 },
  { id: 30, name: "Marcador sin titulo", lat: 5.700073234999124, lng: -72.92249234719436 },
];

function createTamsaMarker(point) {
  return L.divIcon({
    className: "tamsa-map-marker",
    html: `<span>${point.id}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -13],
  });
}

function createTamsaPopup(point) {
  const image = point.image
    ? `<img src="${point.image}" alt="Mural ${point.name}" loading="lazy" />`
    : "";

  return `
    <article class="tamsa-map-popup">
      ${image}
      <span>Mural ${point.id}</span>
      <strong>${point.name}</strong>
    </article>
  `;
}

function initTamsaMap() {
  const mapNode = document.getElementById("tamsa-map");

  if (!mapNode || typeof L === "undefined") {
    return;
  }

  const route = tamsaRoutePoints.map((point) => [point.lat, point.lng]);
  const map = L.map(mapNode, {
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const markers = new Map();

  tamsaRoutePoints.forEach((point) => {
    const marker = L.marker([point.lat, point.lng], { icon: createTamsaMarker(point) })
      .bindPopup(createTamsaPopup(point), {
        className: "tamsa-popup",
        maxWidth: 260,
      })
      .addTo(map);

    markers.set(point.id, marker);
  });

  map.fitBounds(route, {
    padding: [34, 34],
    maxZoom: 16,
  });

  document.querySelectorAll(".tamsa-map-list li").forEach((item) => {
    const pointId = Number(item.querySelector("span")?.textContent);
    const marker = markers.get(pointId);

    if (!marker) {
      return;
    }

    item.addEventListener("mouseenter", () => marker.openPopup());
    item.addEventListener("click", () => {
      map.flyTo(marker.getLatLng(), 17, { duration: 0.7 });
      marker.openPopup();
    });
  });
}

window.addEventListener("DOMContentLoaded", initTamsaMap);
