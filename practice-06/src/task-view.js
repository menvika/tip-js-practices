const PRIORITY_LABELS = Object.freeze({ low: "Низкий", medium: "Средний", high: "Высокий" });

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(action, label) {
  const button = element("button", "button-secondary");
  button.type = "button";
  button.dataset.action = action;
  button.append(element("span", "action-label", label));
  return button;
}

export function createTaskElement(task, category) {
  const item = element("li", "task-card");
  item.dataset.taskId = String(task.id);
  if (task.completed) item.classList.add("is-completed");

  const heading = element("h3", "task-title", task.title);
  const status = element("p", "task-status", task.completed ? "Статус: выполнена" : "Статус: в работе");
  const details = element("p", "task-details");
  const priority = element("span", "task-priority", `Приоритет: ${PRIORITY_LABELS[task.priority] ?? task.priority}`);
  const categoryNode = element("span", "task-category", category?.name ?? "Неизвестная категория");
  details.append(priority, document.createTextNode(" · "), categoryNode);
  const actions = element("div", "task-actions");
  actions.append(
    actionButton("toggle", task.completed ? "Вернуть в работу" : "Отметить выполненной"),
    actionButton("edit", "Изменить"),
    actionButton("delete", "Удалить"),
  );
  item.append(heading, status, details, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const nodes = tasks.map((task) => createTaskElement(task, categoryById.get(task.categoryId)));
  list.replaceChildren(...nodes);
}
