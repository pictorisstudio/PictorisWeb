const peaceMapStories = {
  Arauca: {
    title: "Relato de llegada y reconstrucción",
    body: "Una ruta marcada por la salida urgente, el cuidado familiar y la búsqueda de estabilidad en Duitama.",
    type: "Testimonio de memoria",
    event: "Desplazamiento forzado",
    arrival: "Duitama como ciudad de acogida",
    future: "Recordar para no repetir"
  },
  Boyacá: {
    title: "Memoria cercana al territorio",
    body: "Relatos de tránsito interno y recomposición de vínculos comunitarios en el departamento.",
    type: "Relato territorial",
    event: "Pérdida y ruptura comunitaria",
    arrival: "Redes familiares y barriales",
    future: "Cuidar la memoria local"
  },
  Caquetá: {
    title: "Camino largo hacia la acogida",
    body: "Una historia de desplazamiento desde el sur del país hacia una ciudad donde fue posible empezar de nuevo.",
    type: "Relato de tránsito",
    event: "Desarraigo familiar",
    arrival: "Búsqueda de vivienda, trabajo y escuela",
    future: "Construir vida sin miedo"
  },
  Casanare: {
    title: "Entre llanura y montaña",
    body: "El cambio de paisaje acompaña una memoria de adaptación, duelo y reorganización familiar.",
    type: "Testimonio familiar",
    event: "Amenaza y desplazamiento",
    arrival: "Acogida urbana en Duitama",
    future: "Transformar el dolor en cuidado"
  },
  Cauca: {
    title: "Memoria de resistencia",
    body: "Relato asociado a resistencia cotidiana, protección de la familia y reconstrucción de proyecto de vida.",
    type: "Relato de mujer",
    event: "Violencia territorial",
    arrival: "Adaptación cultural y comunitaria",
    future: "Educar para la no repetición"
  },
  "La Guajira": {
    title: "Distancia, memoria y pertenencia",
    body: "Una ruta extensa que conecta pérdida, identidad y la necesidad de ser escuchada en el lugar de llegada.",
    type: "Relato identitario",
    event: "Desplazamiento y pérdida de redes",
    arrival: "Duitama como nuevo comienzo",
    future: "Escuchar para reparar"
  },
  Huila: {
    title: "Volver a nombrar la esperanza",
    body: "Historia de reorganización después del desarraigo, con énfasis en cuidado, trabajo y futuro.",
    type: "Relato de reconstrucción",
    event: "Desplazamiento forzado",
    arrival: "Búsqueda de estabilidad",
    future: "La memoria como aprendizaje"
  },
  Putumayo: {
    title: "Sembrar de nuevo",
    body: "Relato sobre pérdida del territorio, llegada a Duitama y formas de resistencia desde la vida cotidiana.",
    type: "Relato de resistencia",
    event: "Desarraigo territorial",
    arrival: "Reinicio familiar y laboral",
    future: "Reparación simbólica"
  },
  Tolima: {
    title: "Llegar con lo indispensable",
    body: "Una memoria de viaje, cuidado de los hijos y reconstrucción de confianza en una ciudad distinta.",
    type: "Relato de cuidado",
    event: "Desplazamiento y pérdida",
    arrival: "Redes de apoyo en Duitama",
    future: "No repetir desde la empatía"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".dept-point");
  const dept = document.getElementById("map-dept");
  const title = document.getElementById("map-title");
  const body = document.getElementById("map-body");
  const type = document.getElementById("map-type");
  const event = document.getElementById("map-event");
  const arrival = document.getElementById("map-arrival");
  const future = document.getElementById("map-future");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.dept;
      const story = peaceMapStories[key];
      if (!story) return;

      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      dept.textContent = key;
      title.textContent = story.title;
      body.textContent = story.body;
      type.textContent = story.type;
      event.textContent = story.event;
      arrival.textContent = story.arrival;
      future.textContent = story.future;
    });
  });

  const communityForm = document.querySelector(".community-form");
  if (communityForm) {
    communityForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }
});
