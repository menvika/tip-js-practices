"use strict";

const totalTasks = 14;
const completedTasks = 14;
const ost = totalTasks-completedTasks;
const vipol = completedTasks / totalTasks * 100;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number"){
    console.log("Ошибка типа вводимых данных")
}
else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > 1000 || ost < 0){
    console.log("Ошибка ввода")
}
else if (totalTasks == 0 || completedTasks == 0 ){
    console.log("Задач нет")
}
else {
    console.log(`всего задач: ${totalTasks}`)
    console.log(`осталось задач: ${ost}`)
    console.log(`выполнено: ${vipol.toFixed(1)}%`)
    if (completedTasks == 0) {
    console.log("статус: не начато")
    }
    else if (completedTasks == totalTasks){
    console.log("статус: завершено") 
    }
    else {
    console.log("статус: в работе") 
    }
}
