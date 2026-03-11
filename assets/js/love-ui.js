(() => {
  if (window.__lordLoveUiInitialized) {
    return;
  }
  window.__lordLoveUiInitialized = true;

  const supportsMatchMedia = typeof window.matchMedia === "function";
  const hasFinePointer = supportsMatchMedia ? window.matchMedia("(pointer:fine)").matches : false;
  const prefersReducedMotion = supportsMatchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const progress = document.querySelector("#scroll-progress");
  if (progress) {
    const updateScrollProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const current = Math.max(0, window.scrollY);
      const percent = maxScroll > 0 ? (current / maxScroll) * 100 : 0;
      progress.style.width = `${Math.min(percent, 100)}%`;
    };

    updateScrollProgress();
    const scheduleScrollProgress = (() => {
      let frame = 0;
      return () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          updateScrollProgress();
        });
      };
    })();

    window.addEventListener("scroll", scheduleScrollProgress, { passive: true });
    window.addEventListener("resize", scheduleScrollProgress);
  }

  const cursorGlow = document.querySelector("#cursor-glow");
  if (cursorGlow && hasFinePointer && !prefersReducedMotion) {
    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let currentX = targetX;
    let currentY = targetY;

    cursorGlow.style.opacity = "1";

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
      },
      { passive: true }
    );

    const animateGlow = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      cursorGlow.style.left = `${currentX.toFixed(2)}px`;
      cursorGlow.style.top = `${currentY.toFixed(2)}px`;
      window.requestAnimationFrame(animateGlow);
    };

    animateGlow();
  } else if (cursorGlow) {
    cursorGlow.style.opacity = "0";
  }

  if (prefersReducedMotion || !hasFinePointer) {
    return;
  }

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 9;
      const rotateX = (0.5 - y) * 9;
      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
})();
