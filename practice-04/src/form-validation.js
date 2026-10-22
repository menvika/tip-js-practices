const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;
  if (editingId === null) {
    if (typeof draft.id !== "string" && typeof draft.id !== "number") {
      errors.id = "Введите положительный целый id.";
    } else if (String(draft.id).trim() === "" || !Number.isSafeInteger(Number(draft.id)) || Number(draft.id) <= 0) {
      errors.id = "Введите положительный безопасный целый id.";
    } else {
      id = Number(draft.id);
      if (tasks.some((task) => task.id === id)) errors.id = "Задача с таким id уже существует.";
    }
  } else {
    id = editingId;
    if (!Number.isSafeInteger(id) || id <= 0 || !tasks.some((task) => task.id === id)) {
      errors.id = "Редактируемая задача не найдена.";
    }
  }
  if (typeof draft.title !== "string" || draft.title.trim().length < 1 || draft.title.trim().length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов.";
  }
  if (!ALLOWED_PRIORITIES.has(draft.priority)) errors.priority = "Выберите допустимый приоритет.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { id, title: draft.title.trim(), priority: draft.priority } };
}
