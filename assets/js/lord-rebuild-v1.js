(function () {
  var doc = document;
  var win = window;
  var body = doc.body;
  var startedAt = Date.now();
  var rumSent = false;
  var resourceErrorCount = 0;
  var metrics = {
    page: body ? body.getAttribute('data-page') || 'unknown' : 'unknown',
    domcontentloaded_ms: null,
    first_form_ready_ms: null,
    resource_error_count: 0
  };

  function qs(selector, root) {
    return (root || doc).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || doc).querySelectorAll(selector));
  }

  function nowMs() {
    if (win.performance && typeof win.performance.now === 'function') {
      return Math.round(win.performance.now());
    }
    return Date.now() - startedAt;
  }

  function setDomLoadedMark() {
    if (metrics.domcontentloaded_ms === null) {
      metrics.domcontentloaded_ms = nowMs();
    }
  }

  function setFormReadyMark() {
    if (metrics.first_form_ready_ms !== null) {
      return;
    }
    if (qs('form[data-lead-form]')) {
      metrics.first_form_ready_ms = nowMs();
    }
  }

  function trim(value, max) {
    return String(value || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').slice(0, max || 240);
  }

  function setStatus(form, message, isError) {
    var node = qs('.form-status', form);
    if (!node) {
      node = doc.createElement('div');
      node.className = 'form-status';
      form.appendChild(node);
    }
    node.textContent = message || '';
    node.className = isError ? 'form-status is-error' : 'form-status';
  }

  function serializeForm(form) {
    return {
      name: trim((qs('[name="name"]', form) || {}).value || '', 120),
      contact: trim((qs('[name="contact"]', form) || {}).value || '', 160),
      format: trim((qs('[name="format"]', form) || {}).value || '', 160),
      message: trim((qs('[name="message"]', form) || {}).value || '', 900),
      direction: trim((qs('[name="direction"]', form) || {}).value || metrics.page, 64),
      page: metrics.page,
      source: 'website',
      submitted_at: new Date().toISOString()
    };
  }

  function validatePayload(payload) {
    if (!payload.name) return 'Укажите имя.';
    if (!payload.contact) return 'Укажите телефон или мессенджер.';
    if (!payload.format) return 'Укажите формат события.';
    return '';
  }

  function sendLead(form) {
    var payload = serializeForm(form);
    var endpoint = form.getAttribute('data-endpoint') || '/api/lead';
    var submit = qs('button[type="submit"], input[type="submit"]', form);
    var xhr = new XMLHttpRequest();
    var error = validatePayload(payload);

    if (error) {
      setStatus(form, error, true);
      return;
    }

    if (submit) {
      submit.disabled = true;
    }
    setStatus(form, 'Спасибо. Готовим ответ с направлением и следующими шагами.', false);

    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      if (submit) {
        submit.disabled = false;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus(form, 'Спасибо. Мы свяжемся и предложим 2–3 варианта под ваш формат.', false);
        form.reset();
      } else {
        setStatus(form, 'Не удалось отправить заявку. Напишите нам в Telegram или WhatsApp.', true);
      }
    };
    xhr.onerror = function () {
      if (submit) {
        submit.disabled = false;
      }
      setStatus(form, 'Ошибка сети. Напишите нам в Telegram или WhatsApp.', true);
    };
    xhr.send(JSON.stringify(payload));
  }

  function initForms() {
    qsa('form[data-lead-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        sendLead(form);
      });
    });
    setFormReadyMark();
  }

  function closeNav(toggle) {
    body.classList.remove('nav-open');
    body.classList.remove('no-scroll');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function initNav() {
    var toggle = qs('.menu-toggle');
    var nav = qs('.app-nav');
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      body.classList.toggle('nav-open', !expanded);
      body.classList.toggle('no-scroll', !expanded);
    });

    qsa('a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav(toggle);
      });
    });

    doc.addEventListener('click', function (event) {
      if (!body.classList.contains('nav-open')) {
        return;
      }
      if (toggle.contains(event.target) || nav.contains(event.target)) {
        return;
      }
      closeNav(toggle);
    });
  }

  function initFormatButtons() {
    qsa('[data-format-pick]').forEach(function (button) {
      button.addEventListener('click', function () {
        var targetSelector = button.getAttribute('data-form-target') || '#lead-form';
        var form = qs(targetSelector) || qs('form[data-lead-form]');
        var input;
        if (!form) {
          return;
        }
        input = qs('[name="format"]', form);
        if (input) {
          input.value = button.getAttribute('data-format-pick') || '';
          if (typeof input.focus === 'function') {
            input.focus();
          }
        }
        if (form.id) {
          win.location.hash = form.id;
        }
      });
    });
  }

  function initCardLinks() {
    qsa('[data-card-link]').forEach(function (card) {
      card.addEventListener('click', function (event) {
        var interactive = event.target.closest('a, button, input, textarea, select, summary');
        var href = card.getAttribute('data-card-link');
        if (interactive || !href) {
          return;
        }
        win.location.href = href;
      });
    });
  }

  function sendRum(reason) {
    var payload;
    var xhr;
    if (rumSent) {
      return;
    }
    rumSent = true;
    metrics.resource_error_count = resourceErrorCount;
    payload = JSON.stringify({
      reason: reason,
      page: metrics.page,
      domcontentloaded_ms: metrics.domcontentloaded_ms,
      first_form_ready_ms: metrics.first_form_ready_ms,
      resource_error_count: metrics.resource_error_count,
      url: win.location.href,
      ua: navigator.userAgent
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/rum', new Blob([payload], { type: 'application/json' }));
        return;
      }
    } catch (error) {}

    try {
      xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/rum', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    } catch (error2) {}
  }

  doc.addEventListener('DOMContentLoaded', function () {
    setDomLoadedMark();
    initNav();
    initCardLinks();
    initFormatButtons();
    initForms();
    qsa('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
    win.requestAnimationFrame(function () {
      body.classList.add('is-ready');
    });
  });

  win.addEventListener('error', function (event) {
    if (event && event.target && event.target !== win && event.target.tagName) {
      resourceErrorCount += 1;
    }
  }, true);

  win.addEventListener('pagehide', function () {
    setFormReadyMark();
    sendRum('pagehide');
  }, { once: true });
})();
