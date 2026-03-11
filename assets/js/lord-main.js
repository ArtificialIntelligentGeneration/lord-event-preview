(() => {
  const body = document.body;
  if (!body) return;

  body.classList.add("lord-royal-v4");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 959px)").matches;
  const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
  const hasFinePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  const USE_LEGACY_METRICS = true;
  const USE_LEGACY_MARQUEE = true;
  const loaderStartedAt = performance.now();
  const DEEP_BLUE_BG = "#08215e";
  const HERO_RECORD_SELECTOR = "#rec1821410193";
  const BG_LOCK_SELECTOR =
    ".t396__artboard, .t396__carrier, .t396__filter, .t-cover, .t-cover__carrier, .t-cover__filter";

  const parsePx = (value) => {
    const parsed = Number.parseFloat(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const breakpointKey = () => {
    if (window.innerWidth <= 479) return "320";
    if (window.innerWidth <= 639) return "480";
    if (window.innerWidth <= 959) return "640";
    if (window.innerWidth <= 1199) return "960";
    return "1200";
  };

  const getConfiguredValue = (el, prop, bpKey, fallback = 0) => {
    const keysByBp = {
      "320": [
        `data-field-${prop}-res-320-value`,
        `data-field-${prop}-res-480-value`,
        `data-field-${prop}-res-640-value`,
        `data-field-${prop}-res-960-value`,
        `data-field-${prop}-res-1200-value`,
        `data-field-${prop}-value`,
      ],
      "480": [
        `data-field-${prop}-res-480-value`,
        `data-field-${prop}-res-640-value`,
        `data-field-${prop}-res-960-value`,
        `data-field-${prop}-res-1200-value`,
        `data-field-${prop}-value`,
      ],
      "640": [
        `data-field-${prop}-res-640-value`,
        `data-field-${prop}-res-960-value`,
        `data-field-${prop}-res-1200-value`,
        `data-field-${prop}-value`,
      ],
      "960": [
        `data-field-${prop}-res-960-value`,
        `data-field-${prop}-res-1200-value`,
        `data-field-${prop}-value`,
      ],
      "1200": [`data-field-${prop}-res-1200-value`, `data-field-${prop}-value`],
    };

    const keys = keysByBp[bpKey] || keysByBp["1200"];
    for (const key of keys) {
      const value = el.getAttribute(key);
      const parsed = parsePx(value);
      if (Number.isFinite(parsed) && parsed !== 0) return parsed;
      if (value === "0") return 0;
    }

    return fallback;
  };

  body.classList.add("lord-loading");

  const loader = document.createElement("div");
  loader.className = "lord-loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = [
    '<div class="lord-loader__inner">',
    '<div class="lord-loader__ring"></div>',
    '<div class="lord-loader__text">LORD</div>',
    '<div class="lord-loader__subtext">Ивент-агентство</div>',
    "</div>",
  ].join("");
  body.append(loader);

  let loaderHidden = false;
  const hideLoader = () => {
    if (loaderHidden) return;
    loaderHidden = true;

    const minVisible = prefersReducedMotion ? 120 : 580;
    const elapsed = performance.now() - loaderStartedAt;
    const wait = Math.max(0, minVisible - elapsed);

    window.setTimeout(() => {
      loader.classList.add("is-hidden");
      body.classList.remove("lord-loading");
      window.dispatchEvent(new CustomEvent("lord:loader-hidden"));
      window.setTimeout(() => loader.remove(), 460);
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
    if (!document.fonts || !document.fonts.ready || typeof document.fonts.ready.then !== "function") {
      return Promise.resolve();
    }
    return document.fonts.ready.catch(() => undefined);
  };

  const lockBackgroundNode = (node) => {
    if (!(node instanceof Element)) return;
    if (node.closest(HERO_RECORD_SELECTOR)) return;

    if (node.matches("[id^='rec']")) {
      node.style.setProperty("background-image", "none", "important");
      node.style.setProperty("background-color", DEEP_BLUE_BG, "important");
      node.style.setProperty("transition", "none", "important");
      return;
    }

    if (!node.matches(BG_LOCK_SELECTOR) && !node.classList.contains("t-bgimg")) return;

    node.style.setProperty("background-image", "none", "important");
    node.style.setProperty("background-color", DEEP_BLUE_BG, "important");
    node.style.setProperty("background-attachment", "scroll", "important");
    node.style.setProperty("transition", "none", "important");
    node.removeAttribute("data-original");
    node.removeAttribute("data-content-cover-bg");
    node.removeAttribute("data-content-cover-parallax");
    node.removeAttribute("data-content-use-image-for-mobile-cover");
    if (node.classList.contains("t-bgimg")) {
      node.setAttribute("data-lazy-rule", "skip");
      node.classList.add("t-bgimg_loaded");
    }
  };

  const lockAllNonHeroBackgrounds = () => {
    document.querySelectorAll(`#allrecords [id^='rec']:not(${HERO_RECORD_SELECTOR})`).forEach((record) => {
      lockBackgroundNode(record);
      record.querySelectorAll(BG_LOCK_SELECTOR).forEach(lockBackgroundNode);
      record.querySelectorAll(".t-bgimg, [data-content-cover-bg], [data-original]").forEach(lockBackgroundNode);
    });

    const coverRecord = document.querySelector("#rec1849650653");
    if (coverRecord) {
      lockBackgroundNode(coverRecord);
      coverRecord.querySelectorAll(BG_LOCK_SELECTOR).forEach(lockBackgroundNode);
    }
  };

  const initBackgroundLockObserver = () => {
    const root = document.querySelector("#allrecords");
    if (!root || root.dataset.lordBackgroundLockReady === "1") return;
    root.dataset.lordBackgroundLockReady = "1";

    lockAllNonHeroBackgrounds();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          const target = mutation.target;
          if (!(target instanceof Element)) continue;

          if (target.closest(HERO_RECORD_SELECTOR)) continue;
          if (
            target.matches("[id^='rec']") ||
            target.matches(BG_LOCK_SELECTOR) ||
            target.classList.contains("t-bgimg") ||
            target.hasAttribute("data-content-cover-bg")
          ) {
            lockBackgroundNode(target);
          }

          if (target.matches("[id^='rec']")) {
            target.querySelectorAll(BG_LOCK_SELECTOR).forEach(lockBackgroundNode);
          }
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.closest(HERO_RECORD_SELECTOR)) return;

          if (node.matches("[id^='rec']")) {
            lockBackgroundNode(node);
            node.querySelectorAll(BG_LOCK_SELECTOR).forEach(lockBackgroundNode);
            node.querySelectorAll(".t-bgimg, [data-content-cover-bg], [data-original]").forEach(lockBackgroundNode);
            return;
          }

          lockBackgroundNode(node);
          node.querySelectorAll(BG_LOCK_SELECTOR).forEach(lockBackgroundNode);
          node.querySelectorAll(".t-bgimg, [data-content-cover-bg], [data-original]").forEach(lockBackgroundNode);
        });
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "style",
        "data-original",
        "data-content-cover-bg",
        "data-content-cover-parallax",
        "data-display-changed",
      ],
    });
  };

  const disableShapeRevealAnimations = () => {
    const animatedShapeSelector = `#allrecords [id^='rec']:not(${HERO_RECORD_SELECTOR}) .tn-elem[data-elem-type='shape']`;
    document.querySelectorAll(animatedShapeSelector).forEach((node) => {
      node.classList.remove("t-animate", "t396__elem--anim-hidden");
      node.style.opacity = "1";
      [
        "data-animate-style",
        "data-animate-duration",
        "data-animate-delay",
        "data-animate-distance",
        "data-animate-mobile",
        "data-animate-sbs-event",
        "data-animate-sbs-trg",
        "data-animate-sbs-trgofst",
        "data-animate-sbs-loop",
        "data-animate-sbs-opts",
        "data-animate-sbs-opts-res-320",
        "data-animate-sbs-opts-res-480",
        "data-animate-sbs-opts-res-640",
        "data-animate-sbs-opts-res-960",
      ].forEach((attr) => node.removeAttribute(attr));
    });
  };

  const disableRevealAnimationsForMoodBlock = () => {
    const block = document.querySelector("#rec1849664253");
    if (!block) return;

    const attrNames = [
      "data-animate-style",
      "data-animate-duration",
      "data-animate-delay",
      "data-animate-distance",
      "data-animate-mobile",
      "data-animate-order",
      "data-animate-group",
      "data-animate-sbs-event",
      "data-animate-sbs-trg",
      "data-animate-sbs-trgofst",
      "data-animate-sbs-loop",
      "data-animate-sbs-opts",
      "data-animate-sbs-opts-res-320",
      "data-animate-sbs-opts-res-480",
      "data-animate-sbs-opts-res-640",
      "data-animate-sbs-opts-res-960",
    ];

    block.querySelectorAll(".t-animate, .tn-elem.t396__elem--anim-hidden").forEach((node) => {
      node.classList.remove("t-animate", "t396__elem--anim-hidden");
      attrNames.forEach((attr) => node.removeAttribute(attr));
      node.style.opacity = "1";
      node.style.transform = "none";
      node.style.transition = "none";
      node.style.animation = "none";
      node.style.visibility = "visible";
    });

    block.style.opacity = "1";
    block.style.visibility = "visible";
    block.style.transform = "none";
    block.style.transition = "none";
    block.setAttribute("data-animationappear", "off");
  };

  const disableRevealAnimationsForMarqueeBlock = () => {
    const block = document.querySelector("#rec1841731213");
    if (!block) return;

    const attrNames = [
      "data-animate-style",
      "data-animate-duration",
      "data-animate-delay",
      "data-animate-distance",
      "data-animate-mobile",
      "data-animate-order",
      "data-animate-group",
      "data-animate-scale",
      "data-animate-sbs-event",
      "data-animate-sbs-trg",
      "data-animate-sbs-trgofst",
      "data-animate-sbs-loop",
      "data-animate-sbs-opts",
      "data-animate-sbs-opts-res-320",
      "data-animate-sbs-opts-res-480",
      "data-animate-sbs-opts-res-640",
      "data-animate-sbs-opts-res-960",
    ];

    block
      .querySelectorAll(
        ".t-animate, .tn-elem.t396__elem--anim-hidden, .tn-elem[data-elem-type='text'], .tn-elem[data-elem-type='shape']"
      )
      .forEach((node) => {
        node.classList.remove("t-animate", "t396__elem--anim-hidden");
        attrNames.forEach((attr) => node.removeAttribute(attr));
        node.style.opacity = "1";
        node.style.transform = "none";
        node.style.transition = "none";
        node.style.animation = "none";
        node.style.visibility = "visible";
      });

    block.style.opacity = "1";
    block.style.visibility = "visible";
    block.style.transform = "none";
    block.style.transition = "none";
    block.setAttribute("data-animationappear", "off");
  };

  const hydrateLazyBackgrounds = () => {
    document.querySelectorAll(".t-bgimg[data-original]").forEach((node) => {
      const source = (node.getAttribute("data-original") || "").trim();
      if (!source) return;
      node.style.backgroundImage = `url("${source}")`;
      node.style.backgroundColor = DEEP_BLUE_BG;
      node.style.backgroundAttachment = "scroll";
      node.setAttribute("data-lazy-rule", "skip");
      node.classList.add("t-bgimg_loaded");
      node.removeAttribute("data-original");
    });

    document.querySelectorAll("[data-content-cover-bg]").forEach((node) => {
      node.removeAttribute("data-content-cover-bg");
      node.removeAttribute("data-content-cover-parallax");
      node.style.backgroundImage = "none";
      node.style.backgroundAttachment = "scroll";
      node.style.backgroundColor = DEEP_BLUE_BG;
    });

    document.querySelectorAll("img[data-original]").forEach((img) => {
      const source = (img.getAttribute("data-original") || "").trim();
      if (!source) return;
      if (!img.getAttribute("src")) {
        img.setAttribute("src", source);
      }
      img.setAttribute("loading", "eager");
      img.decoding = "async";
      img.removeAttribute("data-original");
    });

    const problematicCover = document.querySelector("#coverCarry1849650653");
    if (problematicCover) {
      problematicCover.removeAttribute("data-content-cover-bg");
      problematicCover.removeAttribute("data-content-cover-parallax");
      problematicCover.style.backgroundImage = "none";
      problematicCover.style.backgroundAttachment = "scroll";
      problematicCover.style.backgroundColor = DEEP_BLUE_BG;
    }
  };

  const waitForCriticalImages = () => {
    const eager = [...document.images];
    const pending = [];
    const preloadUrls = new Set();

    eager.forEach((img) => {
      const original = (img.getAttribute("data-original") || "").trim();
      if (!img.getAttribute("src") && original) {
        img.setAttribute("src", original);
      }

      img.loading = "eager";
      img.decoding = "async";

      const src = (img.currentSrc || img.getAttribute("src") || original || "").trim();
      if (src && !src.startsWith("data:")) {
        preloadUrls.add(src);
      }

      if (!img.complete) {
        pending.push(
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
        );
      }
    });

    const warmups = [...preloadUrls].map(
      (src) =>
        new Promise((resolve) => {
          const probe = new Image();
          probe.decoding = "async";
          probe.onload = resolve;
          probe.onerror = resolve;
          probe.src = src;
        })
    );

    if (!pending.length && !warmups.length) return Promise.resolve();
    return Promise.allSettled([...pending, ...warmups]).then(() => undefined);
  };

  const waitForBackgroundImages = () => {
    const urls = new Set();

    const collectUrls = (raw) => {
      if (!raw || !raw.includes("url(")) return;
      const matches = raw.matchAll(/url\((['"]?)(.*?)\1\)/g);
      for (const match of matches) {
        const value = (match[2] || "").trim();
        if (!value || value.startsWith("data:")) continue;
        try {
          urls.add(new URL(value, window.location.href).href);
        } catch (error) {
          urls.add(value);
        }
      }
    };

    document.querySelectorAll("[style*='background-image']").forEach((node) => {
      collectUrls(node.getAttribute("style") || "");
    });

    document.querySelectorAll("[data-original]").forEach((node) => {
      const source = (node.getAttribute("data-original") || "").trim();
      if (!source || source.startsWith("data:")) return;
      try {
        urls.add(new URL(source, window.location.href).href);
      } catch (error) {
        urls.add(source);
      }
    });

    const queue = [...urls];
    if (!queue.length) return Promise.resolve();

    return Promise.allSettled(
      queue.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          })
      )
    ).then(() => undefined);
  };

  const waitForTildaRecords = () =>
    new Promise((resolve) => {
      const records = document.querySelector(".t-records");
      if (!records || records.classList.contains("t-records_visible")) {
        resolve();
        return;
      }

      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        observer.disconnect();
        window.clearTimeout(timeout);
        resolve();
      };

      const observer = new MutationObserver(() => {
        if (records.classList.contains("t-records_visible")) finish();
      });

      observer.observe(records, { attributes: true, attributeFilter: ["class"] });
      const timeout = window.setTimeout(finish, 2800);
    });

  hydrateLazyBackgrounds();
  lockAllNonHeroBackgrounds();
  initBackgroundLockObserver();
  disableShapeRevealAnimations();

  Promise.race([
    Promise.all([
      waitForWindowLoad(),
      waitForFonts(),
      waitForCriticalImages(),
      waitForBackgroundImages(),
      waitForTildaRecords(),
      new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion ? 120 : 760)),
    ]),
    new Promise((resolve) => window.setTimeout(resolve, 28000)),
  ]).then(hideLoader);

  window.addEventListener(
    "pageshow",
    (event) => {
      if (event.persisted) hideLoader();
    },
    { once: true }
  );

  if (isMobile || lowCpu || prefersReducedMotion) {
    document.documentElement.classList.add("lord-low-motion");
    document.querySelectorAll("[data-animate-sbs-loop]").forEach((el) => {
      el.removeAttribute("data-animate-sbs-loop");
    });
  }

  const normalizeAnimationDurations = () => {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".t-animate").forEach((el) => {
      const duration = Number.parseFloat(el.getAttribute("data-animate-duration") || "");
      const distance = Number.parseFloat(el.getAttribute("data-animate-distance") || "");
      const delay = Number.parseFloat(el.getAttribute("data-animate-delay") || "");

      if (Number.isFinite(duration) && duration > 0) {
        el.setAttribute("data-animate-duration", Math.min(Math.max(duration * 0.84, 0.8), 2.8).toFixed(2));
      }

      if (Number.isFinite(distance) && distance > 0) {
        el.setAttribute("data-animate-distance", String(Math.round(Math.min(Math.max(distance * 0.8, 10), 90))));
      }

      if (Number.isFinite(delay) && delay > 0) {
        el.setAttribute("data-animate-delay", Math.max(delay * 0.75, 0.03).toFixed(2));
      }
    });
  };

  const initHeroWordmark = () => {
    const heroTitle = document.querySelector('#rec1821410193 .tn-elem[data-elem-id="1638185185529"] .tn-atom');
    if (!heroTitle) return;

    const source = (heroTitle.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/heroes?\s*band/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!source) return;

    heroTitle.innerHTML = [
      '<span class="lord-hero-subbrand">Ивент-агентство</span>',
      '<span class="lord-hero-wordmark">LORD</span>',
    ].join("");
    heroTitle.dataset.lordHeroWordmarkReady = "1";
  };

  const initTrustMetricsGrid = () => {
    if (USE_LEGACY_METRICS) return;
    const record = document.querySelector("#rec1821410213");
    const artboard = record?.querySelector(".t396__artboard");
    if (!record || !artboard) return;

    const metrics = [
      { value: "0", label: "Стресса и суеты." },
      { value: "1000%", label: "Креативный доход." },
      { value: "100%", label: "Вовлеченность в каждый проект." },
      { value: "24/7", label: "Поддержка команды без пауз." },
      { value: "PRO", label: "Проверенные подрядчики и контроль качества." },
      { value: "1:1", label: "Персональный продюсер под вашу задачу." },
    ];

    const existing = artboard.querySelector(".lord-trust-grid");
    if (existing) {
      record.classList.add("lord-trust-grid-ready");
      return;
    }

    const grid = document.createElement("section");
    grid.className = "lord-trust-grid";
    grid.setAttribute("aria-label", "Ключевые параметры LORD");

    metrics.forEach((metric) => {
      const card = document.createElement("article");
      card.className = "lord-trust-grid__card";

      const value = document.createElement("div");
      value.className = "lord-trust-grid__value";
      value.textContent = metric.value;

      const label = document.createElement("div");
      label.className = "lord-trust-grid__label";
      label.textContent = metric.label;

      card.append(value, label);
      grid.append(card);
    });

    artboard.append(grid);
    record.classList.add("lord-trust-grid-ready");
  };

  const initSeamlessMarquees = () => {
    if (USE_LEGACY_MARQUEE) return;
    const marqueeRecord = document.querySelector("#rec1841731213");
    const artboard = marqueeRecord?.querySelector(".t396__artboard");
    if (!artboard || !marqueeRecord) return;

    const existingMarquees = artboard.querySelector(".lord-marquees");
    if (existingMarquees) existingMarquees.remove();

    artboard.querySelectorAll(".tn-elem[data-elem-type='text']").forEach((el) => {
      el.classList.add("lord-marquee-source");
      el.classList.remove("t-animate", "t396__elem--anim-hidden");
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.transition = "none";
      el.style.animation = "none";
      el.removeAttribute("data-animate-sbs-loop");
      el.removeAttribute("data-animate-sbs-opts");
      el.removeAttribute("data-animate-sbs-opts-res-320");
      el.removeAttribute("data-animate-sbs-opts-res-480");
      el.removeAttribute("data-animate-sbs-opts-res-640");
      el.removeAttribute("data-animate-sbs-opts-res-960");
      el.removeAttribute("data-animate-style");
      el.removeAttribute("data-animate-duration");
      el.removeAttribute("data-animate-delay");
      el.removeAttribute("data-animate-distance");
      el.removeAttribute("data-animate-mobile");
    });

    const buildTrack = (word, speedClass) => {
      const row = document.createElement("div");
      row.className = `lord-marquee-row ${speedClass}`;

      const track = document.createElement("div");
      track.className = "lord-marquee-track lord-marquee-track--right";

      const createGroup = () => {
        const group = document.createElement("div");
        group.className = "lord-marquee-group";
        for (let i = 0; i < 12; i += 1) {
          const token = document.createElement("span");
          token.className = "lord-marquee-word";
          token.textContent = word;
          group.append(token);
        }
        return group;
      };

      track.append(createGroup(), createGroup());
      row.append(track);
      return row;
    };

    const wrapper = document.createElement("div");
    wrapper.className = "lord-marquees lord-marquees--narrow";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.append(
      buildTrack("Счастье", "is-fast"),
      buildTrack("Любовь", "is-medium"),
      buildTrack("Радость", "is-slow")
    );

    artboard.append(wrapper);
    marqueeRecord.classList.add("lord-marquee-ready");
  };

  const setRuntimeTextureVars = () => {
    const root = document.documentElement;
    // Keep section backgrounds stable: no runtime photo textures after page load.
    root.style.setProperty("--lord-photo-tex-1", "none");
    root.style.setProperty("--lord-photo-tex-2", "none");
    root.style.setProperty("--lord-photo-tex-3", "none");
  };

  const initRoyalParticles = () => {
    if (prefersReducedMotion || lowCpu) return;

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                entry.target.dataset.particlesActive = entry.isIntersecting ? "1" : "0";
              });
            },
            { threshold: 0.08 }
          )
        : null;

    const targets = [
      { selector: "#rec1821410193 .t396__artboard", count: 10 },
      { selector: "#rec1821410313 .t396__artboard", count: 8 },
      { selector: "#rec1821410373 .t396__artboard", count: 7 },
    ];

    targets.forEach((target) => {
      const artboard = document.querySelector(target.selector);
      if (!artboard || artboard.dataset.lordParticlesReady === "1") return;
      artboard.dataset.lordParticlesReady = "1";

      if (window.getComputedStyle(artboard).position === "static") {
        artboard.style.position = "relative";
      }

      const layer = document.createElement("div");
      layer.className = "lord-royal-particles";
      layer.setAttribute("aria-hidden", "true");

      const count = isMobile ? Math.max(4, Math.round(target.count * 0.6)) : target.count;
      for (let i = 0; i < count; i += 1) {
        const dot = document.createElement("span");
        dot.style.setProperty("--x", `${Math.random() * 100}%`);
        dot.style.setProperty("--y", `${Math.random() * 100}%`);
        dot.style.setProperty("--size", `${Math.round(4 + Math.random() * 9)}px`);
        dot.style.setProperty("--dur", `${(8 + Math.random() * 7).toFixed(2)}s`);
        dot.style.setProperty("--delay", `${(-Math.random() * 7).toFixed(2)}s`);
        dot.style.setProperty("--blur", `${(0.4 + Math.random() * 1.4).toFixed(2)}px`);
        dot.style.setProperty("--op", `${(0.2 + Math.random() * 0.42).toFixed(2)}`);
        layer.append(dot);
      }

      artboard.append(layer);
      if (observer) {
        observer.observe(artboard);
      } else {
        artboard.dataset.particlesActive = "1";
      }
    });
  };

  const initRoyalCursor = () => {
    if (!hasFinePointer || isMobile || prefersReducedMotion || lowCpu) {
      document.documentElement.classList.add("lord-cursor-disabled");
      return;
    }
    if (body.dataset.lordCursorReady === "1") return;
    body.dataset.lordCursorReady = "1";
    body.classList.add("lord-cursor-mode");

    const glow = document.createElement("div");
    glow.className = "lord-cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    body.append(glow);

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.5;
    let glowX = targetX;
    let glowY = targetY;
    let visible = false;

    const tick = () => {
      glowX += (targetX - glowX) * 0.2;
      glowY += (targetY - glowY) * 0.2;

      const opacity = visible ? 1 : 0;
      glow.style.opacity = String(opacity);
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;

      window.requestAnimationFrame(tick);
    };

    const interactiveSelector =
      "a[href], button, [role='button'], .t-btn, .tn-atom[href], .tn-atom__button-content, .lord-team-tab, .lord-team-card__toggle";

    document.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        visible = true;
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => {
      visible = false;
      body.classList.remove("lord-cursor-hover");
    });

    document.addEventListener(
      "pointerover",
      (event) => {
        const interactive = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
        body.classList.toggle("lord-cursor-hover", Boolean(interactive));
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerdown",
      () => {
        body.classList.add("lord-cursor-pressed");
      },
      { passive: true }
    );
    document.addEventListener(
      "pointerup",
      () => {
        body.classList.remove("lord-cursor-pressed");
      },
      { passive: true }
    );

    window.requestAnimationFrame(tick);
  };

  const initScrollProgressBar = () => {
    if (body.dataset.lordScrollProgressReady === "1") return;
    body.dataset.lordScrollProgressReady = "1";

    const root = document.createElement("div");
    root.className = "lord-scroll-progress";
    root.setAttribute("aria-hidden", "true");

    const fill = document.createElement("div");
    fill.className = "lord-scroll-progress__fill";
    root.append(fill);
    body.append(root);

    let ticking = false;
    const render = () => {
      ticking = false;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      fill.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    const requestRender = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    };

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    requestRender();
  };

  const initRoyalOrnaments = () => {
    const staticMode = prefersReducedMotion;

    const targets = [
      "#rec1821410193 .t396__artboard",
      "#rec1821410213 .t396__artboard",
      "#rec1821410313 .t396__artboard",
      "#rec1821410343",
      "#rec1821410373 .t396__artboard",
      "#rec1821410433 .t396__artboard",
    ];

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                entry.target.dataset.ornamentsActive = entry.isIntersecting ? "1" : "0";
              });
            },
            { threshold: 0.08 }
          )
        : null;

    targets.forEach((selector, sectionIndex) => {
      const node = document.querySelector(selector);
      if (!node || node.dataset.lordOrnamentsReady === "1") return;
      node.dataset.lordOrnamentsReady = "1";
      node.classList.add("lord-ornaments-host");

      if (window.getComputedStyle(node).position === "static") {
        node.style.position = "relative";
      }

      const layer = document.createElement("div");
      layer.className = "lord-royal-ornaments";
      layer.setAttribute("aria-hidden", "true");

    const baseCount = staticMode ? (isMobile ? 3 : 4) : lowCpu ? 4 : isMobile ? 6 : 9;
      const types = [
        "crown",
        "diamond",
        "fleur",
        "coin",
        "crown-emoji",
        "diamond-emoji",
        "gold-emoji",
        "fleur-symbol",
        "spark",
      ];
      for (let i = 0; i < baseCount; i += 1) {
        const ornament = document.createElement("span");
        const type = types[(i + sectionIndex) % types.length];
        ornament.className = `lord-ornament lord-ornament--${type}`;
        if (type === "crown-emoji") ornament.textContent = "👑";
        if (type === "diamond-emoji") ornament.textContent = "💎";
        if (type === "gold-emoji") ornament.textContent = "🪙";
        if (type === "fleur-symbol") ornament.textContent = "⚜";
        ornament.style.setProperty("--x", `${10 + Math.random() * 80}%`);
        ornament.style.setProperty("--y", `${8 + Math.random() * 84}%`);
        const size =
          type.includes("emoji") || type === "fleur-symbol"
            ? Math.round(16 + Math.random() * 14)
            : type === "spark"
            ? Math.round(10 + Math.random() * 8)
            : Math.round(14 + Math.random() * 14);
        ornament.style.setProperty("--size", `${size}px`);
        ornament.style.setProperty("--delay", staticMode ? "0s" : `${(-Math.random() * 5).toFixed(2)}s`);
        ornament.style.setProperty("--dur", staticMode ? "0s" : `${(6.5 + Math.random() * 4.5).toFixed(2)}s`);
        ornament.style.setProperty("--drift", `${(-8 + Math.random() * 16).toFixed(2)}px`);
        ornament.style.setProperty("--sway", `${(-6 + Math.random() * 12).toFixed(2)}px`);
        ornament.style.setProperty("--tilt", `${(-12 + Math.random() * 24).toFixed(2)}deg`);
        ornament.style.setProperty("--op", staticMode ? "0.24" : `${(0.14 + Math.random() * 0.2).toFixed(2)}`);
        layer.append(ornament);
      }

      node.append(layer);
      if (observer) {
        observer.observe(node);
      } else {
        node.dataset.ornamentsActive = "1";
      }
    });
  };

  const initRoyalParallaxDrift = () => {
    if (prefersReducedMotion || lowCpu) return;
    if (body.dataset.lordParallaxReady === "1") return;
    body.dataset.lordParallaxReady = "1";

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const layers = () => [...document.querySelectorAll(".lord-royal-ornaments, .lord-royal-particles")];

    const frame = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      layers().forEach((layer) => {
        const host = layer.parentElement;
        const isPaused =
          host?.dataset.ornamentsActive === "0" ||
          host?.dataset.particlesActive === "0";
        if (isPaused) return;

        const intensity = layer.classList.contains("lord-royal-particles") ? 6 : 11;
        layer.style.transform = `translate3d(${(currentX * intensity).toFixed(2)}px, ${(currentY * intensity).toFixed(
          2
        )}px, 0)`;
      });

      window.requestAnimationFrame(frame);
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        const nx = event.clientX / Math.max(1, window.innerWidth) - 0.5;
        const ny = event.clientY / Math.max(1, window.innerHeight) - 0.5;
        targetX = nx;
        targetY = ny;
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerleave",
      () => {
        targetX = 0;
        targetY = 0;
      },
      { passive: true }
    );

    window.requestAnimationFrame(frame);
  };

  const placePartnersHeadingBeforeSlider = () => {
    if (body.classList.contains("lord-team-catalog-mode")) return;
    const partnersRecord = document.querySelector("#rec1821410383");
    const peopleSliderRecord = document.querySelector("#rec1821410343");
    if (!partnersRecord || !peopleSliderRecord) return;
    if (peopleSliderRecord.previousElementSibling === partnersRecord) return;
    peopleSliderRecord.parentNode?.insertBefore(partnersRecord, peopleSliderRecord);
  };

  const classifyTeamCategory = (role) => {
    const value = (role || "").toLowerCase();
    if (/ведущ/.test(value)) return "hosts";
    if (/музык|диджей|dj|сакс|гитар|вокал|бэнд|band/.test(value)) return "musicians";
    if (/организ|координ|продюсер|менеджер/.test(value)) return "organizers";
    return "organizers";
  };

  const extractBgUrl = (value) => {
    if (!value || value === "none") return "";
    const match = value.match(/url\((['"]?)(.*?)\1\)/i);
    return match && match[2] ? match[2].trim() : "";
  };

  const toCleanText = (value) => (value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  const summarizeText = (text, max = 128) => {
    const plain = toCleanText(text);
    if (!plain) return "";
    if (plain.length <= max) return plain;
    return `${plain.slice(0, max).trimEnd()}...`;
  };

  const initTeamCatalog = () => {
    const record = document.querySelector("#rec1821410343");
    if (!record) return;

    const slider = record.querySelector(".t728");
    if (!slider) return;

    const existingCatalog = record.querySelector(".lord-team-catalog");
    if (existingCatalog) {
      body.classList.add("lord-team-catalog-mode");
      record.classList.add("lord-team-catalog-ready");
      return;
    }

    const normalizeMemberName = (value) =>
      toCleanText(value)
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s-]/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    const fixedTeamPhotos = new Map(
      [
        ["Тимофей Сердюков", "./assets/lord/team/timofey-serdyukov.jpg"],
        ["Антон Симонов", "./assets/lord/team/anton.jpg"],
        ["Иван Моисеенко", "./assets/lord/team/ivan-moiseenko.jpg"],
        ["Иван Моесеенко", "./assets/lord/team/ivan-moiseenko.jpg"],
        ["Роман Петренко", "./assets/lord/team/roman-petrenko.jpeg"],
      ].map(([name, src]) => [normalizeMemberName(name), src])
    );

    const membersRaw = [...record.querySelectorAll(".t-slds__item")]
      .map((item, index) => {
        const name = toCleanText(item.querySelector(".t728__text")?.textContent || "");
        const role = toCleanText(item.querySelector(".t728__title")?.textContent || "");
        const desc = toCleanText(item.querySelector(".t728__descr")?.textContent || "");
        const bg = item.querySelector(".t728__bgimg");
        const fallbackImage =
          (bg?.getAttribute("data-original") || "").trim() ||
          extractBgUrl(bg?.style?.backgroundImage || "") ||
          extractBgUrl(window.getComputedStyle(bg || document.body).backgroundImage || "");
        const image = fixedTeamPhotos.get(normalizeMemberName(name)) || fallbackImage;

        if (!name) return null;
        return {
          id: `member-${index + 1}`,
          name,
          role: role || "Команда LORD",
          desc: desc || "Подробности скоро появятся.",
          image,
          category: classifyTeamCategory(role),
        };
      })
      .filter(Boolean);

    const seen = new Set();
    const members = membersRaw.filter((member) => {
      const key = normalizeMemberName(member.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!members.length) return;

    const tabs = [
      { id: "all", label: "Все" },
      { id: "hosts", label: "Ведущие" },
      { id: "musicians", label: "Музыканты" },
      { id: "organizers", label: "Организаторы" },
      { id: "partners", label: "Партнёры" },
    ];

    const catalog = document.createElement("section");
    catalog.className = "lord-team-catalog";
    catalog.setAttribute("aria-label", "Каталог команды LORD");
    catalog.classList.add("is-collapsed");

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "lord-team-catalog__toggle";
    toggle.textContent = "Открыть каталог команды";
    toggle.setAttribute("aria-expanded", "false");

    const tabsBar = document.createElement("div");
    tabsBar.className = "lord-team-catalog__tabs";
    tabsBar.setAttribute("role", "tablist");

    const panel = document.createElement("div");
    panel.className = "lord-team-catalog__panel";

    const closeCard = (card) => {
      if (!card) return;
      const details = card.querySelector(".lord-team-card__details");
      const toggle = card.querySelector(".lord-team-card__toggle");
      card.classList.remove("is-open");
      if (details) details.style.maxHeight = "0px";
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Подробнее";
      }
    };

    const openCard = (card) => {
      if (!card) return;
      const details = card.querySelector(".lord-team-card__details");
      const toggle = card.querySelector(".lord-team-card__toggle");
      card.classList.add("is-open");
      if (details) {
        details.style.maxHeight = `${Math.ceil(details.scrollHeight)}px`;
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "Свернуть";
      }
    };

    const createMemberCard = (member) => {
      const card = document.createElement("article");
      card.className = "lord-team-card";
      card.dataset.category = member.category;
      card.dataset.memberId = member.id;

      const media = document.createElement("div");
      media.className = "lord-team-card__media";

      const image = document.createElement("div");
      image.className = "lord-team-card__image";
      if (member.image) {
        const photo = document.createElement("img");
        photo.src = member.image;
        photo.alt = member.name;
        photo.loading = "eager";
        photo.decoding = "async";
        photo.referrerPolicy = "no-referrer";
        image.append(photo);
      }
      media.append(image);

      const content = document.createElement("div");
      content.className = "lord-team-card__content";

      const name = document.createElement("h3");
      name.className = "lord-team-card__name";
      name.textContent = member.name;

      const role = document.createElement("p");
      role.className = "lord-team-card__role";
      role.textContent = member.role;

      const summary = document.createElement("p");
      summary.className = "lord-team-card__summary";
      summary.textContent = summarizeText(member.desc);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "lord-team-card__toggle";
      toggle.textContent = "Подробнее";
      toggle.setAttribute("aria-expanded", "false");

      const details = document.createElement("div");
      details.className = "lord-team-card__details";
      details.textContent = member.desc;
      details.style.maxHeight = "0px";

      content.append(name, role, summary, toggle, details);
      card.append(media, content);
      return card;
    };

    const renderPanel = (tabId) => {
      panel.innerHTML = "";

      if (tabId === "partners") {
        const placeholder = document.createElement("article");
        placeholder.className = "lord-team-placeholder";
        placeholder.innerHTML = [
          '<h3 class="lord-team-placeholder__title">Партнёрский каталог пополняется</h3>',
          '<p class="lord-team-placeholder__text">Мы добавляем актуальных партнёров и формируем полный список. Пока можно сразу связаться с нами для подбора команды под задачу.</p>',
          '<a class="lord-team-placeholder__cta" href="#rec1849650653">Связаться</a>',
        ].join("");
        panel.append(placeholder);
        return;
      }

      const filtered = tabId === "all" ? members : members.filter((member) => member.category === tabId);
      if (!filtered.length) {
        const empty = document.createElement("div");
        empty.className = "lord-team-empty";
        empty.textContent = "В этой категории участники скоро появятся.";
        panel.append(empty);
        return;
      }

      const grid = document.createElement("div");
      grid.className = "lord-team-grid";

      filtered.forEach((member) => {
        grid.append(createMemberCard(member));
      });

      grid.addEventListener("click", (event) => {
        const toggle = event.target.closest(".lord-team-card__toggle");
        if (!toggle) return;

        const card = toggle.closest(".lord-team-card");
        if (!card) return;

        const active = grid.querySelector(".lord-team-card.is-open");
        if (active && active !== card) closeCard(active);

        if (card.classList.contains("is-open")) {
          closeCard(card);
        } else {
          openCard(card);
        }
      });

      panel.append(grid);
    };

    const tabButtons = tabs.map((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lord-team-tab";
      button.dataset.tab = tab.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.textContent = tab.label;
      tabsBar.append(button);
      return button;
    });

    tabsBar.addEventListener("click", (event) => {
      const button = event.target.closest(".lord-team-tab");
      if (!button) return;
      const tabId = button.dataset.tab || "all";

      tabButtons.forEach((tabButton) => {
        const isActive = tabButton === button;
        tabButton.classList.toggle("is-active", isActive);
        tabButton.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      renderPanel(tabId);
    });

    tabButtons[0]?.classList.add("is-active");
    renderPanel("all");

    const applyCollapsedState = (collapsed) => {
      catalog.classList.toggle("is-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.textContent = collapsed ? "Открыть каталог команды" : "Скрыть каталог команды";
    };

    toggle.addEventListener("click", () => {
      applyCollapsedState(!catalog.classList.contains("is-collapsed"));
    });

    applyCollapsedState(true);
    catalog.append(toggle, tabsBar, panel);
    slider.insertAdjacentElement("afterend", catalog);

    body.classList.add("lord-team-catalog-mode");
    record.classList.add("lord-team-catalog-ready");
  };

  const teamAutoLayout = () => {
    const section = document.querySelector("#rec1821410313");
    if (!section) return;
    section.querySelectorAll(".tn-elem[data-lord-shift='1']").forEach((node) => {
      node.style.top = "";
      node.removeAttribute("data-lord-shift");
    });
    section.querySelectorAll(".t396__artboard, .t396__carrier, .t396__filter").forEach((node) => {
      node.style.height = "";
    });
  };

  const debounce = (fn, wait = 140) => {
    let timeoutId;
    return () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fn, wait);
    };
  };

  const runDynamicLayout = () => {
    initHeroWordmark();
    initTrustMetricsGrid();
    disableRevealAnimationsForMarqueeBlock();
    initSeamlessMarquees();
    disableRevealAnimationsForMoodBlock();
    setRuntimeTextureVars();
    lockAllNonHeroBackgrounds();
    disableShapeRevealAnimations();
    initScrollProgressBar();
    initRoyalCursor();
    initRoyalOrnaments();
    initRoyalParticles();
    initRoyalParallaxDrift();
    initTeamCatalog();
    placePartnersHeadingBeforeSlider();
    teamAutoLayout();
  };

  initTrustMetricsGrid();
  disableRevealAnimationsForMarqueeBlock();
  initSeamlessMarquees();
  disableRevealAnimationsForMoodBlock();

  const runAfterLoader = () => {
    normalizeAnimationDurations();
    runDynamicLayout();
    window.setTimeout(runDynamicLayout, 420);
    waitForFonts().then(runDynamicLayout);
  };

  if (!body.classList.contains("lord-loading")) {
    runAfterLoader();
  } else {
    window.addEventListener("lord:loader-hidden", runAfterLoader, { once: true });
  }

  const rerunDynamicLayout = debounce(runDynamicLayout, 180);
  window.addEventListener("resize", rerunDynamicLayout, { passive: true });
  window.addEventListener("load", rerunDynamicLayout, { once: true });

  const isTransitionLink = (link, url) => {
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
    } catch (error) {
      return;
    }

    if (!isTransitionLink(link, url)) return;

    event.preventDefault();
    body.classList.add("lord-page-out");
    window.setTimeout(() => {
      window.location.assign(url.href);
    }, 190);
  });

  const prefetched = new Set();
  const queuePrefetch = (href) => {
    if (!href || prefetched.has(href)) return;
    prefetched.add(href);
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.href = href;
    prefetch.as = "document";
    document.head.append(prefetch);
  };

  document.querySelectorAll("a[href]").forEach((link) => {
    let url;
    try {
      url = new URL(link.getAttribute("href"), window.location.href);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin) return;
    if (!/\/(index\.html)?$/i.test(url.pathname) && !/\.html$/i.test(url.pathname)) return;

    const triggerPrefetch = () => queuePrefetch(url.href);
    link.addEventListener("mouseenter", triggerPrefetch, { once: true, passive: true });
    link.addEventListener("touchstart", triggerPrefetch, { once: true, passive: true });
  });
})();
