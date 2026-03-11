const PRIMARY_HOST = "lord-event.ru";
const REDIRECT_HOSTS = new Set(["www.lord-event.ru"]);
const MOBILE_RELEASE = "v1";
const MOBILE_ROOT_RELEASE = "v2";
const MOBILE_RELEASE_ROOT = `/mobile/versions/${MOBILE_RELEASE}`;
const MOBILE_ROOT_RELEASE_ROOT = `/mobile/versions/${MOBILE_ROOT_RELEASE}`;
const ROUTE_DEFINITIONS = [
  {
    canonicalPath: "/",
    aliases: ["/", "/index.html"],
    desktop: "/index.html",
    mobile: "/index.html",
    mobileAsset: `${MOBILE_ROOT_RELEASE_ROOT}/index.html`,
  },
  {
    canonicalPath: "/love/",
    aliases: ["/love", "/love/", "/love/index.html"],
    desktop: "/love/index.html",
    mobile: "/love/index.html",
    mobileAsset: "/love/index.html",
  },
  {
    canonicalPath: "/schastye/",
    aliases: ["/schastye", "/schastye/", "/schastye/index.html"],
    desktop: "/schastye/index.html",
    mobile: "/schastye/index.html",
    mobileAsset: "/schastye/index.html",
  },
  {
    canonicalPath: "/radost/",
    aliases: ["/radost", "/radost/", "/radost/index.html"],
    desktop: "/radost/index.html",
    mobile: "/radost/index.html",
    mobileAsset: "/radost/index.html",
  },
];

const buildMobileReleasePath = (pathname) => `${MOBILE_RELEASE_ROOT}${pathname}`;
const getMobileAssetPath = (route) => route.mobileAsset || buildMobileReleasePath(route.mobile);

const HTML_VARIANTS = new Map(
  ROUTE_DEFINITIONS.flatMap((route) => route.aliases.map((alias) => [alias, route]))
);

const INTERNAL_MOBILE_REDIRECTS = new Map(
  [
    ...ROUTE_DEFINITIONS.map((route) => [getMobileAssetPath(route), route.canonicalPath]),
    [`${MOBILE_RELEASE_ROOT}/index.html`, "/"],
    [`${MOBILE_RELEASE_ROOT}/love/index.html`, "/love/"],
    [`${MOBILE_RELEASE_ROOT}/schastye/index.html`, "/schastye/"],
    [`${MOBILE_RELEASE_ROOT}/radost/index.html`, "/radost/"],
  ]
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const emptyOk = (headers = {}) =>
  new Response(null, {
    status: 204,
    headers: { ...corsHeaders, ...headers },
  });

const formatValue = (value) => (value ? String(value).trim() : "");

const buildCanonicalUrl = (url) => {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = PRIMARY_HOST;
  return target;
};

const getViewOverride = (url) => {
  const raw = (url.searchParams.get("view") || "").toLowerCase();
  if (raw === "mobile" || raw === "m") return "mobile";
  if (raw === "desktop" || raw === "d") return "desktop";
  return "";
};

const isMobileRequest = (request, url) => {
  const override = getViewOverride(url);
  if (override === "mobile") return true;
  if (override === "desktop") return false;

  const chMobile = request.headers.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return true;
  if (chMobile === "?0") return false;

  const userAgent = request.headers.get("user-agent") || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|CriOS|FxiOS|SamsungBrowser|Instagram|FBAN|FBAV|Line\//i.test(
    userAgent
  );
};

const getVariantAssetPath = (route, view) =>
  view === "mobile" ? getMobileAssetPath(route) : route.desktop;

const getVariantLabel = (route, view) => {
  if (view !== "mobile") {
    return "desktop";
  }

  return route.canonicalPath === "/"
    ? `mobile-root-${MOBILE_ROOT_RELEASE}`
    : `mobile-${MOBILE_RELEASE}`;
};

