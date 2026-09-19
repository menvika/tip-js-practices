"use strict";

const plannedText = " 14 ";
const completedText = "4";

function parseTaskInput(value, name) {
  if (typeof value !== "string") {
    return { ok: false, error: `Ошибка: ${name} должен быть строкой` };
  }
  const trimmed = value.trim();

  if (trimmed === "") {
    return { ok: false, error: `Ошибка: ${name} не может быть пустым` };
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return { ok: false, error: `Ошибка: ${name} содержит не число: "${value}"` };
  }

  if (!Number.isFinite(num)) {
    return { ok: false, error: `Ошибка: ${name} не может быть бесконечностью` };
  }

  if (!Number.isInteger(num)) {
    return { ok: false, error: `Ошибка: ${name} должен быть целым числом` };
  }

  if (num < 0) {
    return { ok: false, error: `Ошибка: ${name} не может быть отрицательным` };
  }

  return { ok: true, value: num };
}

const planned = parseTaskInput(plannedText, "planned");
const completed = parseTaskInput(completedText, "completed");

if (!planned.ok) {
  console.log(planned.error);
} else if (!completed.ok) {
  console.log(completed.error);
} else if (completed.value > planned.value) {
  console.log("ошибка: completed не может превышать planned");
} else {
  const remaining = planned.value - completed.value;
  const percent = planned.value === 0 ? 100 : (completed.value / planned.value) * 100;

  console.log(`всего задач: ${planned.value}`);
  console.log(`выполнено: ${completed.value}`);
  console.log(`осталось: ${remaining}`);
  console.log(`процент выполнения: ${percent.toFixed(1)}%`);
}