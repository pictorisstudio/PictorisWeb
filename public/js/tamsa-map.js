const TAMSA_KML_SOURCE = "data/tamsa/tamsa-route.kml";

const tamsaFallbackPoints = [
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

const tamsaFallbackLandmarks = [
  {
    id: "humedal-cuchavira",
    name: "Humedal Cuchivira",
    type: "wetland",
    lat: 5.7111,
    lng: -72.9266,
  },
];

const tamsaMuralDetails = {
  axa: {
    title: "Entre el agua y la memoria",
    image: "assets/ProyectosTrasmedia/Tamsa/axa-entre-el-agua-y-la-memoria.png",
    description: [
      "La obra busca crear un diálogo entre pasado y presente, recordándonos que los territorios guardan historias que van mucho más allá de lo que podemos ver. Los registros, símbolos y conocimientos de los pueblos que habitaron estas tierras son parte de una memoria invaluable que merece ser conocida, preservada y reinterpretado.",
      "Mi inspiración con cada elemento de la obra fue extraída del museo, el fondo busca interpretar los tejidos, el pez las especies que se conservan para su observación, el collar de caracol y conchas en representación del intercambio monetario que se hacía con ellos y el niño es de una fotografía exhibída y pensé: \"Quizás nunca sepamos quién fue aquel niño, pero mientras su imagen siga despertando preguntas, su historia seguirá viviendo.\"",
      "También este mural busca recordarnos día a día la lucha por la preservación de Cuchavira, para que este se mantenga en el presente y futuro de Sogamoso.",
    ],
    socialUrl: "https://www.instagram.com/axa_art97/",
  },
  "caucho-sebas tiempo": {
    title: "MANIFIESTO DE MURALISMO DE ABYA YALA",
    image: "assets/ProyectosTrasmedia/Tamsa/caucho-sebas-tiempo-manifiesto-abya-yala.png",
    socials: [
      {
        label: "Sebas Tiempo",
        url: "https://www.instagram.com/sebas_tiempo_o/",
      },
      {
        label: "Caucho",
        url: "https://www.instagram.com/caucho__/",
      },
    ],
    description: [
      "Del fuego, la piedra y la memoria colectiva.",
      "Nombramos este territorio como Abya Yala, porque antes de ser llamado América ya era tierra viva, ya era espíritu, ya era memoria. Nombrarlo Abya Yala es recordar que nuestra historia no comienza con la colonia, ni con los mapas impuestos, ni con los nombres heredados del poder. Nuestra historia comienza en la piedra.",
      "Antes del museo, antes del lienzo, antes de la academia, ya existía el muro. Las primeras manos de este territorio pintaron sobre la roca, sobre las cuevas, sobre la piel de la montaña. No pintaban para vender. No pintaban para exhibir. No pintaban para firmar. Pintaban para recordar. Pintaban para invocar. Pintaban para dejar señal del paso humano sobre la tierra.",
      "Las pinturas rupestres son nuestro primer mural. Son la memoria más antigua del gesto de crear. Son la prueba de que el arte nació colectivo, nació ritual, nació unido al territorio. Por eso afirmamos: el muralismo de Abya Yala no comienza en el siglo XX. Comienza en la piedra. Comienza en el fuego. Comienza en la comunidad.",
      "Venimos de pueblos que hicieron del vivir un arte, y del arte una forma de conocimiento. Nuestros ancestros no separaron la ceremonia del trabajo, la imagen de la palabra, la tierra del espíritu. Hoy seguimos caminando sobre ese mismo suelo, aunque la colonia haya intentado borrarlo, aunque nos hayan enseñado a llamarnos de otra forma, aunque nos hayan hecho creer que el arte pertenece a unos pocos.",
      "Rechazamos la idea colonial del arte como objeto privado, como mercancía, como propiedad. Rechazamos el nombre impuesto que nos obligó a llamarnos América Latina olvidando que somos Abya Yala, territorio antiguo, territorio herido, territorio vivo.",
      "Nuestro muralismo nace del encuentro. Nace del trabajo colectivo. Nace del compartir el alimento, la palabra, las ofrendas, la pintura, el fuego. Nuestros maestros no son solo academias. Son los abuelos. Son los taitas. Son las madres. Son los pueblos que resisten. Son los que siguen hablando con el agua, con la montaña, con el maíz, con el cielo. Ellos nos enseñan que crear también es ofrendar.",
      "Cuando se está en el ritual, el pensamiento atraviesa demasiados estados cuando se trata de comprender desde la inocencia; de pintar más que hablar, de entender el valor que tiene reunirse en torno a las llamas de la verdad, el origen de la palabra, y la ayuda mutua entre uno y el otro para que la llama vibre y se sostenga el rito.",
      "Dentro del valor que tiene conservar la vida, recordar y pensar esta tierra donde está plantado este muro: tierra muisca que ya ha sido pisada muchas veces. Ahora estamos en la búsqueda del recuerdo y la memoria de esas pisadas; desde la unidad y el cariño nos encontramos en torno al ritual de la pintura.",
      "Nuestros ancestros pintaron la piedra para dejar memoria de su paso por la tierra y su diálogo con el cosmos. Hoy volvemos a ese gesto antiguo: pintar juntos para transformar el pensar colectivo en memoria viva de Abya Yala.",
    ],
  },
  godie: {
    description: [
      "Este mural retrata a tres niños campesinos protegidos bajo un mismo paraguas, sobre un majestuoso fondo de montañas boyacenses. La obra simboliza la fraternidad, el refugio mutuo y la alegría genuina de la niñez rural colombiana, destacando la resiliencia y el arraigo cultural de quienes crecen en el corazón del campo.",
    ],
    socialUrl: "https://www.instagram.com/eidogrednu19/",
  },
  "chucho-negro jose": {
    cardTitle: "Cuchavira Aun Respira / Guardianes del Cuchavira",
    title: "Cuchavira Aun Respira",
    image: "assets/ProyectosTrasmedia/Tamsa/chucho-negro-jose-cuchavira-aun-respira.png",
    socialUrl: "https://www.instagram.com/chucho.zr/",
    description: [
      "El mural retrata el momento en que la comunidad se junta para limpiar las aguas del humedal Cuchavira. Simboliza las acciones colectivas que buscan proteger y defender los ecosistemas.",
      "Un escenario onírico en donde se retrata a tres mujeres extrayendo buchón del humedal, iluminadas por un símbolo solar propio de la cultura muisca que emerge de las aguas y le da nombre al territorio Suamox: morada del sol.",
      "La tingua que acompaña la escena simboliza el hogar y en torno a la composición se ilustra una secuencia de la metamorfosis de las ranas, representando el ciclo del agua y a su vez, el ciclo de la vida.",
      "Dos guerreros con cascos anfibios cierran la escena y refuerzan el mensaje del mural.",
    ],
    additionalWorks: [
      {
        artist: "Negro José",
        title: "GUARDIANES DEL CUCHAVIRA",
        description: [
          "Los guardianes laterales protegen el humedal que se radica en el medio de la obra, sin embargo, estos se encuentran ya petrificados, haciendo alusión a la conciencia que aún no ha despertado.",
        ],
      },
    ],
  },
  negra: {
    title: "A un gato",
    image: "assets/ProyectosTrasmedia/Tamsa/negra-a-un-gato.png",
    socialUrl: "https://www.instagram.com/la_negra_art/",
    description: [
      "El amor hacia mis animales es un sentir que me acerca a lo sagrado, a lo esencial y a lo puro. No encuentro nada parecido en otros relacionamientos.",
      "El amor hacia mis animales es una reconciliación constante con la vida, una posibilidad de retorno hacia un espacio-tiempo donde todo o nada importa, aún no lo descifro.",
    ],
  },
  kynsha: {
    title: "Cuchavira, las cantos del agua",
    image: "assets/ProyectosTrasmedia/Tamsa/kynsha-cuchavira-los-cantos-del-agua.png",
    socialUrl: "https://www.instagram.com/kinsha.arte/",
    description: [
      "Esta obra nace de la utopía, nace del reencuentro entre la ciudad y el humedal, nace de reconocerlo como un sujeto de derechos, como ser que guarda la memoria y la palabra de los ancestros.",
      "En esta pieza el agua canta y la raíz nos conduce a lo profundo del recuerdo donde el paisaje y el sueño, la naturaleza y el hombre se hacen uno solo.",
    ],
  },
};

let lastMuralTrigger = null;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMuralDetail(point) {
  return tamsaMuralDetails[normalizeText(point.name)];
}

function renderMuralSocials(detail) {
  if (!detail) {
    return "";
  }

  const socials = detail.socials || (detail.socialUrl ? [{ label: "Instagram", url: detail.socialUrl }] : []);

  if (!socials.length) {
    return "";
  }

  return `
    <div class="mural-socials">
      ${socials
        .map((social) => `<a class="mural-social" href="${escapeHtml(social.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(social.label)}</a>`)
        .join("")}
    </div>
  `;
}

function getPointRole(point) {
  if (point.type === "wetland") {
    return "wetland";
  }

  if (point.type === "landmark") {
    return "landmark";
  }

  if (point.id === point.routeStartId) {
    return "start";
  }

  if (point.id === point.routeEndId) {
    return "end";
  }

  return "route";
}

function getPointLabel(point) {
  const role = getPointRole(point);

  if (role === "wetland") {
    return "H";
  }

  if (role === "landmark") {
    return "R";
  }

  return point.id;
}

function createTamsaMarker(point) {
  const role = getPointRole(point);
  const markerSize = role === "wetland" || role === "landmark" ? [34, 34] : [26, 26];
  const markerAnchor = role === "wetland" || role === "landmark" ? [17, 17] : [13, 13];

  return L.divIcon({
    className: `tamsa-map-marker tamsa-map-marker-${role}`,
    html: `<span>${getPointLabel(point)}</span>`,
    iconSize: markerSize,
    iconAnchor: markerAnchor,
    popupAnchor: [0, -13],
  });
}

function createTamsaPopup(point) {
  const role = getPointRole(point);
  const eyebrow = {
    start: "Inicio del recorrido",
    end: "Final del recorrido",
    wetland: "Ecosistema señalado",
    landmark: "Referencia territorial",
    route: `Mural ${point.id}`,
  }[role];
  const detail = getMuralDetail(point);
  const imageSource = point.image || detail?.image;
  const image = imageSource
    ? `<img src="${escapeHtml(imageSource)}" alt="Mural ${escapeHtml(point.name)}" loading="lazy" />`
    : "";
  const title = detail?.title ? `<em>${escapeHtml(detail.title)}</em>` : "";

  return `
    <article class="tamsa-map-popup">
      ${image}
      <span>${eyebrow}</span>
      <strong>${escapeHtml(point.name)}</strong>
      ${title}
    </article>
  `;
}

function parseCoordinatePair(value) {
  const [lng, lat] = String(value || "")
    .trim()
    .split(",")
    .map(Number);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function getKmlChildren(node, tagName) {
  return Array.from(node.getElementsByTagNameNS("*", tagName));
}

function readKmlChildText(node, tagName) {
  return getKmlChildren(node, tagName)[0]?.textContent?.trim() || "";
}

function readKmlPathText(node, path) {
  let currentNode = node;

  for (const tagName of path) {
    currentNode = getKmlChildren(currentNode, tagName)[0];

    if (!currentNode) {
      return "";
    }
  }

  return currentNode.textContent?.trim() || "";
}

function getKmlPointId(name, index) {
  const directMatch = name.match(/^\s*(\d{1,2})(?:\s*[-.])?/);

  if (directMatch) {
    return Number(directMatch[1]);
  }

  return null;
}

function cleanKmlPointName(name) {
  return String(name || "")
    .replace(/^\s*\d{1,2}\s*[-.]\s*/, "")
    .trim();
}

function applyRouteRoles(points) {
  const routeIds = points.map((point) => point.id).filter(Number.isFinite);
  const routeStartId = Math.min(...routeIds);
  const routeEndId = Math.max(...routeIds);

  return points.map((point) => ({
    ...point,
    routeStartId,
    routeEndId,
  }));
}

function parseTamsaKml(kmlText) {
  const doc = new DOMParser().parseFromString(kmlText, "application/xml");
  const placemarks = getKmlChildren(doc, "Placemark");
  const routePoints = [];
  const landmarks = [];
  let routeLine = [];

  placemarks.forEach((placemark, index) => {
    const name = readKmlChildText(placemark, "name") || `Punto ${index + 1}`;
    const normalizedName = normalizeText(name);
    const pointCoordinate = readKmlPathText(placemark, ["Point", "coordinates"]);
    const lineCoordinates = readKmlPathText(placemark, ["LineString", "coordinates"]);

    if (lineCoordinates) {
      routeLine = lineCoordinates
        .split(/\s+/)
        .map(parseCoordinatePair)
        .filter(Boolean);
      return;
    }

    const coordinates = parseCoordinatePair(pointCoordinate);

    if (!coordinates) {
      return;
    }

    if (normalizedName.includes("humedal") || normalizedName.includes("cuchavira") || normalizedName.includes("cuchivira")) {
      landmarks.push({
        id: "humedal-cuchavira",
        name,
        type: "wetland",
        ...coordinates,
      });
      return;
    }

    const pointId = getKmlPointId(name, routePoints.length);

    if (!pointId) {
      landmarks.push({
        id: `referencia-${landmarks.length + 1}`,
        name,
        type: "landmark",
        ...coordinates,
      });
      return;
    }

    routePoints.push({
      id: pointId,
      name: cleanKmlPointName(name),
      ...coordinates,
    });
  });

  routePoints.sort((a, b) => a.id - b.id);
  const normalizedRoutePoints = applyRouteRoles(routePoints.length ? routePoints : tamsaFallbackPoints);

  return {
    points: normalizedRoutePoints,
    landmarks: landmarks.length ? landmarks : tamsaFallbackLandmarks,
    routeLine,
    source: routePoints.length ? "kml" : "fallback",
  };
}

async function loadTamsaMapData() {
  try {
    const response = await fetch(TAMSA_KML_SOURCE, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("KML not available");
    }

    return parseTamsaKml(await response.text());
  } catch (error) {
    return {
      points: applyRouteRoles(tamsaFallbackPoints),
      landmarks: tamsaFallbackLandmarks,
      routeLine: [],
      source: "fallback",
    };
  }
}

function renderTamsaList(points) {
  const list = document.getElementById("tamsa-map-points");

  if (!list) {
    return;
  }

  list.innerHTML = points
    .map((point) => {
      const role = getPointRole(point);
      const suffix = role === "start" ? " · Inicio" : role === "end" ? " · Final" : "";
      return `<li data-point-id="${point.id}" class="tamsa-map-list-${role}"><span>${point.id}</span>${point.name}${suffix}</li>`;
    })
    .join("");
}

function renderTamsaMurals(points) {
  const grid = document.getElementById("tamsa-mural-grid");

  if (!grid) {
    return;
  }

  grid.innerHTML = points
    .map((point) => {
      const number = String(point.id).padStart(2, "0");
      const detail = getMuralDetail(point);
      const title = detail?.cardTitle || detail?.title || "Título por definir";
      const imageSource = point.image || detail?.image;
      const imageStyle = detail?.imagePosition
        ? ` style="--mural-position: ${escapeHtml(detail.imagePosition)}"`
        : "";
      const image = imageSource
        ? `<img src="${escapeHtml(imageSource)}" alt="Mural ${escapeHtml(point.name)}" loading="lazy" />`
        : `<span>Imagen mural ${number}</span>`;

      return `
        <button class="mural-card" type="button" data-mural-id="${point.id}" aria-label="Ver información del mural ${number}, ${escapeHtml(point.name)}">
          <span class="mural-image-slot"${imageStyle}>${image}</span>
          <span class="mural-copy">
            <span class="mural-number">${number}</span>
            <span class="mural-artist">${escapeHtml(point.name)}</span>
            <span class="mural-title">${escapeHtml(title)}</span>
          </span>
        </button>
      `;
    })
    .join("");

  grid.querySelectorAll(".mural-card").forEach((card) => {
    card.addEventListener("click", () => {
      const point = points.find((item) => item.id === Number(card.dataset.muralId));

      if (point) {
        openTamsaMuralModal(point);
      }
    });
  });
}

function getMuralModalNode() {
  let modal = document.getElementById("tamsa-mural-modal");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.id = "tamsa-mural-modal";
  modal.className = "mural-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "tamsa-mural-modal-title");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="mural-modal-backdrop" data-mural-close></div>
    <div class="mural-modal-panel" role="document">
      <button class="mural-modal-close" type="button" data-mural-close aria-label="Cerrar información del mural">×</button>
      <div class="mural-modal-image"></div>
      <div class="mural-modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-mural-close")) {
      closeTamsaMuralModal();
    }
  });

  return modal;
}

function renderMuralDetail(point) {
  const detail = getMuralDetail(point);
  const number = String(point.id).padStart(2, "0");
  const title = detail?.title || "Título por definir";
  const imageSource = point.image || detail?.image;
  const imageStyle = detail?.imagePosition
    ? ` style="--mural-position: ${escapeHtml(detail.imagePosition)}"`
    : "";
  const image = imageSource
    ? `<img src="${escapeHtml(imageSource)}" alt="Mural ${escapeHtml(point.name)}"${imageStyle} />`
    : `<span${imageStyle}>Imagen mural ${number}</span>`;
  const description = detail?.description?.length
    ? detail.description.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
    : "<p>Información en proceso de documentación.</p>";
  const additionalWorks = detail?.additionalWorks?.length
    ? detail.additionalWorks
      .map((work) => `
        <section class="mural-modal-extra">
          <span>${escapeHtml(work.artist)}</span>
          <h5>${escapeHtml(work.title)}</h5>
          ${(work.description || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </section>
      `)
      .join("")
    : "";
  const social = renderMuralSocials(detail);

  return {
    image,
    content: `
      <span class="mural-number">${number}</span>
      <h3>${escapeHtml(point.name)}</h3>
      <h4 id="tamsa-mural-modal-title">${escapeHtml(title)}</h4>
      <div class="mural-modal-description">${description}</div>
      ${additionalWorks}
      ${social}
    `,
  };
}

function openTamsaMuralModal(point) {
  const modal = getMuralModalNode();
  const imageNode = modal.querySelector(".mural-modal-image");
  const contentNode = modal.querySelector(".mural-modal-content");
  const closeButton = modal.querySelector(".mural-modal-close");
  const rendered = renderMuralDetail(point);

  lastMuralTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  imageNode.innerHTML = rendered.image;
  contentNode.innerHTML = rendered.content;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("mural-modal-open");
  closeButton.focus();
}

function closeTamsaMuralModal() {
  const modal = document.getElementById("tamsa-mural-modal");

  if (!modal) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("mural-modal-open");

  if (lastMuralTrigger) {
    lastMuralTrigger.focus();
    lastMuralTrigger = null;
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTamsaMuralModal();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const modal = document.getElementById("tamsa-mural-modal");

  if (!modal?.classList.contains("is-open")) {
    return;
  }

  const focusable = Array.from(modal.querySelectorAll("a[href], button:not([disabled])"))
    .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function updateTamsaSummary(data) {
  const summary = document.getElementById("tamsa-map-summary");

  if (!summary) {
    return;
  }

  const sourceText = data.source === "kml" ? "Datos cargados desde KML" : "Datos provisionales del sitio";
  const routeEndId = data.points[data.points.length - 1]?.id || 0;
  summary.textContent = `${sourceText} · ruta principal del mural 1 al mural ${routeEndId} · Humedal Cuchivira señalado`;
}

async function initTamsaMap() {
  const mapNode = document.getElementById("tamsa-map");

  if (!mapNode || typeof L === "undefined") {
    return;
  }

  const data = await loadTamsaMapData();
  const routePoints = data.points;
  const route = data.routeLine.length
    ? data.routeLine.map((point) => [point.lat, point.lng])
    : routePoints.map((point) => [point.lat, point.lng]);
  const allBoundsPoints = [...routePoints, ...data.landmarks].map((point) => [point.lat, point.lng]);

  renderTamsaList(data.points);
  renderTamsaMurals(data.points);
  updateTamsaSummary(data);

  const map = L.map(mapNode, {
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const markers = new Map();

  L.polyline(route, {
    color: "#e1b86d",
    weight: 4,
    opacity: 0.92,
    lineJoin: "round",
  }).addTo(map);

  routePoints.forEach((point) => {
    const marker = L.marker([point.lat, point.lng], { icon: createTamsaMarker(point) })
      .bindPopup(createTamsaPopup(point), {
        className: "tamsa-popup",
        maxWidth: 260,
      })
      .addTo(map);

    markers.set(point.id, marker);
  });

  data.landmarks.forEach((point) => {
    L.marker([point.lat, point.lng], { icon: createTamsaMarker(point) })
      .bindPopup(createTamsaPopup(point), {
        className: "tamsa-popup",
        maxWidth: 260,
      })
      .addTo(map);
  });

  map.fitBounds(allBoundsPoints, {
    padding: [34, 34],
    maxZoom: 16,
  });

  document.querySelectorAll(".tamsa-map-list li").forEach((item) => {
    const pointId = Number(item.dataset.pointId);
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

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initTamsaMap, { once: true });
} else {
  initTamsaMap();
}
