// TraceWise — 3D pointer tilt + parallax. Purely presentational.
(function () {
  if (window.__twTilt) return;
  window.__twTilt = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const TILT_SELECTORS = [".input-card", ".practice-card", ".loading-card"];

  function attach(el) {
    if (!el || el.dataset.twTilt) return;
    el.dataset.twTilt = "1";
    el.classList.add("tw-tilt");

    let frame = 0;

    const move = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--tw-ry", (px * 9).toFixed(2) + "deg");
        el.style.setProperty("--tw-rx", (-py * 7).toFixed(2) + "deg");
        el.style.setProperty("--tw-tz", "26px");
      });
    };

    el.addEventListener("pointerenter", () => el.classList.add("is-tilting"));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-tilting");
      el.style.setProperty("--tw-rx", "0deg");
      el.style.setProperty("--tw-ry", "0deg");
      el.style.setProperty("--tw-tz", "0px");
    });
  }

  function scan() {
    if (reduce || isMobile) return;
    TILT_SELECTORS.forEach((sel) =>
      document.querySelectorAll(sel).forEach(attach),
    );
  }

  // Background parallax follows the pointer for extra depth.
  function parallax() {
    if (reduce || isMobile) return;
    const orbs = Array.from(document.querySelectorAll(".bg-orb"));
    const grid = document.querySelector(".bg-grid");
    let frame = 0;
    window.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 18;
          orb.style.translate = `${-x * depth}px ${-y * depth}px`;
        });
        if (grid) {
          grid.style.rotate = `x ${62 + y * 3}deg`;
        }
      });
    });
  }

  const boot = () => {
    scan();
    parallax();
    const root = document.getElementById("tracewise-root") || document.body;
    new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
