/** Pausa e libera os players de áudio de uma tela que está sendo fechada. */
export function stopAudioElements(container) {
  if (!container?.querySelectorAll) return;

  for (const audio of container.querySelectorAll("audio")) {
    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {
      // O áudio pode ainda não ter carregado os metadados.
    }

    audio.removeAttribute("src");
    audio.load();
  }
}