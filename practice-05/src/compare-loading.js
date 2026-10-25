
const baseUrl = "http://127.0.0.1:5505/api";
const delayMs = 1000;

async function loadWithDelay() {
  const response = await fetch(
    `${baseUrl}/debug/delay?ms=${delayMs}`
  );

  if (!response.ok) {
    throw new Error(`Ошибка HTTP ${response.status}`);
  }

  return response.json();
}

async function measureSequential() {
  const startedAt = performance.now();

  await loadWithDelay();
  await loadWithDelay();

  return performance.now() - startedAt;
}

async function measureParallel() {
  const startedAt = performance.now();

  await Promise.all([
    loadWithDelay(),
    loadWithDelay(),
  ]);

  return performance.now() - startedAt;
}

async function main() {
  try {
    const health = await fetch(`${baseUrl}/health`);

    if (!health.ok) {
      throw new Error(`API недоступен: HTTP ${health.status}`);
    }

    console.log("Последовательная загрузка:");

    for (let i = 1; i <= 3; i++) {
      const time = await measureSequential();
      console.log(`Запуск ${i}: ${time.toFixed(1)} мс`);
    }

    console.log("\nПараллельная загрузка:");

    for (let i = 1; i <= 3; i++) {
      const time = await measureParallel();
      console.log(`Запуск ${i}: ${time.toFixed(1)} мс`);
    }
  } catch (error) {
    console.error("Ошибка:", error.message);
  }
}

main();
