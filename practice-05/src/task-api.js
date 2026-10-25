import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson");
  }

  
function normalizeFilters(filters = {}) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом");
  }

  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}`);
    }
  }

  const result = {};


    if (filters.completed !== undefined) {
      if (typeof filters.completed !== "boolean") {
        throw new TypeError("completed должен быть true или false");
      }
      result.completed = filters.completed;
    }

    if (filters.priority !== undefined) {
      if (!ALLOWED_PRIORITIES.has(filters.priority)) {
        throw new TypeError("Недопустимый priority");
      }
      result.priority = filters.priority;
    }

    if (filters.categoryId !== undefined) {
      if (!isPositiveSafeInteger(filters.categoryId)) {
        throw new TypeError("categoryId должен быть положительным целым числом");
      }
      result.categoryId = filters.categoryId;
    }

    if (filters.q !== undefined) {
      if (typeof filters.q !== "string" || filters.q.trim().length > 100) {
        throw new TypeError("q должен быть строкой длиной не более 100 символов");
      }
      if (filters.q.trim() !== "") {
        result.q = filters.q.trim();
      }
    }

    return result;
  }

  function validateUniqueIds(items, label) {
    const ids = new Set();

    for (const item of items) {
      if (ids.has(item.id)) {
        throw invalidResponse(`Повторяется id ${label}: ${item.id}`);
      }
      ids.add(item.id);
    }
  }

  function validateMeta(meta, count) {
    if (
      !meta ||
      typeof meta !== "object" ||
      !Number.isSafeInteger(meta.total) ||
      meta.total < 0 ||
      meta.total !== count
    ) {
      throw invalidResponse("Некорректное значение meta.total");
    }
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });

    if (!payload || !Array.isArray(payload.data)) {
      throw invalidResponse("Ответ со списком задач имеет неверный формат");
    }

    if (!payload.data.every(isTask)) {
      throw invalidResponse("Ответ содержит некорректную задачу");
    }

    validateUniqueIds(payload.data, "задач");
    validateMeta(payload.meta, payload.data.length);

    return {
      tasks: payload.data,
      meta: payload.meta,
    };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом");
    }

    const payload = await client.requestJson(`/tasks/${id}`);

    if (!payload || !isTask(payload.data) || payload.data.id !== id) {
      throw invalidResponse("Ответ с задачей имеет неверный формат");
    }

    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");

    if (!payload || !Array.isArray(payload.data)) {
      throw invalidResponse("Ответ со списком категорий имеет неверный формат");
    }

    if (!payload.data.every(isCategory)) {
      throw invalidResponse("Ответ содержит некорректную категорию");
    }

    validateUniqueIds(payload.data, "категорий");
    validateMeta(payload.meta, payload.data.length);

    return payload.data;
  }

  async function loadInitialData(filters = {}) {
    const [tasksResult, categories] = await Promise.all([
      getTasks(filters),
      getCategories(),
    ]);

    return {
      tasks: tasksResult.tasks,
      categories,
      meta: tasksResult.meta,
    };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
  };
}

