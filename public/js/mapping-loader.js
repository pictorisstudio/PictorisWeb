const startButton = document.querySelector("#mapping-start-camera");
const statusLabel = document.querySelector("#mapping-status");

if (startButton) {
  startButton.disabled = false;
  let loading = false;

  startButton.addEventListener("click", async () => {
    if (loading) return;
    loading = true;
    startButton.disabled = true;
    if (statusLabel) {
      statusLabel.textContent = "Cargando la experiencia interactiva...";
    }

    try {
      const { init } = await import("./mapping-experiencia.js");
      await init({ startImmediately: true });
    } catch (error) {
      loading = false;
      startButton.disabled = false;
      if (statusLabel) {
        statusLabel.textContent = "No se pudo cargar la experiencia. Intenta nuevamente.";
      }
      console.error(error);
    }
  });
}
