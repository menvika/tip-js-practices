import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"];
  if (!api || apiMethods.some((name) => typeof api[name] !== "function") || !view
      || ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"]
        .some((name) => typeof view[name] !== "function") || typeof validateDraft !== "function") {
    throw new TypeError("Для контроллера нужны API, представление и функция валидации.");
  }

  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let hasCategories = false;
  let activeLoad = null;
  let loadSequence = 0;
  let destroyed = false;

  function setList(tasksValue, meta) {
    tasks = tasksValue;
    view.setTasks(tasks, categories);
    view.setTotal(Number.isSafeInteger(meta?.total) ? meta.total : tasks.length);
    view.setListState(tasks.length ? "ready" : "empty");
  }

  async function loadCurrentTasks() {
    if (!hasCategories) return load(filters, true);
    return load(filters, false);
  }

  async function load(nextFilters = filters, initial = !hasCategories) {
    filters = { ...nextFilters };
    const sequence = ++loadSequence;
    if (activeLoad) activeLoad.abort();
    const controller = new AbortController();
    activeLoad = controller;
    view.setListState("loading");
    try {
      if (initial) {
        const result = await api.loadInitialData(filters, { signal: controller.signal });
        if (destroyed || sequence !== loadSequence) return;
        categories = result.categories;
        hasCategories = true;
        view.setCategories(categories);
        setList(result.tasks, result.meta);
      } else {
        const result = await api.getTasks(filters, { signal: controller.signal });
        if (destroyed || sequence !== loadSequence) return;
        setList(result.tasks, result.meta);
      }
    } catch (error) {
      if (destroyed || sequence !== loadSequence) return;
      if (error instanceof ApiError && error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    } finally {
      if (sequence === loadSequence) activeLoad = null;
    }
  }

  async function mutate(action, successMessage, afterSuccess = null) {
    view.setMutationPending(true);
    try {
      await action();
      if (afterSuccess) afterSuccess();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
    } catch (error) {
      view.notify(messageForError(error), "error");
    } finally {
      view.setMutationPending(false);
    }
  }

  return {
    start(initialFilters = {}) { return load(initialFilters, true); },
    applyFilters(nextFilters = {}) { return load(nextFilters, !hasCategories); },
    refresh() { return load(filters, !hasCategories); },
    async submit(draft) {
      const result = validateDraft(draft, categories);
      view.showFormErrors(result.errors);
      if (!result.valid) return;
      const value = result.value;
      if (editingId === null) {
        await mutate(() => api.createTask(value), "Задача создана.", () => view.setFormTask(null));
      } else {
        const id = editingId;
        await mutate(() => api.updateTask(id, value), "Изменения сохранены.", () => {
          editingId = null;
          view.setFormTask(null);
        });
      }
      view.showFormErrors({});
    },
    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      editingId = id;
      view.setFormTask(task);
      view.showFormErrors({});
    },
    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    },
    toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      return mutate(() => api.setTaskCompleted(id, !task.completed), task.completed ? "Задача возвращена в работу." : "Задача отмечена выполненной.");
    },
    deleteTask(id) {
      return mutate(() => api.deleteTask(id), "Задача удалена.", () => {
        if (editingId === id) { editingId = null; view.setFormTask(null); }
      });
    },
    resetData() {
      return mutate(() => api.resetDemoData(), "Учебные данные восстановлены.", () => {
        editingId = null;
        view.setFormTask(null);
      });
    },
    destroy() {
      destroyed = true;
      loadSequence += 1;
      activeLoad?.abort();
      activeLoad = null;
    },
  };
}
