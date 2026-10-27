import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(value && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string" && value.title.trim().length >= 1 && value.title.trim().length <= 100
    && typeof value.completed === "boolean" && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId));
}

export function isCategory(value) {
  return Boolean(value && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string" && value.name.trim().length >= 1 && value.name.trim().length <= 100);
}

function requireId(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным безопасным целым числом.");
}
function requireTask(task) {
  if (!isTask(task)) throw invalidResponse("Сервер вернул задачу неверной структуры.");
  return task;
}
function requireCategory(category) {
  if (!isCategory(category)) throw invalidResponse("Сервер вернул категорию неверной структуры.");
  return category;
}
function requireEnvelope(value, key) {
  if (!value || typeof value !== "object" || !(key in value)) throw invalidResponse(`Ответ сервера не содержит ${key}.`);
  return value[key];
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Ожидается клиент с методом requestJson.");

  async function getTasks(filters = {}, options = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("filters должен быть объектом.");
    for (const key of Object.keys(filters)) if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}`);
    const query = {};
    if (Object.hasOwn(filters, "completed")) {
      if (typeof filters.completed !== "boolean") throw new TypeError("completed должен быть boolean.");
      query.completed = filters.completed;
    }
    if (Object.hasOwn(filters, "priority")) {
      if (!ALLOWED_PRIORITIES.has(filters.priority)) throw new TypeError("Недопустимый priority.");
      query.priority = filters.priority;
    }
    if (Object.hasOwn(filters, "categoryId")) {
      if (!isPositiveSafeInteger(filters.categoryId)) throw new TypeError("categoryId должен быть положительным целым числом.");
      query.categoryId = filters.categoryId;
    }
    if (Object.hasOwn(filters, "q")) {
      if (typeof filters.q !== "string" || filters.q.trim().length > 100) throw new TypeError("q должен быть строкой длиной не более 100 символов.");
      if (filters.q.trim()) query.q = filters.q.trim();
    }
    const result = await client.requestJson("/tasks", { query, signal: options.signal });
    const data = requireEnvelope(result, "data");
    if (!Array.isArray(data)) throw invalidResponse("Список задач должен быть массивом.");
    data.forEach(requireTask);
    const meta = result.meta;
    if (!meta || !Number.isSafeInteger(meta.total) || meta.total < 0) throw invalidResponse("Метаданные списка задач имеют неверную структуру.");
    return { tasks: data, meta };
  }

  async function getTaskById(id, options = {}) {
    requireId(id);
    const result = await client.requestJson(`/tasks/${id}`, { signal: options.signal });
    return requireTask(requireEnvelope(result, "data"));
  }

  async function getCategories(options = {}) {
    const result = await client.requestJson("/categories", { signal: options.signal });
    const data = requireEnvelope(result, "data");
    if (!Array.isArray(data)) throw invalidResponse("Список категорий должен быть массивом.");
    data.forEach(requireCategory);
    if (!result.meta || result.meta.total !== data.length) throw invalidResponse("Метаданные категорий имеют неверную структуру.");
    return data;
  }

  async function loadInitialData(filters = {}, options = {}) {
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options), getCategories(options),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  async function createTask(draft, options = {}) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) throw new TypeError("draft должен быть объектом.");
    const result = await client.requestJson("/tasks", { method: "POST", body: draft, signal: options.signal });
    return requireTask(requireEnvelope(result, "data"));
  }

  async function updateTask(id, changes, options = {}) {
    requireId(id);
    if (!changes || typeof changes !== "object" || Array.isArray(changes) || !Object.keys(changes).length) throw new TypeError("changes должен быть непустым объектом.");
    const allowed = new Set(["title", "priority", "categoryId", "completed"]);
    for (const key of Object.keys(changes)) if (!allowed.has(key)) throw new TypeError(`Недопустимое поле: ${key}`);
    const result = await client.requestJson(`/tasks/${id}`, { method: "PATCH", body: changes, signal: options.signal });
    return requireTask(requireEnvelope(result, "data"));
  }

  async function setTaskCompleted(id, completed, options = {}) {
    if (typeof completed !== "boolean") throw new TypeError("completed должен быть boolean.");
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options = {}) {
    requireId(id);
    const result = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal: options.signal });
    if (result !== null) throw invalidResponse("DELETE должен возвращать пустой ответ 204.");
    return null;
  }

  async function resetDemoData(options = {}) {
    const result = await client.requestJson("/debug/reset", { method: "POST", signal: options.signal });
    const data = requireEnvelope(result, "data");
    if (data.reset !== true || !Number.isSafeInteger(data.total) || data.total < 0) throw invalidResponse("Ответ сброса имеет неверную структуру.");
    return data;
  }

  return { getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData };
}
