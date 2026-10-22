import { getTaskStats } from "./task-service.js";

const priorities = { low: "Низкий", medium: "Средний", high: "Высокий" };

export function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-card${task.completed ? " is-completed" : ""}`;
  item.dataset.taskId = String(task.id);
  const heading = document.createElement("h3");
  heading.className = "task-title";
  heading.textContent = task.title;
  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";
  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = priorities[task.priority];
  item.append(heading, status, priority);
  const actions = [
    ["toggle", task.completed ? "Вернуть в работу" : "Выполнена"],
    ["edit", "Изменить"],
    ["delete", "Удалить"],
  ];
  for (const [action, label] of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    if (action === "toggle") button.setAttribute("aria-pressed", String(task.completed));
    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;
    button.append(span);
    item.append(button);
  }
  return item;
}
export function renderTaskList(listElement, tasks) {
  listElement.replaceChildren(...tasks.map(createTaskElement));
}
export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  for (const [key, value] of Object.entries({
    total: stats.total, completed: stats.completed, pending: stats.pending,
    progress: `${stats.progress.toFixed(1)}%`, visible: visibleCount,
  })) {
    const element = summaryElement.querySelector(`[data-stat="${key}"]`);
    if (element) element.textContent = String(value);
  }
}
export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0) messageElement.textContent = "Задач пока нет. Добавьте первую задачу.";
  else if (visibleCount === 0) messageElement.textContent = "Нет задач, соответствующих выбранному фильтру.";
  else messageElement.textContent = "";
  messageElement.hidden = visibleCount > 0;
}
