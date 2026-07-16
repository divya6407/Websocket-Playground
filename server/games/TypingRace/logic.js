export function handleCalculation (paragraph, typedPara) {
    console.log("Typed:", typedPara);
    console.log("Target:", paragraph);

    // Using the matching passed arguments cleanly
    const typedParaArr = typedPara.trim().split(/\s+/).filter(Boolean);
    const paragraphArr = paragraph.trim().split(/\s+/).filter(Boolean);

    let c = 0;
    let w = 0;

    for (let i = 0; i < typedParaArr.length; i++) {
        if (typedParaArr[i] === paragraphArr[i]) {
            c++;
        } else {
            w++;
        }
    }

    // Capture uncompleted trailing words as wrong
    w += Math.max(0, paragraphArr.length - typedParaArr.length);

    return { correctWord: c, wrongWord: w };
};




export function handleprogress(noOfTyped,noOfChar){
    if (!noOfChar || noOfChar === 0) return 0;
    const percentage = (noOfTyped / noOfChar) * 100;
    return Math.min(100, Math.round(percentage));
}
