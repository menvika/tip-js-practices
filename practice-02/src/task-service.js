// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.

export function createTask(id, title, priority = "medium") {
  const allowedPriorities = ["low", "medium", "high"];

  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "title должен быть непустой строкой" };
  }

  if (Number.isSafeInteger(id) === false || id <= 0) {
    return { ok: false, error: "id должен быть положительным целым числом" };
  }

  if (title.trim().length > 100) {
    return { ok: false, error: "длина title должна быть не больше 100" };
  }

  if (!allowedPriorities.includes(priority)) {
    return { ok: false, error: "priority должен быть low, medium или high" };
  }

  return {
    ok: true,
    task: {
      id: id,
      title: title.trim(),
      completed: false,
      priority: priority
    }
  };
  throw new Error("Не реализовано: createTask");
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id); 
  throw new Error("Не реализовано: findTaskById");
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
  throw new Error("Не реализовано: getTaskStats");
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) { return created; }
  if (tasks.some((task) => task.id === id)) {return { ok: false, error: `Задача с id=${id} уже существует` };}
  return { ok: true, tasks: [...tasks, created.task] };
  throw new Error("Не реализовано: addTask");
}

export function setTaskCompleted(tasks, id, completed) {
  if (completed !== true && completed !== false) {return { ok: false, error: "completed должен быть true или false" };}
  const target = findTaskById(tasks, id);
  if (target === undefined) {return { ok: false, error: `Задача с id=${id} не найдена` };}
  const updatedTasks = tasks.map((task) => task.id === id ? { ...task, completed } : task);
  return { ok: true, tasks: updatedTasks };
  throw new Error("Не реализовано: setTaskCompleted");
}

export function renameTask(tasks, id, title) {
  const target = findTaskById(tasks, id);
  if (target === undefined) { return { ok: false, error: `Задача с id=${id} не найдена` };}
  const checked = createTask(id, title, target.priority);
  if (!checked.ok) {return checked;}
  const updatedTasks = tasks.map((task) => task.id === id ? { ...task, title: checked.task.title } : task);
  return { ok: true, tasks: updatedTasks };
  throw new Error("Не реализовано: renameTask");
}

export function removeTask(tasks, id) {
  const target = findTaskById(tasks, id);
  if (target === undefined) {return { ok: false, error: `Задача с id=${id} не найдена` };}
  const updatedTasks = tasks.filter((task) => task.id !== id);
  return { ok: true, tasks: updatedTasks };
  throw new Error("Не реализовано: removeTask");
}
