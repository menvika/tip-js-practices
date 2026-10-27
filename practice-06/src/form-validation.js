const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
export function validateTaskDraft(draft, categories) {
  const source = draft && typeof draft === "object" ? draft : {};
  const knownCategories = Array.isArray(categories) ? categories : [];
  const title = typeof source.title === "string" ? source.title.trim() : "";
  const priority = source.priority;
  const categoryId = typeof source.categoryId === "number" ? source.categoryId
    : typeof source.categoryId === "string" && source.categoryId.trim() ? Number(source.categoryId) : NaN;
  const errors = {};

  if (!title || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !knownCategories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  if (Object.keys(errors).length) return { valid: false, value: null, errors };
  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
