(() => {
  const carousel = document.querySelector("[data-testimonial-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-carousel-track]");
  const cards = [...track.children];
  const previous = carousel.querySelector("[data-carousel-previous]");
  const next = carousel.querySelector("[data-carousel-next]");
  const status = carousel.querySelector("[data-carousel-status]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isGerman = document.documentElement.lang === "de";
  let index = 0;
  let timer;

  const visibleCount = () => window.matchMedia("(max-width: 800px)").matches ? 1 : 3;
  const lastStart = () => Math.max(0, cards.length - visibleCount());

  function updateStatus() {
    const first = index + 1;
    const last = Math.min(cards.length, index + visibleCount());
    status.textContent = `${first}–${last} ${isGerman ? "von" : "of"} ${cards.length}`;
  }

  function show(target, behavior = "smooth") {
    index = Math.min(lastStart(), Math.max(0, target));
    track.scrollTo({left: cards[index].offsetLeft - track.offsetLeft, behavior});
    updateStatus();
  }

  function stop() {
    window.clearInterval(timer);
  }

  function start() {
    stop();
    if (prefersReducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => show(index >= lastStart() ? 0 : index + 1), 5000);
  }

  previous.addEventListener("click", () => {
    show(index <= 0 ? lastStart() : index - 1);
    start();
  });
  next.addEventListener("click", () => {
    show(index >= lastStart() ? 0 : index + 1);
    start();
  });
  carousel.addEventListener("pointerenter", stop);
  carousel.addEventListener("pointerleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", start);
  window.addEventListener("resize", () => show(index, "auto"));
  prefersReducedMotion.addEventListener("change", start);

  updateStatus();
  start();
})();
