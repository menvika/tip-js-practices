"use strict";

const totalTasks = 14;
const completedTasks = 4;
const dailyLimit = 4;
const ost = totalTasks - completedTasks;
const vipol = completedTasks / totalTasks * 100;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number" || typeof dailyLimit !== "number"){
    console.log("ошибка типа вводимых данных")
}
else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit)){
    console.log("ошибка: числа должны быть целыми")
}
else if (totalTasks < 0 || completedTasks < 0 || ost < 0){
    console.log("ошибка ввода")
}
else if (dailyLimit < 1 || dailyLimit > 1000){
    console.log("ошибка: дневной лимит должен быть от 1 до 1000")
}
else {
    //console.log(`всего задач: ${totalTasks}`)
    console.log(`осталось задач: ${ost}`)
    //console.log(`выполнено: ${vipol.toFixed(1)}%`)

    if (ost === 0) {
        console.log("статус: завершено")
        console.log("потребуется дней: 0")
    }
    else {
        console.log("статус: в работе")
        let day = 0;
        let left = ost;
        while (left > 0) {
            day += 1;
            const doneToday = Math.min(dailyLimit, left);
            left -= doneToday;
            console.log(`день ${day}: выполнено ${doneToday}, осталось ${left}`);
        }
        console.log(`потребуется дней: ${day}`)
    }
}