import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

console.log("ПР2. Заготовка демонстрационного сценария");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);

// TODO: после реализации функций выполнить общий сценарий из раздела 6.5.
// Текущее состояние хранится в локальной переменной:
// let currentTasks = demoTasks;
// После успешной операции currentTasks получает result.tasks.
// При result.ok === false необходимо вывести ошибку, не заменяя состояние.
// Сводка выводится после каждого этапа; вычисления выполняются в task-service.js.
function printTasks(label, tasks) {
  console.log(`\n${label}:`);
  for (const t of tasks) {
    const mark = t.completed ? "[x]" : "[ ]";
    console.log(`  ${mark} id=${t.id} (${t.priority}) ${t.title}`);
  }
}

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`\n${label}:`);
  console.log(`  Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("  Задач пока нет");
  } else {
    console.log(`  Прогресс: ${progress.toFixed(1)}%`);
  }
}

function applyResult(label, result, currentTasks) {
  if (result.ok) {
    console.log(`\n${label}: OK`);
    return result.tasks;
  }
  console.error(`\n${label}: Ошибка — ${result.error}`);
  return currentTasks;
}

console.log("\n Общий сценарий (demoTasks) \n");
let currentTasks = demoTasks;
printTasks("Исходные задачи", currentTasks);
console.log("\nНазвания:", getTaskTitles(currentTasks));
console.log("Невыполненные id:", getPendingTasks(currentTasks).map((t) => t.id));
printStats("Исходная сводка", currentTasks);

currentTasks = applyResult(
  "addTask(20, 'Добавить проверку', 'high')",
  addTask(currentTasks, 20, "Добавить проверку", "high"),
  currentTasks
);
printStats("Сводка после добавления id=20", currentTasks);

currentTasks = applyResult(
  "setTaskCompleted(4, true)",
  setTaskCompleted(currentTasks, 4, true),
  currentTasks
);
printStats("Сводка после completed id=4", currentTasks);

currentTasks = applyResult(
  "renameTask(10, 'Подготовить инструкцию запуска')",
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
  currentTasks
);
printStats("Сводка после переименования id=10", currentTasks);

currentTasks = applyResult(
  "removeTask(7)",
  removeTask(currentTasks, 7),
  currentTasks
);
printStats("Сводка после удаления id=7", currentTasks);

console.log("\nПроверка отказа: повторное добавление id=20");
const failResult = addTask(currentTasks, 20, "Дубликат", "low");
if (failResult.ok) {
  console.error("Ошибка сценария: дубликат прошёл, хотя не должен был");
} else {
  console.log(`Ожидаемый отказ: ${failResult.error}`);
}

console.log("\nИтог общего сценария");
console.log("Итоговые id:", currentTasks.map((t) => t.id));
console.log("Итоговые задачи:");
for (const t of currentTasks) {
  console.log(`  id=${t.id} completed=${t.completed} priority=${t.priority} title="${t.title}"`);
}

console.log("\nСохранность demoTasks");
console.log("demoTasks id:", demoTasks.map((t) => t.id));
console.log("demoTasks length:", demoTasks.length);
console.log("demoTasks содержит id=7?", demoTasks.some((t) => t.id === 7));

// TODO: выполнить отдельный сценарий для variantTasks по разделу 7.
// Общий набор demoTasks не заменяется данными варианта.

// TODO: показать хотя бы одну обработанную ошибку и неизменность исходных данных.
// Для удобного вывода объектов допустимо использовать console.table().

// (вариант 8)
console.log(`\n\nвариант ${variantNumber}: Оформление технической документации`);
let variantCurrent = variantTasks;
printTasks("Исходные задачи варианта", variantCurrent);
printStats("Исходная сводка варианта", variantCurrent);

variantCurrent = applyResult(
  "addTask(80, 'Опубликовать документацию на портале', 'low')",
  addTask(variantCurrent, 80, "Опубликовать документацию на портале", "low"),
  variantCurrent
);
printStats("Сводка после добавления id=80", variantCurrent);

variantCurrent = applyResult(
  "setTaskCompleted(11, true)",
  setTaskCompleted(variantCurrent, 11, true),
  variantCurrent
);
printStats("Сводка после completed id=11", variantCurrent);

variantCurrent = applyResult(
  "renameTask(23, '...')",
  renameTask(variantCurrent, 23, "Составить структуру разделов руководства (v2)"),
  variantCurrent
);
printStats("Сводка после переименования id=23", variantCurrent);

variantCurrent = applyResult(
  "removeTask(37)",
  removeTask(variantCurrent, 37),
  variantCurrent
);
printStats("Сводка после удаления id=37", variantCurrent);

console.log("\nПроверка отказа: повторное добавление id=80");
const variantFail = addTask(variantCurrent, 80, "Дубликат", "high");
if (variantFail.ok) {
  console.error("ОШИБКА: повторное добавление id=80 прошло");
} else {
  console.log(`Ожидаемый отказ: ${variantFail.error}`);
}

console.log("\nИтог варианта");
console.log("Итоговые id:", variantCurrent.map((t) => t.id));
printStats("Итоговая сводка варианта", variantCurrent);

console.log("\nСохранность variantTasks");
console.log("variantTasks id:", variantTasks.map((t) => t.id));
console.log("variantTasks length:", variantTasks.length);