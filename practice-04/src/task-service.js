const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const validId = (id) => Number.isSafeInteger(id) && id > 0;
const validTitle = (title) => typeof title === "string" && title.trim().length >= 1 && title.trim().length <= 100;

export function createTask(id, title, priority = "medium") {
  if (!validId(id)) return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  if (!validTitle(title)) return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
  if (!ALLOWED_PRIORITIES.has(priority)) return { ok: false, error: "Недопустимый приоритет" };
  return { ok: true, task: { id, title: title.trim(), completed: false, priority } };
}
export function findTaskById(tasks, id) { return tasks.find((task) => task.id === id); }
export function getPendingTasks(tasks) { return tasks.filter((task) => !task.completed); }
export function getTaskTitles(tasks) { return tasks.map((task) => task.title); }
export function getTaskStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  return { total, completed, pending: total - completed, progress: total ? completed / total * 100 : 0 };
}
export function addTask(tasks, id, title, priority = "medium") {
  const result = createTask(id, title, priority);
  if (!result.ok) return result;
  if (findTaskById(tasks, id)) return { ok: false, error: "Задача с таким id уже существует" };
  return { ok: true, tasks: [...tasks, result.task] };
}
export function setTaskCompleted(tasks, id, completed) {
  if (typeof completed !== "boolean") return { ok: false, error: "completed должен быть true или false" };
  if (!validId(id) || !findTaskById(tasks, id)) return { ok: false, error: "Задача не найдена" };
  return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, completed } : task) };
}
export function renameTask(tasks, id, title) {
  if (!validId(id) || !findTaskById(tasks, id)) return { ok: false, error: "Задача не найдена" };
  if (!validTitle(title)) return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
  return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, title: title.trim() } : task) };
}
export function removeTask(tasks, id) {
  if (!validId(id) || !findTaskById(tasks, id)) return { ok: false, error: "Задача не найдена" };
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
export function updateTask(tasks, id, title, priority) {
  if (!validId(id) || !findTaskById(tasks, id)) return { ok: false, error: "Задача не найдена" };
  if (!validTitle(title)) return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
  if (!ALLOWED_PRIORITIES.has(priority)) return { ok: false, error: "Недопустимый приоритет" };
  return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, title: title.trim(), priority } : task) };
}
