const startButton = document.querySelector("#mapping-start-camera");
const statusLabel = document.querySelector("#mapping-status");

async function loadMappingExperience() {
  if (!startButton) return;

  startButton.disabled = true;
  if (statusLabel) {
    statusLabel.textContent = "Cargando la experiencia interactiva...";
  }

  try {
    const { init } = await import("./mapping-experiencia.js");
    await init({ startImmediately: false });
  } catch (error) {
    startButton.disabled = false;
    if (statusLabel) {
      statusLabel.textContent = "No se pudo cargar la experiencia. Intenta nuevamente.";
    }
    console.error(error);
  }
}

loadMappingExperience();
