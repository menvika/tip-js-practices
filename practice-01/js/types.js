"use strict";

// "8" + 2
const r1 = "8" + 2;
console.log("Результат:", r1);
console.log("Тип результата:", typeof r1);

// "8" - 2
const r2 = "8" - 2;
console.log("Результат:", r2);
console.log("Тип результата:", typeof r2);

// Number("8") + 2
const r3 = Number("8") + 2;
console.log("Результат:", r3);
console.log("Тип результата:", typeof r3);

// "12" > "3"
const r4 = "12" > "3";
console.log("Результат:", r4);
console.log("Тип результата:", typeof r4);

// 12 === "12"
const r5 = 12 === "12";
console.log("Результат:", r5);
console.log("Тип результата:", typeof r5);

// Number("")
const r6 = Number("");
console.log("Результат:", r6);
console.log("Тип результата:", typeof r6);

// Number("text")
const r7 = Number("text");
console.log("Результат:", r7);
console.log("Тип результата:", typeof r7);

// Boolean("false")
const r8 = Boolean("false");
console.log("Результат:", r8);
console.log("Тип результата:", typeof r8);

// typeof null
const r9 = typeof null;             
const t9 = typeof (typeof null);    
console.log("Результат:", r9);
console.log("Тип результата:", typeof t9);

// typeof NaN
const r10 = typeof NaN;
const t10 = typeof (typeof NaN);
console.log("Результат:", r10);
console.log("Тип результата:", typeof t10);