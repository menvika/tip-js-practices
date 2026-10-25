
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

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой");
  }

  let base;

  try {
    base = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new TypeError("Поддерживаются только HTTP и HTTPS");
  }

  if (base.search || base.hash) {
    throw new TypeError("baseUrl не должен содержать query или hash");
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = String(path).replace(/^\/+/, "");
  const url = new URL(`${normalizedBase}/${normalizedPath}`);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.append(key, String(value));
  }

  url.search = params.toString();

  return url.toString();
}

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("Необходимо указать baseUrl");
  }

  let parsedBase;

  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL");
  }

  if (
    parsedBase.protocol !== "http:" &&
    parsedBase.protocol !== "https:"
  ) {
    throw new TypeError("Поддерживаются только HTTP и HTTPS");
  }

  if (parsedBase.search || parsedBase.hash) {
    throw new TypeError("baseUrl не должен содержать query или hash");
  }

  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией");
  }

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  async function requestJson(path, {
    query = {},
    signal: externalSignal,
    timeoutMs: requestTimeoutMs = timeoutMs,
  } = {}) {
    if (
      !Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs <= 0
    ) {
      throw new TypeError(
        "timeoutMs должен быть положительным целым числом",
      );
    }

    const url = buildUrl(normalizedBaseUrl, path, query);
    const controller = new AbortController();

    let timedOut = false;
    let externallyAborted = false;

    const onExternalAbort = () => {
      externallyAborted = true;
      controller.abort(externalSignal.reason);
    };

    if (externalSignal !== undefined) {
      if (
        typeof externalSignal !== "object" ||
        typeof externalSignal.aborted !== "boolean" ||
        typeof externalSignal.addEventListener !== "function"
      ) {
        throw new TypeError("signal должен быть AbortSignal");
      }

      if (externalSignal.aborted) {
        externallyAborted = true;
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener("abort", onExternalAbort, {
          once: true,
        });
      }
    }

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("Превышено время ожидания запроса"));
    }, requestTimeoutMs);

    let response;

    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (cause) {
      if (timedOut) {
        throw new ApiError(
          "Превышено время ожидания запроса",
          { kind: "timeout", url, cause },
        );
      }

      if (externallyAborted) {
        throw new ApiError(
          "Запрос отменён",
          { kind: "aborted", url, cause },
        );
      }

      throw new ApiError(
        "Не удалось выполнить сетевой запрос",
        { kind: "network", url, cause },
      );
    } finally {
      clearTimeout(timer);

      if (externalSignal !== undefined) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    }

    if (typeof Response === "undefined" || !(response instanceof Response)) {
      throw new ApiError(
        "fetchFn вернул значение, не являющееся Response",
        { kind: "invalid-response", url },
      );
    }

    if (!response.ok) {
      let payload = null;

      try {
        payload = await response.clone().json();
      } catch {
        // Тело ошибки может отсутствовать или содержать невалидный JSON.
      }

      const apiError =
        payload &&
        typeof payload === "object" &&
        payload.error &&
        typeof payload.error === "object"
          ? payload.error
          : {};

      const message =
        typeof apiError.message === "string"
          ? apiError.message
          : `HTTP-ошибка: ${response.status}`;

      throw new ApiError(message, {
        kind: "http",
        status: response.status,
        code: apiError.code ?? null,
        details: apiError.details ?? null,
        url,
      });
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("Content-Type") ?? "";

    if (!/(?:application\/json|\/[^;]+\+json)(?:\s*;|$)/i.test(contentType)) {
      throw new ApiError(
        "Сервер вернул ответ не в формате JSON",
        { kind: "invalid-response", url },
      );
    }

    try {
      return await response.json();
    } catch (cause) {
      throw new ApiError(
        "Не удалось разобрать JSON ответа",
        { kind: "invalid-response", url, cause },
      );
    }
  }

  return { requestJson };
}
