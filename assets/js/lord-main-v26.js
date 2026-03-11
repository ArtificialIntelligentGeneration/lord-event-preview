"use strict";

(() => {
  const HERO_REC_ID = "rec1821410193";
  const MARQUEE_REC_ID = "rec1841731213";
  const MOOD_REC_ID = "rec1849664253";
  const MAIN_NAV_ID = "rec1841231093";
  const LOADER_FALLBACK_VIDEO_MS = 4000;
  const LOADER_HARD_TIMEOUT_MS = 9000;

  const heroRec = document.getElementById(HERO_REC_ID);
  const marqueeRec = document.getElementById(MARQUEE_REC_ID);
  const navRec = document.getElementById(MAIN_NAV_ID);
  let marqueeInitialized = false;

  if (!heroRec || !marqueeRec || !navRec) return;

  const supportsMatchMedia = typeof window.matchMedia === "function";
  const prefersReducedMotion = supportsMatchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
  const isMobileViewport = supportsMatchMedia ? window.matchMedia("(max-width: 959px)").matches : window.innerWidth <= 959;
  const search = typeof window.URLSearchParams === "function" ? new URLSearchParams(window.location.search) : null;
  const safeMode = Boolean(search && search.get("safe") === "1");
  const liteMode = safeMode || prefersReducedMotion || lowCpu || isMobileViewport;
  const loaderStartedAt = performance.now();
  const body = document.body;
  let loaderNode = null;
  let loaderHidden = false;
  let loaderVideo = null;
  let loaderPageReady = document.readyState === "complete";
  let loaderVideoFinished = false;
  let loaderVideoDurationMs = LOADER_FALLBACK_VIDEO_MS;
  let loaderPlaybackStartedAt = loaderStartedAt;
  let loaderProgressTimer = 0;
  let loaderVideoFallbackTimer = 0;

  const setLoaderProgress = (value) => {
    if (!loaderNode) return;
    const progress = Math.max(0, Math.min(1, Number(value) || 0));
    loaderNode.style.setProperty("--loader-progress", progress.toFixed(4));
  };

  const clearLoaderTimer = (timerId) => {
    if (!timerId) return 0;
    window.clearTimeout(timerId);
    return 0;
  };

  const stopLoaderProgressLoop = () => {
    loaderProgressTimer = clearLoaderTimer(loaderProgressTimer);
  };

  const clearLoaderVideoFallback = () => {
    loaderVideoFallbackTimer = clearLoaderTimer(loaderVideoFallbackTimer);
  };

  const getLoaderNow = () => {
    if (window.performance && typeof window.performance.now === "function") {
      return window.performance.now();
    }
    return Date.now();
  };

  const ensureMainLoader = () => {
    if (!body) return;
    body.classList.add("lord-loading");
    if (loaderNode && loaderNode.parentElement) return;

    loaderNode = document.createElement("div");
    loaderNode.className = "lord-v26-loader";
    loaderNode.setAttribute("aria-hidden", "true");
    loaderNode.innerHTML = [
      '<video class="lord-v26-loader__video" autoplay muted playsinline webkit-playsinline preload="auto">',
      '<source src="./assets/lord/loader-main-0310.mp4" type="video/mp4">',
      "</video>",
      '<div class="lord-v26-loader__veil"></div>',
      '<div class="lord-v26-loader__content">',
      '<div class="lord-v26-loader__brand">LORD</div>',
      '<div class="lord-v26-loader__circle" aria-hidden="true">',
      '<svg class="lord-v26-loader__ring-svg" viewBox="0 0 120 120" focusable="false" aria-hidden="true">',
      '<circle class="lord-v26-loader__ring-track" cx="60" cy="60" r="48" pathLength="100"></circle>',
      '<circle class="lord-v26-loader__ring-progress" cx="60" cy="60" r="48" pathLength="100"></circle>',
      "</svg>",
      '<span class="lord-v26-loader__ring-head"></span>',
      "</div>",
      "</div>",
    ].join("");
    body.appendChild(loaderNode);
    setLoaderProgress(0);

    loaderVideo = loaderNode.querySelector(".lord-v26-loader__video");
    if (!loaderVideo) return;

    const syncDuration = () => {
      if (!loaderVideo) return;
      if (isFinite(loaderVideo.duration) && loaderVideo.duration > 0) {
        loaderVideoDurationMs = Math.max(500, loaderVideo.duration * 1000);
      }
    };

    const scheduleVideoFallback = () => {
      clearLoaderVideoFallback();
      loaderVideoFallbackTimer = window.setTimeout(finishLoaderVideo, Math.max(loaderVideoDurationMs + 480, LOADER_FALLBACK_VIDEO_MS));
    };

    loaderVideo.addEventListener("loadedmetadata", () => {
      syncDuration();
      scheduleVideoFallback();
    });

    loaderVideo.addEventListener("playing", () => {
      loaderPlaybackStartedAt = getLoaderNow() - loaderVideo.currentTime * 1000;
    });

    loaderVideo.addEventListener(
      "ended",
      () => {
        finishLoaderVideo();
      },
      { once: true }
    );

    loaderVideo.addEventListener(
      "error",
      () => {
        finishLoaderVideo();
      },
      { once: true }
    );

    syncDuration();
    scheduleVideoFallback();
    startLoaderProgressLoop();

    if (typeof loaderVideo.play === "function") {
      const playPromise = loaderVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          scheduleVideoFallback();
        });
      }
    }
  };

  const maybeHideMainLoader = () => {
    if (loaderHidden || !loaderPageReady || !loaderVideoFinished) return;
    hideMainLoader();
  };

  const finishLoaderVideo = () => {
    if (loaderVideoFinished) return;
    loaderVideoFinished = true;
    clearLoaderVideoFallback();
    stopLoaderProgressLoop();
    setLoaderProgress(1);
    maybeHideMainLoader();
  };

  const tickLoaderProgress = () => {
    if (loaderHidden || !loaderNode) return;

    let progress = 0;
    if (loaderVideoFinished) {
      progress = 1;
    } else if (loaderVideo && isFinite(loaderVideo.duration) && loaderVideo.duration > 0) {
      progress = loaderVideo.currentTime / loaderVideo.duration;
    } else {
      progress = (getLoaderNow() - loaderPlaybackStartedAt) / loaderVideoDurationMs;
    }

    setLoaderProgress(progress);

    if (!loaderVideoFinished) {
      loaderProgressTimer = window.setTimeout(tickLoaderProgress, 33);
    }
  };

  const startLoaderProgressLoop = () => {
    stopLoaderProgressLoop();
    tickLoaderProgress();
  };

  const hideMainLoader = () => {
    if (loaderHidden || !body) return;
    loaderHidden = true;
    clearLoaderVideoFallback();
    stopLoaderProgressLoop();
    body.classList.remove("lord-loading");
    if (loaderVideo && typeof loaderVideo.pause === "function") {
      loaderVideo.pause();
    }
    if (!loaderNode) return;
    loaderNode.classList.add("is-hidden");
    window.setTimeout(() => {
      if (loaderNode && loaderNode.parentElement) loaderNode.remove();
    }, 460);
  };

  const disableMainLoader = () => {
    loaderHidden = true;
    clearLoaderVideoFallback();
    stopLoaderProgressLoop();
    if (body) {
      body.classList.remove("lord-loading");
    }
    if (loaderVideo && typeof loaderVideo.pause === "function") {
      loaderVideo.pause();
    }
    if (loaderNode && loaderNode.parentElement) {
      loaderNode.remove();
    }
    loaderNode = null;
    loaderVideo = null;
  };

  if (liteMode) {
    disableMainLoader();
  } else {
    ensureMainLoader();
    window.setTimeout(() => {
      loaderPageReady = true;
      loaderVideoFinished = true;
      hideMainLoader();
    }, LOADER_HARD_TIMEOUT_MS);
    window.addEventListener(
      "load",
      () => {
        loaderPageReady = true;
        maybeHideMainLoader();
      },
      { once: true }
    );
    window.addEventListener(
      "pageshow",
      (event) => {
        if (event.persisted) hideMainLoader();
      },
      { once: true }
    );
  }

  const runNonCritical = (callback, timeout = 160) => {
    if (typeof callback !== "function") return;
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => callback(), { timeout });
      return;
    }
    window.setTimeout(callback, Math.min(timeout, liteMode ? 80 : 160));
  };

  const setMainImagesEager = () => {
    const criticalImages = new Set([
      ...document.querySelectorAll(`#${HERO_REC_ID} img`),
      ...document.querySelectorAll(`#${MOOD_REC_ID} .t195__img`),
      ...document.querySelectorAll(`#${MAIN_NAV_ID} img`),
    ]);

    criticalImages.forEach((img) => {
      img.loading = "eager";
      img.decoding = "async";
      if ("fetchPriority" in img) img.fetchPriority = "high";
    });
  };

  const preserveNativeLazyBackgrounds = () => {
    if (!isMobileViewport) return;
    document.querySelectorAll("#allrecords [data-content-cover-bg]").forEach((node) => {
      node.style.backgroundAttachment = "scroll";
    });
  };

  const initHeroBackgroundLock = () => {
    const carrier = heroRec.querySelector(".t396__carrier");
    const filter = heroRec.querySelector(".t396__filter");
    if (carrier) {
      carrier.style.backgroundImage =
        'linear-gradient(180deg, rgba(5,18,67,.25) 0%, rgba(5,22,72,.55) 100%), image-set(url("./assets/lord/hero-main-love-bg-8k.webp") type("image/webp"), url("./assets/lord/hero-main-love-bg-8k.jpg") type("image/jpeg"))';
      carrier.style.backgroundSize = "cover";
      carrier.style.backgroundPosition = "center 44%";
      carrier.style.backgroundRepeat = "no-repeat";
      carrier.style.backgroundAttachment = "scroll";
    }

    if (filter) {
      filter.style.background =
        "linear-gradient(180deg, rgba(2,12,45,.36) 0%, rgba(4,20,66,.42) 42%, rgba(8,33,94,.78) 100%)";
    }
  };

  const buildMarqueeTrack = (word) => {
    const track = document.createElement("div");
    track.className = "lord-v26-marquee__track";
    const repeats = window.innerWidth < 768 ? 6 : 10;
    for (let i = 0; i < repeats; i += 1) {
      const text = document.createElement("span");
      text.className = "lord-v26-marquee__text";
      text.textContent = `${word} /`;
      track.appendChild(text);
    }
    return track;
  };

  const initMarquee3Rows = () => {
    if (marqueeInitialized) return;
    const artboard = marqueeRec.querySelector(".t396__artboard");
    if (!artboard) return;

    let host = marqueeRec.querySelector(".lord-v26-marquee");
    if (!host) {
      host = document.createElement("div");
      host.className = "lord-v26-marquee";
      host.setAttribute("aria-hidden", "true");
      artboard.appendChild(host);
    } else {
      host.innerHTML = "";
    }

    const rows = [
      { word: "Счастье", speed: "slow", tone: "happiness" },
      { word: "Любовь", speed: "mid", tone: "love" },
      { word: "Радость", speed: "fast", tone: "joy" },
    ];

    rows.forEach(({ word, speed, tone }) => {
      const row = document.createElement("div");
      row.className = "lord-v26-marquee__row";
      row.dataset.speed = speed;
      row.dataset.tone = tone;
      row.appendChild(buildMarqueeTrack(word));
      host.appendChild(row);
    });

    marqueeRec.classList.add("lord-v26-marquee-ready");
    marqueeInitialized = true;
  };

  const clearRevealState = (scope) => {
    scope.querySelectorAll(".t-animate, .t396__elem--anim-hidden").forEach((node) => {
      node.classList.remove("t-animate");
      node.classList.remove("t396__elem--anim-hidden");
      node.style.opacity = "1";
      node.style.transform = "none";
      node.style.transition = "none";
      [...node.attributes].forEach((attr) => {
        if (attr.name.startsWith("data-animate")) node.removeAttribute(attr.name);
      });
    });
  };

  const disableProblemRevealInTargetBlocks = () => {
    clearRevealState(marqueeRec);
    const moodRec = document.getElementById(MOOD_REC_ID);
    if (moodRec) clearRevealState(moodRec);
    const trustRec = document.getElementById("rec1821410213");
    if (trustRec) clearRevealState(trustRec);
  };

  const initTopProgressBar = () => {
    if (document.querySelector(".lord-v26-progress")) return;

    const root = document.createElement("div");
    root.className = "lord-v26-progress";
    root.setAttribute("aria-hidden", "true");

    const bar = document.createElement("span");
    bar.className = "lord-v26-progress__bar";
    root.appendChild(bar);
    document.body.appendChild(root);

    const update = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
      bar.style.width = `${progress}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  };

  const initMainOrnaments = () => {
    if (prefersReducedMotion || lowCpu || window.innerWidth <= 960) return;
    if (document.querySelector(".lord-v26-ornaments")) return;

    const sectionConfigs = [
      {
        id: "rec1849664253",
        items: [
          { glyph: "👑", cls: "lord-v26-ornament--crown", left: "4%", top: "14%", size: "18px", op: "0.24" },
          { glyph: "💎", cls: "lord-v26-ornament--diamond", right: "4%", top: "64%", size: "17px", op: "0.22" },
        ],
      },
      {
        id: "rec1821410213",
        items: [
          { glyph: "💎", cls: "lord-v26-ornament--diamond", right: "3%", top: "20%", size: "16px", op: "0.2" },
          { glyph: "👑", cls: "lord-v26-ornament--crown", left: "3%", top: "78%", size: "18px", op: "0.22" },
        ],
      },
      {
        id: "rec1821410313",
        items: [
          { glyph: "👑", cls: "lord-v26-ornament--crown", right: "2.6%", top: "16%", size: "19px", op: "0.22" },
          { glyph: "💎", cls: "lord-v26-ornament--diamond", left: "2.8%", top: "62%", size: "17px", op: "0.2" },
        ],
      },
      {
        id: "rec1821410343",
        items: [
          { glyph: "💎", cls: "lord-v26-ornament--diamond", left: "4%", top: "18%", size: "17px", op: "0.2" },
          { glyph: "👑", cls: "lord-v26-ornament--crown", right: "4%", top: "72%", size: "18px", op: "0.22" },
        ],
      },
      {
        id: "rec1821410373",
        items: [
          { glyph: "👑", cls: "lord-v26-ornament--crown", left: "3%", top: "22%", size: "18px", op: "0.22" },
          { glyph: "💎", cls: "lord-v26-ornament--diamond", right: "3%", top: "58%", size: "16px", op: "0.2" },
        ],
      },
      {
        id: "rec1821410433",
        items: [
          { glyph: "💎", cls: "lord-v26-ornament--diamond", right: "4%", top: "28%", size: "17px", op: "0.2" },
          { glyph: "👑", cls: "lord-v26-ornament--crown", left: "4%", top: "68%", size: "18px", op: "0.2" },
        ],
      },
      {
        id: "rec1849650653",
        items: [{ glyph: "💎", cls: "lord-v26-ornament--diamond", right: "3%", top: "14%", size: "16px", op: "0.18" }],
      },
    ];

    sectionConfigs.forEach(({ id, items }) => {
      const rec = document.getElementById(id);
      if (!rec) return;
      if (rec.querySelector(".lord-v26-ornaments")) return;

      rec.classList.add("lord-v26-ornament-host");

      const layer = document.createElement("div");
      layer.className = "lord-v26-ornaments";
      layer.setAttribute("aria-hidden", "true");

      items.forEach((item) => {
        const ornament = document.createElement("span");
        ornament.className = `lord-v26-ornament ${item.cls}`;
        ornament.textContent = item.glyph;
        if (item.left) ornament.style.left = item.left;
        if (item.right) ornament.style.right = item.right;
        ornament.style.top = item.top;
        ornament.style.setProperty("--size", item.size);
        ornament.style.setProperty("--op", item.op);
        layer.appendChild(ornament);
      });

      rec.appendChild(layer);
    });
  };

  const mergePartnersIntoTeamSlider = () => {
    const teamRec = document.getElementById("rec1821410343");
    const partnersRec = document.getElementById("rec1821410383");
    if (!teamRec || !partnersRec) return;
    if (teamRec.querySelector(".lord-v34-partners-title")) return;

    const anchor = teamRec.querySelector(".t-slds__main") || teamRec.querySelector(".t728");
    if (!anchor) return;

    const title = document.createElement("div");
    title.className = "lord-v34-partners-title";
    title.textContent = "Партнеры";
    anchor.appendChild(title);

    partnersRec.style.display = "none";
  };

  const wrapHeroLordWord = () => {
    const title = heroRec.querySelector(".tn-elem[data-elem-id='1638185185529'] .tn-atom");
    if (!title) return;
    if (title.querySelector(".lord-v34-hero-lord")) return;

    const html = title.innerHTML;
    title.innerHTML = html.replace(/«?\s*LORD\s*»?/i, '<span class="lord-v34-hero-lord">LORD</span>');
  };

  const replaceUnderHeroLogo = () => {
    const image = document.querySelector(`#${MOOD_REC_ID} .t195__img`);
    if (!image) return;
    image.src = "./assets/lord/lord-final-2.png";
    image.alt = "LORD — ивент-агентство";
    image.loading = "eager";
    image.decoding = "async";
    image.removeAttribute("data-original");
  };

  const init = () => {
    document.body.classList.add("lord-main-v26");
    if (liteMode) {
      document.body.classList.add("lord-main-lite");
    }
    setMainImagesEager();
    preserveNativeLazyBackgrounds();
    initHeroBackgroundLock();
    disableProblemRevealInTargetBlocks();
    replaceUnderHeroLogo();
    wrapHeroLordWord();
    runNonCritical(() => {
      initMarquee3Rows();
      mergePartnersIntoTeamSlider();
    }, 120);

    if (!liteMode) {
      runNonCritical(() => {
        initTopProgressBar();
        initMainOrnaments();
      }, 180);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("load", () => {
    disableProblemRevealInTargetBlocks();
    runNonCritical(() => {
      initMarquee3Rows();
      mergePartnersIntoTeamSlider();
    }, 80);
  });
})();
