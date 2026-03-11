(() => {
  const MAIN_FORM_IDS = new Set(["form1849650653_new", "form1849650653", "form1841241923"]);
  const LEAD_ENDPOINT = "/api/lead";
  const supportsMatchMedia = typeof window.matchMedia === "function";
  const prefersReducedMotion = supportsMatchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const trimValue = (value, maxLen = 240) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLen);
  const onlyDigits = (value) => String(value || "").replace(/\D+/g, "");
  const firstFilledByNames = (form, names) => {
    for (const name of names) {
      const field = form.querySelector(`[name='${name}']`);
      const value = field ? String(field.value || "").trim() : "";
      if (value) return value;
    }
    return "";
  };

  const formatRuPhone = (digits) => {
    if (!digits) return "";
    let normalized = digits;

    if (normalized.startsWith("8")) {
      normalized = `7${normalized.slice(1)}`;
    }

    if (normalized.startsWith("7")) {
      const local = normalized.slice(1, 11);
      const p1 = local.slice(0, 3);
      const p2 = local.slice(3, 6);
      const p3 = local.slice(6, 8);
      const p4 = local.slice(8, 10);
      if (!p1) return "+7";
      if (!p2) return `+7 (${p1}`;
      if (!p3) return `+7 (${p1}) ${p2}`;
      if (!p4) return `+7 (${p1}) ${p2}-${p3}`;
      return `+7 (${p1}) ${p2}-${p3}-${p4}`;
    }

    return `+${normalized.slice(0, 15)}`;
  };

  const applyPhoneMask = (input) => {
    const raw = String(input.value || "");
    if (!raw || !/^[+\d()\s-]*$/.test(raw)) return;
    const digits = onlyDigits(raw);
    if (!digits) return;
    input.value = formatRuPhone(digits);
  };

  const enforceFormLayering = (rec) => {
    if (!rec) return;
    const cover = rec.querySelector(".t-cover");
    if (!cover) return;

    rec.style.setProperty("position", "relative", "important");
    rec.style.setProperty("isolation", "isolate", "important");
    cover.style.setProperty("position", "relative", "important");
    cover.style.setProperty("min-height", "100vh", "important");

    const carrier = rec.querySelector(".t-cover__carrier");
    const filter = rec.querySelector(".t-cover__filter");
    const wrapper = rec.querySelector(".t-cover__wrapper");
    const legacyForm = rec.querySelector(".t698");
    const customForm = rec.querySelector(".lord-capture");

    if (carrier) {
      carrier.style.setProperty("position", "absolute", "important");
      carrier.style.setProperty("inset", "0", "important");
      carrier.style.setProperty("z-index", "0", "important");
      carrier.style.setProperty("pointer-events", "none", "important");
    }

    if (filter) {
      filter.style.setProperty("position", "absolute", "important");
      filter.style.setProperty("inset", "0", "important");
      filter.style.setProperty("z-index", "1", "important");
      filter.style.setProperty("pointer-events", "none", "important");
    }

    if (wrapper) {
      wrapper.style.setProperty("position", "relative", "important");
      wrapper.style.setProperty("z-index", "50", "important");
      wrapper.style.setProperty("pointer-events", "auto", "important");
    }

    if (legacyForm) {
      legacyForm.style.setProperty("position", "relative", "important");
      legacyForm.style.setProperty("z-index", "90", "important");
      legacyForm.style.setProperty("pointer-events", "auto", "important");
    }

    if (customForm) {
      customForm.style.setProperty("position", "relative", "important");
      customForm.style.setProperty("z-index", "120", "important");
      customForm.style.setProperty("pointer-events", "auto", "important");
    }
  };

  const mountPrimaryLeadForm = () => {
    const rec = document.getElementById("rec1849650653");
    if (!rec) return false;
    const cover = rec.querySelector(".t-cover");
    if (!cover) return false;

    if (cover.querySelector("#form1849650653_new")) {
      rec.classList.add("lord-capture-mounted");
      enforceFormLayering(rec);
      return true;
    }

    const host = document.createElement("div");
    host.className = "lord-capture";
    host.innerHTML = `
      <div class="lord-capture__inner">
        <div class="lord-capture__panel">
          <h2 class="lord-capture__title">Оставьте заявку</h2>
          <p class="lord-capture__subtitle">Заполните форму, и мы свяжемся с вами в выбранном канале.</p>
          <form id="form1849650653_new" class="lord-capture__form" novalidate>
            <label class="lord-capture__field">
              <span>Имя</span>
              <input type="text" name="name" autocomplete="name" placeholder="Ваше имя" required />
            </label>
            <label class="lord-capture__field">
              <span>Соцсеть</span>
              <select name="network" required>
                <option value="">Выберите соцсеть</option>
                <option value="Telegram">Telegram</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="VK">VK</option>
              </select>
            </label>
            <label class="lord-capture__field">
              <span>Контакт в соцсети</span>
              <input type="text" name="social_contact" placeholder="@username, ссылка или id" required />
            </label>
            <label class="lord-capture__field">
              <span>Номер телефона</span>
              <input type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="+7 (999) 000-00-00" required />
            </label>
            <label class="lord-capture__field lord-capture__field_full">
              <span>Желаемый формат</span>
              <input type="text" name="format" placeholder="Свадьба, корпоратив, день рождения..." required />
            </label>
            <div class="lord-capture__actions">
              <button type="submit" class="lord-capture__submit">Отправить</button>
            </div>
          </form>
        </div>
      </div>
    `;
    cover.appendChild(host);
    rec.classList.add("lord-capture-mounted");
    enforceFormLayering(rec);
    return true;
  };

  const ensureStatusNode = (form) => {
    let statusNode = form.querySelector(".js-lead-status");
    if (statusNode) return statusNode;

    statusNode = document.createElement("div");
    statusNode.className = "js-lead-status";
    statusNode.style.marginTop = "12px";
    statusNode.style.fontSize = "14px";
    statusNode.style.lineHeight = "1.45";
    statusNode.style.color = "#ffd700";
    form.appendChild(statusNode);
    return statusNode;
  };

  const setStatus = (form, text, isError = false) => {
    const statusNode = ensureStatusNode(form);
    statusNode.textContent = text;
    statusNode.style.color = isError ? "#ffb3b3" : "#ffd700";
  };

  const getPayload = (form) => {
    if (form.id === "form1849650653_new" || form.id === "form1849650653") {
      const name = trimValue(firstFilledByNames(form, ["name", "Name"]), 120);
      const network = trimValue(firstFilledByNames(form, ["network", "messenger-type", "Соцсеть"]), 32);
      const socialContact = trimValue(firstFilledByNames(form, ["social_contact", "messenger-id", "Контакт в соцсети"]), 160);
      const phone = trimValue(firstFilledByNames(form, ["phone", "Номер телефона", "Telefon", "contact"]), 120);
      const desiredFormat = trimValue(firstFilledByNames(form, ["format", "Желаемый формат"]), 120);
      const message = `Канал связи: ${network || "не указан"}. Контакт: ${socialContact || "не указан"}. Телефон: ${phone || "не указан"}.`;

      return {
        name: name || "Клиент",
        contact: phone,
        format: desiredFormat || "Главная форма",
        message,
        direction: "main",
        page: "main",
        source: "website",
        submitted_at: new Date().toISOString(),
      };
    }

    const phoneField = form.querySelector("[name='Telefon']");
    const phone = trimValue(phoneField ? phoneField.value : "", 120);
    return {
      name: "Клиент",
      contact: phone,
      format: "Быстрый звонок",
      message: "Попап форма " + form.id,
      direction: "main",
      page: "main",
      source: "website",
      submitted_at: new Date().toISOString(),
    };
  };

  const validatePayload = (form, payload) => {
    if (form.id === "form1849650653_new" || form.id === "form1849650653") {
      const network = trimValue(firstFilledByNames(form, ["network", "messenger-type", "Соцсеть"]), 32);
      const socialContact = trimValue(firstFilledByNames(form, ["social_contact", "messenger-id", "Контакт в соцсети"]), 160);
      if (!payload.name) return "Укажите имя.";
      if (!network) return "Выберите соцсеть.";
      if (!socialContact) return "Укажите контакт в соцсети.";
      if (!payload.contact) return "Укажите номер телефона.";
      if (!payload.format || payload.format === "Главная форма") return "Укажите желаемый формат мероприятия.";

      const rawPhone = payload.contact.replace(/\s+/g, "").replace(/[-()]/g, "");
      const isPhone = /^\+?[0-9]{10,15}$/.test(rawPhone);
      if (!isPhone) return "Укажите корректный номер телефона.";

      const isMessengerContact = /@|t\.me|telegram|tg|wa|whatsapp|vk|vkontakte|id\d+/i.test(socialContact);
      if (!isMessengerContact) return "Укажите корректный контакт соцсети (например, @username, t.me/... или vk.com/...).";
      return "";
    }

    if (!payload.contact) return "Укажите телефон.";
    return "";
  };

  const submitLead = async (form) => {
    const submitButton = form.querySelector("button[type='submit'], input[type='submit']");
    const payload = getPayload(form);
    const validationError = validatePayload(form, payload);

    if (validationError) {
      setStatus(form, validationError, true);
      return;
    }

    if (submitButton) submitButton.disabled = true;
    setStatus(form, "Отправляем заявку...");

    try {
      const endpoint = new URL(LEAD_ENDPOINT, window.location.origin).toString();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus(form, "Готово. Мы скоро свяжемся с вами.");
      form.reset();
    } catch (error) {
      setStatus(form, "Не удалось отправить автоматически. Повторите попытку через минуту.", true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  };

  const initMasks = () => {
    document
      .querySelectorAll(
        "#form1849650653_new [name='phone'], #form1849650653 [name='Номер телефона'], #form1849650653 [name='Telefon'], #form1849650653 [name='phone'], #form1841241923 [name='Telefon']"
      )
      .forEach((input) => {
        if (input.tagName !== "INPUT") return;
        const type = (input.getAttribute("type") || "").toLowerCase();
        if (type !== "tel" && type !== "text") return;
        input.setAttribute("inputmode", "tel");
        input.addEventListener("input", () => applyPhoneMask(input));
        input.addEventListener("blur", () => applyPhoneMask(input));
      });
  };

  const init = () => {
    mountPrimaryLeadForm();
    enforceFormLayering(document.getElementById("rec1849650653"));
    initMasks();

    document.addEventListener(
      "submit",
      (event) => {
        const form = event.target && event.target.closest ? event.target.closest("form") : null;
        if (!form || !MAIN_FORM_IDS.has(form.id)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        submitLead(form);
      },
      true
    );

    window.addEventListener(
      "load",
      () => {
        let attempts = 0;
        const timer = setInterval(() => {
          attempts += 1;
          const ok = mountPrimaryLeadForm();
          enforceFormLayering(document.getElementById("rec1849650653"));
          if (ok || attempts >= 20) clearInterval(timer);
        }, prefersReducedMotion ? 220 : 300);
      },
      { once: true }
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
