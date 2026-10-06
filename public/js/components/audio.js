/**
 * Toca um arquivo de áudio. Devolve uma função que para e libera o som.
 *   onProgress(fração, segundos, duração)
 *   onEnd()   fim, erro ou falha ao iniciar
 */
export function playAudio(url, { onProgress, onEnd }) {
  const audio = new Audio(url);
  let stopped = false;
  const end = () => { if (!stopped) onEnd(); };
  audio.addEventListener("timeupdate", () => {
    if (!stopped) onProgress(audio.currentTime / (audio.duration || 1), audio.currentTime, audio.duration);
  });
  audio.addEventListener("ended", end);
  audio.addEventListener("error", end);
  audio.play().catch(end);
  return () => {
    stopped = true;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };
}

/** Duração (s) de um áudio, lendo só os metadados. Resolve 0 se falhar. */
export function audioDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("loadedmetadata", () => resolve(audio.duration));
    audio.addEventListener("error", () => resolve(0));
    audio.src = url;
  });
}
