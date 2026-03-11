const menuToggle = document.querySelector("#menu-toggle, .menu-toggle");
const menu = document.querySelector(".menu, .site-nav");
const menuLinks = document.querySelectorAll(".menu a, .site-nav a");

const body = document.body;

if (body) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loaderStartedAt = performance.now();

  body.classList.add("lord-loading");

  const loader = document.createElement("div");
  loader.className = "lord-loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = [
    '<div class="lord-loader__inner">',
    '<div class="lord-loader__ring"></div>',
    '<div class="lord-loader__logo">LORD</div>',
    '<div class="lord-loader__sub">Ивент-агентство</div>',
    "</div>",
  ].join("");
  body.append(loader);

  let loaderHidden = false;
  const hideLoader = () => {
    if (loaderHidden) return;
    loaderHidden = true;
    const minVisible = prefersReducedMotion ? 120 : 560;
    const elapsed = performance.now() - loaderStartedAt;
    const wait = Math.max(0, minVisible - elapsed);

    window.setTimeout(() => {
      loader.classList.add("is-hidden");
      body.classList.remove("lord-loading");
      window.setTimeout(() => loader.remove(), 470);
    }, wait);
  };

  const waitForWindowLoad = () =>
    new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      window.addEventListener("load", resolve, { once: true });
    });

  const waitForFonts = () => {
    const fontsApi = document.fonts;
    const fontsReady = fontsApi && fontsApi.ready;
    if (!fontsApi || !fontsReady || typeof fontsReady.then !== "function") {
      return Promise.resolve();
    }
    return fontsReady.catch(() => undefined);
  };

  const waitForCriticalImages = () => {
    const candidates = [...document.images].filter((img) => img.loading !== "lazy" || img.closest(".hero"));
    const pending = candidates.filter((img) => !img.complete);
    if (!pending.length) {
      return Promise.resolve();
    }

    return Promise.allSettled(
      pending.map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
      )
    ).then(() => undefined);
  };

  const minDelayPromise = new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? 120 : 680));
  const maxWaitPromise = new Promise((resolve) => window.setTimeout(resolve, 12000));

  Promise.race([
    Promise.all([waitForWindowLoad(), waitForFonts(), waitForCriticalImages(), minDelayPromise]),
    maxWaitPromise,
  ]).then(hideLoader);

  window.addEventListener(
    "pageshow",
    (event) => {
      if (event.persisted) {
        hideLoader();
      }
    },
    { once: true }
  );

  const isInternalPageLink = (link, url) => {
    const href = (link.getAttribute("href") || "").trim();
    if (!href || href.startsWith("#")) return false;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;
    if (link.hasAttribute("download")) return false;
    if (link.target && link.target.toLowerCase() === "_blank") return false;
    if (url.origin !== window.location.origin) return false;
    return `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    let url;
    try {
      url = new URL(link.getAttribute("href"), window.location.href);
    } catch {
      return;
    }

    if (!isInternalPageLink(link, url)) return;
    event.preventDefault();
    body.classList.add("page-leaving");
    window.setTimeout(() => {
      window.location.assign(url.href);
    }, 190);
  });

  const prefetched = new Set();
  const prefetchPage = (href) => {
    if (!href || prefetched.has(href)) return;
    prefetched.add(href);
    const node = document.createElement("link");
    node.rel = "prefetch";
    node.href = href;
    node.as = "document";
    document.head.append(node);
  };

  document.querySelectorAll("a[href]").forEach((link) => {
    let url;
    try {
      url = new URL(link.getAttribute("href"), window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (!/\/(index\.html)?$/i.test(url.pathname) && !/\.html$/i.test(url.pathname)) return;
    const preload = () => prefetchPage(url.href);
    link.addEventListener("mouseenter", preload, { once: true, passive: true });
    link.addEventListener("touchstart", preload, { once: true, passive: true });
  });
}

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  const firstFold = window.innerHeight * 0.98;
  revealItems.forEach((item, index) => {
    if (item.getBoundingClientRect().top < firstFold) {
      item.classList.add("is-visible");
      return;
    }
    item.style.transitionDelay = `${Math.min(index * 35, 350)}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const progress = document.querySelector("#scroll-progress");

const updateScrollProgress = () => {
  if (!progress) {
    return;
  }
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

const cursorGlow = document.querySelector("#cursor-glow");
const hasFinePointer = window.matchMedia("(pointer:fine)").matches;

if (cursorGlow && hasFinePointer) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  cursorGlow.style.opacity = "1";

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  const animateGlow = () => {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    cursorGlow.style.left = `${currentX}px`;
    cursorGlow.style.top = `${currentY}px`;
    window.requestAnimationFrame(animateGlow);
  };

  animateGlow();
}

const tiltCards = document.querySelectorAll(".tilt-card");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && hasFinePointer) {
  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 9;
      const rotateX = (0.5 - y) * 9;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}