const getInternalMobileRedirectPath = (pathname) => {
  if (pathname === "/mobile" || pathname === "/mobile/") {
    return "/";
  }

  const mappedPath = INTERNAL_MOBILE_REDIRECTS.get(pathname);
  if (mappedPath) {
    return mappedPath;
  }

  const versionedMatch = pathname.match(/^\/mobile\/versions\/[^/]+(\/.*)$/);
  if (versionedMatch) {
    return versionedMatch[1] || "/";
  }

  return pathname.replace(/^\/mobile/, "") || "/";
};

const withVariantHeaders = (response, route, view) => {
  const headers = new Headers(response.headers);
  headers.set("Vary", "User-Agent, Sec-CH-UA-Mobile");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Lord-HTML-Variant", getVariantLabel(route, view));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const fetchVariantAsset = async (env, request, pathname) => {
  let target = new URL(request.url);
  target.pathname = pathname;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await env.ASSETS.fetch(new Request(target.toString(), request));
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      target = new URL(location, target);
      continue;
    }
    return response;
  }

  return env.ASSETS.fetch(new Request(target.toString(), request));
};

const getRedirectResponse = (url) => {
  const hostname = (url.hostname || "").toLowerCase();
  const needsHostRedirect = REDIRECT_HOSTS.has(hostname);
  const needsProtocolRedirect = url.protocol !== "https:";

  if (!needsHostRedirect && !needsProtocolRedirect) {
    return null;
  }

  const target = buildCanonicalUrl(url);
  if (target.toString() === url.toString()) {
    return null;
  }

  return Response.redirect(target.toString(), 301);
};

const buildMessage = (payload) => {
  const lines = ["New lead from site"];

  const name = formatValue(payload.name);
  const contact = formatValue(payload.contact);
  const format = formatValue(payload.format);
  const message = formatValue(payload.message);
  const direction = formatValue(payload.direction);
  const page = formatValue(payload.page);
  const submittedAt = formatValue(payload.submitted_at);

  if (direction) lines.push(`Direction: ${direction}`);
  if (name) lines.push(`Name: ${name}`);
  if (contact) lines.push(`Contact: ${contact}`);
  if (format) lines.push(`Format: ${format}`);
  if (message) lines.push(`Message: ${message}`);
  if (page) lines.push(`Page: ${page}`);
  if (submittedAt) lines.push(`Submitted: ${submittedAt}`);

  return lines.join("\n");
};

const parseRumPayload = async (request) => {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  try {
    if (contentType.includes("application/json")) {
      return await request.json();
    }

    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return { parse_error: true };
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const redirect = getRedirectResponse(url);
    const route = HTML_VARIANTS.get(url.pathname);

    if (redirect) {
      return redirect;
    }

    if (url.pathname.startsWith("/mobile/")) {
      const clean = buildCanonicalUrl(url);
      clean.pathname = getInternalMobileRedirectPath(url.pathname);
      return Response.redirect(clean.toString(), 302);
    }

    if (route && (request.method === "GET" || request.method === "HEAD")) {
      const view = isMobileRequest(request, url) ? "mobile" : "desktop";
      const assetResponse = await fetchVariantAsset(env, request, getVariantAssetPath(route, view));
      return withVariantHeaders(assetResponse, route, view);
    }

    if (url.pathname === "/api/rum" && request.method === "OPTIONS") {
      return emptyOk();
    }

    if (url.pathname === "/api/rum") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
      }

      const payload = await parseRumPayload(request);
      console.log(
        JSON.stringify({
          type: "rum",
          host: url.hostname,
          path: url.pathname,
          payload,
        })
      );
      return emptyOk({ "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/lead" && request.method === "OPTIONS") {
      return emptyOk();
    }

    if (url.pathname !== "/api/lead") {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response("Missing Telegram configuration", { status: 500 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return new Response("Invalid JSON", { status: 400 });
    }

    const text = buildMessage(payload);
    if (!text) {
      return new Response("Empty payload", { status: 400 });
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
      }
    );

    if (!telegramResponse.ok) {
      return new Response("Telegram delivery failed", { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};
