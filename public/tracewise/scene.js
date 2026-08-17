// TraceWise — 3D scene parallax (presentational only).
(function () {
  if (window.__twScene) return;
  window.__twScene = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 768px)").matches;
  if (reduce || small) return;

  const boot = () => {
    const shapes = Array.from(document.querySelectorAll(".bg-shape"));
    const grid = document.querySelector(".bg-grid");
    const glow = document.querySelector(".bg-hero-glow");
    let frame = 0;

    window.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        shapes.forEach((el, i) => {
          const depth = 14 + ((i * 11) % 46);
          el.style.setProperty("--sx", (-x * depth).toFixed(1) + "px");
          el.style.setProperty("--sy", (-y * depth * 0.7).toFixed(1) + "px");
        });
        if (grid) {
          grid.style.setProperty("--tw-px", (-x * 26).toFixed(1) + "px");
          grid.style.setProperty("--tw-py", (-y * 10).toFixed(1) + "px");
        }
        if (glow) glow.style.translate = `${-x * 30}px ${-y * 18}px`;
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
