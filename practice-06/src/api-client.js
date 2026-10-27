export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) throw new TypeError("baseUrl обязателен.");
  let url;
  try { url = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new TypeError("baseUrl должен быть HTTP(S)-адресом без query и hash.");
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href.replace(/\/$/, "");
}

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  const base = normalizeBaseUrl(baseUrl);
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("?") || path.includes("#")) {
    throw new TypeError("path должен быть путём, начинающимся с одного символа /, без query и hash.");
  }
  if (!query || typeof query !== "object" || Array.isArray(query)) throw new TypeError("query должен быть объектом.");
  const url = new URL(`${base}/${path.replace(/^\/+/, "")}`);
  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null || raw === "") continue;
    if (typeof raw === "object") throw new TypeError(`Недопустимое значение query-параметра ${key}.`);
    url.searchParams.append(key, String(raw));
  }
  return url.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError("timeoutMs должен быть положительным числом.");

  async function requestJson(path, { method = "GET", query = {}, body, signal, timeoutMs: requestTimeoutMs = timeoutMs } = {}) {
    const normalizedMethod = String(method).toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(normalizedMethod)) throw new TypeError("Неподдерживаемый HTTP-метод.");
    if (normalizedMethod === "GET" && body !== undefined) throw new TypeError("GET не поддерживает body.");
    if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) throw new TypeError("timeoutMs должен быть положительным числом.");
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError("signal должен быть AbortSignal.");

    const url = buildUrl(normalizedBaseUrl, path, query);
    const controller = new AbortController();
    let timeoutTriggered = false;
    let externalTriggered = false;
    const abortFromExternal = () => {
      externalTriggered = true;
      controller.abort(signal?.reason);
    };
    if (signal?.aborted) abortFromExternal();
    else signal?.addEventListener("abort", abortFromExternal, { once: true });

    const timer = setTimeout(() => {
      timeoutTriggered = true;
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, requestTimeoutMs);

    const headers = new Headers({ Accept: "application/json" });
    const options = { method: normalizedMethod, headers, signal: controller.signal };
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
      options.body = JSON.stringify(body);
    }

    try {
      let response;
      try {
        response = await fetchFn(url, options);
      } catch (cause) {
        if (timeoutTriggered) throw new ApiError("Время ожидания запроса истекло.", { kind: "timeout", url, cause });
        if (externalTriggered || signal?.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
        throw new ApiError("Не удалось выполнить сетевой запрос.", { kind: "network", url, cause });
      }

      if (!response.ok) {
        let payload = null;
        try {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.toLowerCase().includes("application/json")) payload = await response.json();
        } catch { /* HTTP-статус важнее неразбираемого тела ошибки. */ }
        const info = payload?.error ?? {};
        throw new ApiError(info.message || `HTTP ${response.status}`, {
          kind: "http", status: response.status, code: info.code ?? null,
          details: info.details ?? null, url,
        });
      }
      if (response.status === 204) return null;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().split(";")[0].trim().match(/^application\/(?:[a-z0-9.+-]+\+)?json$/)) {
        throw new ApiError("Сервер вернул ответ не в формате JSON.", { kind: "invalid-response", status: response.status, url });
      }
      try {
        return await response.json();
      } catch (cause) {
        throw new ApiError("Сервер вернул некорректный JSON.", { kind: "invalid-response", status: response.status, url, cause });
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abortFromExternal);
    }
  }

  return { requestJson };
}
