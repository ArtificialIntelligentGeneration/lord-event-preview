(() => {
  if (window.__lordSiteRuntimeInitialized) {
    return;
  }
  window.__lordSiteRuntimeInitialized = true;

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  const supportsMatchMedia = typeof window.matchMedia === "function";
  const prefersReducedMotion = supportsMatchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  const hasFinePointer = supportsMatchMedia ? window.matchMedia("(pointer:fine)").matches : false;
  const search = typeof window.URLSearchParams === "function" ? new URLSearchParams(window.location.search) : null;
  const safeMode = Boolean(search && search.get("safe") === "1");
  const isMobileViewport = supportsMatchMedia ? window.matchMedia("(max-width: 767px)").matches : window.innerWidth <= 767;
  const isMobileRuntime = safeMode || isMobileViewport;
  const analyticsConfig = window.APP_ANALYTICS || {};
  const runtimeStartedAt = Date.now();
  let resourceErrorCount = 0;
  let analyticsInitialized = false;
  let rumSent = false;

  const nowMs = () => {
    if (window.performance && typeof window.performance.now === "function") {
      return Math.round(window.performance.now());
    }
    return Date.now() - runtimeStartedAt;
  };

  const runtimeMetrics = {
    page: body && body.dataset ? body.dataset.page || "unknown" : "unknown",
    mode: isMobileRuntime ? "mobile" : "desktop",
    safe_mode: safeMode,
    domcontentloaded_ms: doc.readyState === "loading" ? null : nowMs(),
    first_form_ready_ms: null,
    loader_visible_ms: null,
  };

  if (root) {
    if (isMobileRuntime) {
      root.classList.add("lord-lite-mobile");
    }
    if (safeMode) {
      root.classList.add("lord-safe-mode");
    }
  }

  const FORM_READY_SELECTOR = "form[data-lead-form], #form1849650653_new, #form1849650653, #form1841241923";

  const markDomContentLoaded = () => {
    if (runtimeMetrics.domcontentloaded_ms == null) {
      runtimeMetrics.domcontentloaded_ms = nowMs();
    }
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", markDomContentLoaded, { once: true });
  }

  const markFirstFormReady = () => {
    if (runtimeMetrics.first_form_ready_ms != null) {
      return;
    }
    const form = doc.querySelector(FORM_READY_SELECTOR);
    if (form) {
      runtimeMetrics.first_form_ready_ms = nowMs();
    }
  };

  [0, 180, 520, 980, 1600].forEach((delay) => {
    window.setTimeout(markFirstFormReady, delay);
  });

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target && target !== window && target.tagName) {
        resourceErrorCount += 1;
        const resourceUrl = target.currentSrc || target.src || target.href || target.baseURI || "unknown";
        console.error("LORD resource error:", target.tagName, resourceUrl);
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", () => {
    resourceErrorCount += 1;
  });

  const sendRum = (reason) => {
    if (rumSent) {
      return;
    }
    rumSent = true;
    const payload = JSON.stringify({
      reason,
      page: runtimeMetrics.page,
      mode: runtimeMetrics.mode,
      safe_mode: runtimeMetrics.safe_mode,
      loader_visible_ms: runtimeMetrics.loader_visible_ms,
      domcontentloaded_ms: runtimeMetrics.domcontentloaded_ms,
      first_form_ready_ms: runtimeMetrics.first_form_ready_ms,
      resource_error_count: resourceErrorCount,
      ua: navigator.userAgent,
      url: window.location.href,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/rum",
          new Blob([payload], {
            type: "application/json",
          })
        );
        return;
      }
    } catch (error) {
      console.error("LORD sendBeacon failed:", error);
    }

    if (typeof window.fetch === "function") {
      window
        .fetch("/api/rum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        })
        .catch(() => undefined);
    }
  };

  window.addEventListener(
    "pagehide",
    () => {
      markFirstFormReady();
      sendRum("pagehide");
    },
    { once: true }
  );

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        markFirstFormReady();
        sendRum("load-settled");
      }, isMobileRuntime ? 900 : 1400);
    },
    { once: true }
  );

  const runWhenIdle = (callback, timeout = 200) => {
    if (typeof callback !== "function") {
      return;
    }
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => callback(), { timeout });
      return;
    }
    window.setTimeout(callback, Math.min(timeout, isMobileRuntime ? 120 : 220));
  };

  const trimValue = (value, max = 120) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
  const safeGetAttr = (node, name) =>
    node && typeof node.getAttribute === "function" ? node.getAttribute(name) : "";
  const getPageName = () => (body && body.dataset ? body.dataset.page || "unknown" : "unknown");
  const nodeText = (node) =>
    trimValue(
      safeGetAttr(node, "aria-label") ||
        safeGetAttr(node, "title") ||
        (node && node.textContent) ||
        (node && node.value) ||
        "",
      90
    );

  const initAnalytics = () => {
    if (analyticsInitialized) {
      return;
    }
    analyticsInitialized = true;

    const gaId = typeof analyticsConfig.gaMeasurementId === "string" ? analyticsConfig.gaMeasurementId.trim() : "";
    if (gaId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function gtag() {
          window.dataLayer.push(arguments);
        };

      const gaScript = doc.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      doc.head.appendChild(gaScript);

      window.gtag("js", new Date());
      window.gtag("config", gaId, { anonymize_ip: true });
    }

    const ymId = Number(analyticsConfig.yandexCounterId);
    if (Number.isFinite(ymId) && ymId > 0) {
      window.ym =
        window.ym ||
        function ym() {
          (window.ym.a = window.ym.a || []).push(arguments);
        };
      window.ym.l = Date.now();

      const ymScript = doc.createElement("script");
      ymScript.async = true;
      ymScript.src = "https://mc.yandex.ru/metrika/tag.js";
      doc.head.appendChild(ymScript);

      window.ym(ymId, "init", {
        ssr: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
        ecommerce: "dataLayer",
        referrer: doc.referrer,
        url: window.location.href,
      });
    }
  };

  const trackEvent = (eventName, payload = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }

    const ymId = analyticsConfig && analyticsConfig.yandexCounterId;
    if (typeof window.ym === "function" && ymId) {
      window.ym(ymId, "reachGoal", eventName, payload);
    }
  };

  const waitForDomReady = () =>
    new Promise((resolve) => {
      if (doc.readyState !== "loading") {
        resolve();
        return;
      }
      doc.addEventListener("DOMContentLoaded", resolve, { once: true });
    });

  const waitForFonts = () => {
    const fontsApi = doc.fonts;
    const fontsReady = fontsApi && fontsApi.ready;
    if (!fontsApi || !fontsReady || typeof fontsReady.then !== "function") {
      return Promise.resolve();
    }

    return Promise.race([
      fontsReady.catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, isMobileRuntime ? 260 : 700)),
    ]);
  };

  const waitForCriticalImages = () => {
    const candidates = Array.prototype.slice
      .call(doc.images)
      .filter((img) => img.loading !== "lazy" || img.fetchPriority === "high" || img.closest(".hero, .joy-hero"));
    const pending = candidates.filter((img) => !img.complete);
    if (!pending.length) {
      return Promise.resolve();
    }

    return Promise.race([
      Promise.allSettled(
        pending.map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
        )
      ).then(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, isMobileRuntime ? 420 : 950)),
    ]);
  };

  const waitForLeadForms = () =>
    new Promise((resolve) => {
      const tryResolve = () => {
        markFirstFormReady();
        if (runtimeMetrics.first_form_ready_ms != null) {
          resolve();
          return true;
        }
        return false;
      };

      if (tryResolve()) {
        return;
      }

      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if (tryResolve()) {
          window.clearInterval(timer);
          return;
        }

        if (Date.now() - startedAt >= (isMobileRuntime ? 750 : 1100)) {
          window.clearInterval(timer);
          resolve();
        }
      }, 90);
    });

  const initPageTransitions = () => {
    if (!body) {
      return;
    }

    const isInternalPageLink = (link, url) => {
      const href = (link.getAttribute("href") || "").trim();
      if (!href || href.startsWith("#")) return false;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;
      if (link.hasAttribute("download")) return false;
      if (link.target && link.target.toLowerCase() === "_blank") return false;
      if (url.origin !== window.location.origin) return false;
      return `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
    };

    doc.addEventListener("click", (event) => {
      const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) return;

      let url;
      try {
        url = new URL(link.getAttribute("href"), window.location.href);
      } catch (error) {
        return;
      }

      if (!isInternalPageLink(link, url)) return;
      event.preventDefault();
      body.classList.add("page-leaving");
      window.setTimeout(() => {
        window.location.assign(url.href);
      }, isMobileRuntime ? 110 : 190);
    });

    const prefetched = new Set();
    const prefetchPage = (href) => {
      if (!href || prefetched.has(href)) return;
      prefetched.add(href);
      const node = doc.createElement("link");
      node.rel = "prefetch";
      node.href = href;
      node.as = "document";
      doc.head.appendChild(node);
    };

    doc.querySelectorAll("a[href]").forEach((link) => {
      let url;
      try {
        url = new URL(link.getAttribute("href"), window.location.href);
      } catch (error) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!/\/(index\.html)?$/i.test(url.pathname) && !/\.html$/i.test(url.pathname)) return;
      const preload = () => prefetchPage(url.href);
      link.addEventListener("mouseenter", preload, { once: true, passive: true });
      link.addEventListener("touchstart", preload, { once: true, passive: true });
    });
  };

  if (body) {
    const clearRadostBootLoading = () => {
      if (root) {
        root.classList.remove("radost-boot-loading");
      }
    };

    try {
      const isRadostLoader = body.classList.contains("theme-radost") && body.classList.contains("radost-v4");
      const isSchastyeLoader = body.classList.contains("theme-schastye") && body.classList.contains("schastye-v4");
      const disableBlockingLoader = isMobileRuntime || safeMode;

      if (disableBlockingLoader) {
        body.classList.remove("lord-loading");
        const staleLoader = body.querySelector(".lord-loader");
        if (staleLoader) staleLoader.remove();
        clearRadostBootLoading();
        initPageTransitions();
      } else {
        body.classList.add("lord-loading");

        const loader = body.querySelector(".lord-loader") || doc.createElement("div");
        loader.className = isRadostLoader
          ? "lord-loader lord-loader--radost"
          : isSchastyeLoader
            ? "lord-loader lord-loader--schastye"
            : "lord-loader";
        loader.classList.remove("is-hidden");
        loader.setAttribute("aria-hidden", "true");

        if (isRadostLoader) {
          const radostShapeEntities = [
            "&#9633;",
            "&#9651;",
            "&#10005;",
            "&#9711;",
            "&#9632;",
            "&#9650;",
            "&#9675;",
            "&#10022;",
            "&#9633;",
            "&#9651;",
            "&#10005;",
            "&#9711;",
          ];
          const radostShapeMarkup = radostShapeEntities
            .map((shape, index) => `<span class="lord-loader__shape lord-loader__shape-${index + 1}">${shape}</span>`)
            .join("");
          loader.innerHTML = [
            '<div class="lord-loader__ambient" aria-hidden="true">',
            radostShapeMarkup,
            "</div>",
            '<div class="lord-loader__inner">',
            '<div class="lord-loader__ring"></div>',
            '<div class="lord-loader__logo">LORD</div>',
            '<div class="lord-loader__sub">Ивент-агентство</div>',
            '<div class="lord-loader__line"><span></span></div>',
            "</div>",
          ].join("");
        } else if (isSchastyeLoader) {
          loader.innerHTML = [
            '<div class="lord-loader__inner">',
            '<div class="lord-loader__ring"></div>',
            '<div class="lord-loader__logo">LORD</div>',
            '<div class="lord-loader__sub">Ивент-агентство</div>',
            '<div class="lord-loader__line"><span></span></div>',
            "</div>",
          ].join("");
        } else {
          loader.innerHTML = [
            '<div class="lord-loader__inner">',
            '<div class="lord-loader__ring"></div>',
            '<div class="lord-loader__logo">LORD</div>',
            '<div class="lord-loader__sub">Ивент-агентство</div>',
            "</div>",
          ].join("");
        }

        if (!loader.parentElement) {
          body.appendChild(loader);
        }
        clearRadostBootLoading();

        let loaderHidden = false;
        let loaderSafetyTimer = 0;
        const pageMaxWait = 1500;

        const hideLoader = () => {
          if (loaderHidden) {
            return;
          }
          loaderHidden = true;
          if (loaderSafetyTimer) {
            window.clearTimeout(loaderSafetyTimer);
            loaderSafetyTimer = 0;
          }
          loader.classList.add("is-hidden");
          body.classList.remove("lord-loading");
          runtimeMetrics.loader_visible_ms = nowMs();
          runWhenIdle(() => sendRum("loader-hidden"), 280);
          window.setTimeout(() => {
            if (loader.parentElement) {
              loader.remove();
            }
          }, 420);
        };

        loaderSafetyTimer = window.setTimeout(hideLoader, pageMaxWait + 320);

        const minLoaderDelay = isSchastyeLoader ? 520 : isRadostLoader ? 420 : 180;

        Promise.race([
          Promise.all([
            waitForDomReady(),
            waitForFonts(),
            waitForLeadForms(),
            waitForCriticalImages(),
            new Promise((resolve) => window.setTimeout(resolve, minLoaderDelay)),
          ]),
          new Promise((resolve) => window.setTimeout(resolve, pageMaxWait)),
        ]).then(hideLoader);

        initPageTransitions();
      }
    } catch (error) {
      body.classList.remove("lord-loading");
      const staleLoader = body.querySelector(".lord-loader");
      if (staleLoader) staleLoader.remove();
      clearRadostBootLoading();
      console.error("LORD loader init failed:", error);
    }
  }

  const nav = doc.querySelector(".site-nav");
  const toggle = doc.querySelector(".menu-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const sanitizePhone = (value) => value.replace(/\s+/g, "").replace(/[-()]/g, "");
  const isLikelyPhoneValue = (value) => /^[+\d()\s-]*$/.test(value || "");
  const onlyDigits = (value) => String(value || "").replace(/\D+/g, "");

  const formatRuPhone = (digits) => {
    if (!digits) return "";
    let normalized = digits;

    if (normalized.startsWith("8")) {
      normalized = `7${normalized.slice(1)}`;
    }

    if (normalized.startsWith("7")) {
      const country = "+7";
      const local = normalized.slice(1, 11);
      const p1 = local.slice(0, 3);
      const p2 = local.slice(3, 6);
      const p3 = local.slice(6, 8);
      const p4 = local.slice(8, 10);
      if (!p1) return country;
      if (!p2) return `${country} (${p1}`;
      if (!p3) return `${country} (${p1}) ${p2}`;
      if (!p4) return `${country} (${p1}) ${p2}-${p3}`;
      return `${country} (${p1}) ${p2}-${p3}-${p4}`;
    }

    return `+${normalized.slice(0, 15)}`;
  };

  const applyPhoneMask = (input) => {
    const raw = String(input.value || "");
    if (!raw) return;
    if (!isLikelyPhoneValue(raw)) return;
    const digits = onlyDigits(raw);
    if (!digits) return;
    input.value = formatRuPhone(digits);
  };

  const applyDateMask = (input) => {
    const digits = onlyDigits(input.value).slice(0, 8);
    if (!digits) {
      input.value = "";
      return;
    }
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    input.value = [day, month, year].filter(Boolean).join(".");
  };

  const initLeadMasks = () => {
    doc.querySelectorAll("form[data-lead-form] [name='contact']").forEach((input) => {
      input.setAttribute("inputmode", "tel");
      input.addEventListener("input", () => applyPhoneMask(input));
      input.addEventListener("blur", () => applyPhoneMask(input));
    });

    doc.querySelectorAll("form[data-lead-form] input[name='date'][type='text']").forEach((input) => {
      input.setAttribute("inputmode", "numeric");
      input.addEventListener("input", () => applyDateMask(input));
      input.addEventListener("blur", () => applyDateMask(input));
    });
  };

  const readFirstNonEmptyField = (form, fieldName) => {
    const fields = form.querySelectorAll(`[name='${fieldName}']`);
    for (const field of fields) {
      const value = String(field.value || "").trim();
      if (value) return value;
    }
    return "";
  };

  const writeFieldValue = (form, fieldName, value) => {
    form.querySelectorAll(`[name='${fieldName}']`).forEach((field) => {
      field.value = value;
    });
  };

  const resolveLeadEndpoint = (form) => {
    const raw = String(form.dataset.endpoint || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw, window.location.origin).toString();
    } catch (error) {
      return "";
    }
  };

  const submitForm = async (form) => {
    const statusEl = form.querySelector(".form-status");
    const submitBtn = form.querySelector("button[type='submit']");

    const setStatus = (text, className) => {
      if (!statusEl) {
        return;
      }
      statusEl.textContent = text;
      statusEl.className = className || "form-status";
    };

    const name = readFirstNonEmptyField(form, "name");
    const contact = readFirstNonEmptyField(form, "contact");
    const format = readFirstNonEmptyField(form, "format");
    const message = readFirstNonEmptyField(form, "message");
    const direction = readFirstNonEmptyField(form, "direction") || "all";
    const formType = (form.dataset.formType || "").trim();
    const readField = (fieldName) => readFirstNonEmptyField(form, fieldName);

    let finalFormat = format;
    if (!finalFormat) {
      if (formType === "love") {
        const date = readField("date");
        const guests = readField("guests");
        const budget = readField("budget");
        finalFormat = [date && `Дата: ${date}`, guests && `Гостей: ${guests}`, budget && `Бюджет: ${budget}`]
          .filter(Boolean)
          .join(", ");
      } else if (formType === "radost") {
        const age = readField("age");
        const venue = readField("venue");
        finalFormat = [age && `Возраст: ${age}`, venue && `Место: ${venue}`].filter(Boolean).join(", ");
      }

      if (finalFormat) {
        writeFieldValue(form, "format", finalFormat);
      }
    }

    if (!name || !contact || !finalFormat) {
      setStatus("Заполните имя, контакт и формат мероприятия.", "form-status error");
      return;
    }

    const rawPhone = sanitizePhone(contact);
    const isPhone = /^\+?[0-9]{10,15}$/.test(rawPhone);
    const isMessenger = /@|telegram|wa|whatsapp|t\.me|tg/i.test(contact);
    if (!isPhone && !isMessenger) {
      setStatus("Укажите телефон в международном формате или Telegram/WhatsApp.", "form-status error");
      return;
    }

    const payload = {
      name,
      contact,
      format: finalFormat,
      message,
      direction,
      page: getPageName(),
      source: "website",
      submitted_at: new Date().toISOString(),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    setStatus("Отправляем заявку...", "form-status");

    const endpoint = resolveLeadEndpoint(form);

    try {
      if (!endpoint) {
        throw new Error("Missing form endpoint");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus("Готово. Мы свяжемся с вами в течение 15 минут в рабочее время.", "form-status success");
      trackEvent("lead_submit", { direction, page: getPageName() });
      form.reset();
    } catch (error) {
      setStatus(
        "Не удалось отправить автоматически. Нажмите кнопку снова или свяжитесь с нами напрямую.",
        "form-status error"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  };

  initLeadMasks();

  doc.querySelectorAll("form[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitForm(form);
    });
  });

  doc.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const initReveal = () => {
    const revealItems = doc.querySelectorAll(".reveal");
    if (!revealItems.length) {
      return;
    }

    if (!body) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    if (isMobileRuntime || safeMode) {
      body.classList.remove("reveal-enabled");
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    body.classList.add("reveal-enabled");
    try {
      if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.14 }
        );

        const firstFold = window.innerHeight * 0.98;
        revealItems.forEach((item, index) => {
          if (item.getBoundingClientRect().top < firstFold) {
            item.classList.add("is-visible");
            return;
          }
          item.style.transitionDelay = `${Math.min(index * 30, 280)}ms`;
          revealObserver.observe(item);
        });
      } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
      }
    } catch (error) {
      body.classList.remove("reveal-enabled");
      revealItems.forEach((item) => item.classList.add("is-visible"));
      console.error("LORD reveal init failed:", error);
    }
  };

  const initParallax = () => {
    if (prefersReducedMotion || isMobileRuntime || safeMode) {
      return;
    }

    const parallaxItems = Array.prototype.slice.call(doc.querySelectorAll("[data-parallax]"));
    if (!parallaxItems.length) {
      return;
    }

    const applyParallax = () => {
      if (doc.visibilityState === "hidden") {
        return;
      }
      const viewportH = window.innerHeight || 1;
      parallaxItems.forEach((el) => {
        const speed = Number(el.getAttribute("data-parallax")) || 0;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - viewportH / 2) / viewportH;
        const move = offset * speed * -34;
        el.style.transform = `translate3d(0, ${move.toFixed(2)}px, 0)`;
      });
    };

    const scheduleParallax = (() => {
      let frame = 0;
      return () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          applyParallax();
        });
      };
    })();

    applyParallax();
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax);
  };

  const initStickyHeader = () => {
    const stickyHeader = doc.querySelector("[data-sticky-shell]");
    if (!stickyHeader) {
      return;
    }
    const syncStickyState = () => {
      stickyHeader.classList.toggle("is-scrolled", window.scrollY > 14);
    };
    syncStickyState();
    window.addEventListener("scroll", syncStickyState, { passive: true });
  };

  const initSchastyeEffects = () => {
    const isSchastyeV4 = Boolean(body && body.classList.contains("schastye-v4"));
    if (!isSchastyeV4) {
      return;
    }

    const schScrollProgress = doc.querySelector("[data-sch-scroll-progress]");
    const updateSchScrollProgress = () => {
      if (!schScrollProgress) {
        return;
      }
      const maxScrollable = Math.max(doc.documentElement.scrollHeight - doc.documentElement.clientHeight, 1);
      const current = Math.min(Math.max(window.scrollY / maxScrollable, 0), 1);
      schScrollProgress.style.transform = `scaleX(${current.toFixed(4)})`;
    };

    updateSchScrollProgress();
    window.addEventListener("scroll", updateSchScrollProgress, { passive: true });
    window.addEventListener("resize", updateSchScrollProgress);

    if (isMobileRuntime || safeMode || prefersReducedMotion || !hasFinePointer) {
      return;
    }

    const hero = doc.querySelector(".theme-schastye.schastye-v4 .hero");
    if (hero) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty("--sch-pointer-x", `${Math.min(Math.max(x, 0), 100).toFixed(2)}%`);
        hero.style.setProperty("--sch-pointer-y", `${Math.min(Math.max(y, 0), 100).toFixed(2)}%`);
      });

      hero.addEventListener("pointerleave", () => {
        hero.style.removeProperty("--sch-pointer-x");
        hero.style.removeProperty("--sch-pointer-y");
      });
    }

    doc.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.transform = `translate3d(${(x * 8).toFixed(2)}px, ${(y * 8).toFixed(2)}px, 0)`;
      });

      button.addEventListener("pointerleave", () => {
        button.style.transform = "";
      });
    });

    const schCursor = doc.querySelector(".sch-cursor-disco");
    if (!schCursor) {
      return;
    }

    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.5;
    let currentX = pointerX;
    let currentY = pointerY;
    let frameId = 0;
    let clickTimeout = 0;

    const renderCursor = () => {
      currentX += (pointerX - currentX) * 0.16;
      currentY += (pointerY - currentY) * 0.16;
      const halfW = (schCursor.offsetWidth || 44) * 0.5;
      const halfH = (schCursor.offsetHeight || 44) * 0.5;
      schCursor.style.transform = `translate3d(${(currentX - halfW).toFixed(2)}px, ${(currentY - halfH).toFixed(2)}px, 0)`;

      const dist = Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY);
      if (dist > 0.2) {
        frameId = window.requestAnimationFrame(renderCursor);
      } else {
        frameId = 0;
      }
    };

    const queueCursorRender = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderCursor);
    };

    doc.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
          return;
        }
        pointerX = event.clientX;
        pointerY = event.clientY;
        schCursor.classList.add("is-active");
        queueCursorRender();
      },
      { passive: true }
    );

    doc.addEventListener("pointerdown", () => {
      schCursor.classList.add("is-click");
      window.clearTimeout(clickTimeout);
      clickTimeout = window.setTimeout(() => schCursor.classList.remove("is-click"), 160);
    });

    window.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        schCursor.classList.remove("is-active");
      }
    });

    window.addEventListener("blur", () => {
      schCursor.classList.remove("is-active");
    });
  };

  const initRadostEffects = () => {
    const isRadostPage = Boolean(body && (body.classList.contains("radost-v3") || body.classList.contains("radost-v4")));
    if (!isRadostPage) {
      return;
    }

    const scrollProgressBar = doc.querySelector("[data-scroll-progress]");
    const updateScrollProgress = () => {
      if (!scrollProgressBar) {
        return;
      }
      const maxScrollable = Math.max(doc.documentElement.scrollHeight - doc.documentElement.clientHeight, 1);
      const current = Math.min(Math.max(window.scrollY / maxScrollable, 0), 1);
      scrollProgressBar.style.transform = `scaleX(${current.toFixed(4)})`;
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    if (isMobileRuntime || safeMode || prefersReducedMotion || !hasFinePointer) {
      return;
    }

    const hero = doc.querySelector(".joy-hero");
    if (hero) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty("--hero-pointer-x", `${Math.min(Math.max(x, 0), 100).toFixed(2)}%`);
        hero.style.setProperty("--hero-pointer-y", `${Math.min(Math.max(y, 0), 100).toFixed(2)}%`);
      });

      hero.addEventListener("pointerleave", () => {
        hero.style.removeProperty("--hero-pointer-x");
        hero.style.removeProperty("--hero-pointer-y");
      });
    }

    const magicCursor = doc.querySelector(".joy-magic-cursor");
    if (!magicCursor) {
      return;
    }

    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.5;
    let currentX = pointerX;
    let currentY = pointerY;
    let frameId = 0;
    let clickTimeout = 0;

    const renderCursor = () => {
      currentX += (pointerX - currentX) * 0.18;
      currentY += (pointerY - currentY) * 0.18;
      magicCursor.style.transform = `translate3d(${(currentX - 11).toFixed(2)}px, ${(currentY - 11).toFixed(2)}px, 0)`;

      const dist = Math.abs(pointerX - currentX) + Math.abs(pointerY - currentY);
      if (dist > 0.2) {
        frameId = window.requestAnimationFrame(renderCursor);
      } else {
        frameId = 0;
      }
    };

    const queueCursorRender = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(renderCursor);
    };

    doc.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
          return;
        }
        pointerX = event.clientX;
        pointerY = event.clientY;
        magicCursor.classList.add("is-active");
        queueCursorRender();
      },
      { passive: true }
    );

    doc.addEventListener("pointerdown", () => {
      magicCursor.classList.add("is-click");
      window.clearTimeout(clickTimeout);
      clickTimeout = window.setTimeout(() => magicCursor.classList.remove("is-click"), 160);
    });

    window.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        magicCursor.classList.remove("is-active");
      }
    });

    window.addEventListener("blur", () => {
      magicCursor.classList.remove("is-active");
    });
  };

  const initTiltCards = () => {
    if (prefersReducedMotion || isMobileRuntime || safeMode || !hasFinePointer) {
      return;
    }

    doc.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 7;
        const rotateX = (0.5 - y) * 7;
        card.style.transform = `perspective(920px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  };

  const initScrollableTracks = () => {
    const tracks = Array.prototype.slice.call(doc.querySelectorAll("[data-scrollable]")).filter((track) => track.id);
    if (!tracks.length) {
      return;
    }

    const controlMap = new Map();
    const smoothBehavior = prefersReducedMotion ? "auto" : "smooth";

    doc.querySelectorAll("[data-scroll-prev], [data-scroll-next]").forEach((button) => {
      const targetId = (button.getAttribute("data-scroll-target") || "").trim();
      if (!targetId) {
        return;
      }

      const target = doc.getElementById(targetId);
      if (!target) {
        button.hidden = true;
        return;
      }

      if (!controlMap.has(targetId)) {
        controlMap.set(targetId, []);
      }
      controlMap.get(targetId).push(button);

      button.addEventListener("click", () => {
        const factorRaw = Number(target.dataset.scrollStep);
        const factor = Number.isFinite(factorRaw) && factorRaw > 0 ? factorRaw : 0.9;
        const step = Math.max(180, target.clientWidth * factor);
        const direction = button.hasAttribute("data-scroll-next") ? 1 : -1;
        target.scrollBy({ left: direction * step, behavior: smoothBehavior });
      });
    });

    const syncTrackButtons = (track) => {
      const controls = controlMap.get(track.id);
      if (!controls || !controls.length) {
        return;
      }

      const left = track.scrollLeft;
      const maxLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
      controls.forEach((button) => {
        const isNext = button.hasAttribute("data-scroll-next");
        const shouldDisable = isNext ? left >= maxLeft - 4 : left <= 4;
        button.disabled = shouldDisable;
      });
    };

    tracks.forEach((track) => {
      track.addEventListener("scroll", () => syncTrackButtons(track), { passive: true });
      syncTrackButtons(track);
    });

    window.addEventListener("resize", () => {
      tracks.forEach((track) => syncTrackButtons(track));
    });
  };

  const detectContactGoalByHref = (href) => {
    if (!href) return "";
    const normalized = href.trim().toLowerCase();
    if (normalized.startsWith("tel:")) return "contact_phone_click";
    if (normalized.startsWith("mailto:")) return "contact_email_click";
    if (normalized.includes("wa.me/") || normalized.includes("whatsapp")) return "contact_whatsapp_click";
    if (normalized.includes("t.me/") || normalized.includes("telegram")) return "contact_telegram_click";
    return "";
  };

  const initTrackingListeners = () => {
    doc.querySelectorAll("[data-track]").forEach((node) => {
      node.addEventListener("click", () => {
        const name = node.getAttribute("data-track");
        const page = getPageName();
        trackEvent(name, { page });
      });
    });

    doc.querySelectorAll("[data-ev]").forEach((node) => {
      node.addEventListener("click", () => {
        const name = (node.getAttribute("data-ev") || "").trim();
        if (!name) {
          return;
        }
        const page = getPageName();
        trackEvent(name, { page });
      });
    });

    doc.addEventListener("click", (event) => {
      const target = event.target && event.target.closest
        ? event.target.closest("a[href], button, [role='button'], input[type='submit'], input[type='button']")
        : null;
      if (!target) {
        return;
      }
      if (target.hasAttribute("data-track") || target.hasAttribute("data-ev")) {
        return;
      }
      const tag = target.tagName.toLowerCase();
      const href = target.getAttribute("href") || "";
      const page = getPageName();
      const basePayload = {
        page,
        label: nodeText(target),
        id: trimValue(target.id, 60),
        cls: trimValue(String(target.className || ""), 120),
      };

      if (tag === "a") {
        const contactGoal = detectContactGoalByHref(href);
        if (contactGoal) {
          trackEvent(contactGoal, { ...basePayload, href: trimValue(href, 180) });
          return;
        }
        trackEvent("ui_link_click", { ...basePayload, href: trimValue(href, 180) });
        return;
      }

      trackEvent("ui_button_click", basePayload);
    });

    doc.addEventListener(
      "submit",
      (event) => {
        const form = event.target && event.target.closest ? event.target.closest("form") : null;
        if (!form) return;
        const page = getPageName();
        const action = trimValue(form.getAttribute("action") || "", 180);
        trackEvent("form_submit_any", {
          page,
          form_id: trimValue(form.id, 80),
          form_name: trimValue(form.getAttribute("name") || "", 80),
          form_action: action,
        });
      },
      true
    );
  };

  const initNonCritical = () => {
    initReveal();
    initStickyHeader();
    initScrollableTracks();
    initTrackingListeners();
    runWhenIdle(initAnalytics, isMobileRuntime ? 400 : 900);

    if (!isMobileRuntime && !safeMode) {
      initParallax();
      initSchastyeEffects();
      initRadostEffects();
      initTiltCards();
      return;
    }

    initSchastyeEffects();
    initRadostEffects();
  };

  runWhenIdle(initNonCritical, isMobileRuntime ? 160 : 320);
})();
