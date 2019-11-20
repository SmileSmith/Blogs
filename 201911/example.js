

function bigAmountOfItems (amount) {
    let preparedItems = [];
    
    for (let i = 0; i < amount; i += 1) {
        preparedItems.push(Math.round(Math.random() * i));
    }
    
    return preparedItems;
}


function *bigAmountOfItemsGenerator (amount) {
    for (let i = 0; i < amount; i += 1) {
        yield Math.round(Math.random() * i);
    }
}


function main (functionToExec, max = 10000) {
    const beforeKB = memoryUsedKB();
    console.log('Memory before: ', beforeKB);

    let amount = 0;
    for (let item of functionToExec(max)) {
        amount += 1;
    }

    console.log('Item amount: ', amount);

    const afterKB = memoryUsedKB();
    console.log('Memory after: ', afterKB);

    const differenceKB = afterKB - beforeKB;
    console.log('Memory difference: ', differenceKB);
}


function memoryUsedKB () {
    if (!window.performance) {
        throw new Error('No `performance` property at window object !!');
    }

    return Math.round(window.performance.memory.usedJSHeapSize * 100 / 1024) / 100
}


main(bigAmountOfItems, 2000000);

main(bigAmountOfItemsGenerator, 2000000);


function mainWithTimeMeasure (func, max) {
    const beforeTimeStamp = Date.now();
    console.log('time before: ', beforeTimeStamp);

    main(func, max);

    const afterTimeStamp = Date.now();
    console.log('time after: ', afterTimeStamp);

    const differenceTimeStamp = afterTimeStamp - beforeTimeStamp;
    console.log('TimeStamp difference: ', differenceTimeStamp);
}

mainWithTimeMeasure(bigAmountOfItems, 2000000)

mainWithTimeMeasure(bigAmountOfItemsGenerator, 2000000)