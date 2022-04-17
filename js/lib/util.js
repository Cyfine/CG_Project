function mapVal(val, inMin, inMax, outMin, outMax) {
    if (val <= inMin) {
        return outMin;
    }

    if (val >= inMax) {
        return outMax;
    }

    return (val - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}


/**
 * specify the probability distribution by passing
 * the probability values as argument
 * draw from the specified distribution return
 * type drawn
 *
 * @returns {number}
 */
function drawTypeFromDistribution(weight) {
    let sum = 0;
    for (let i = 0; i < weight.length; i++) {
        sum += weight[i];
    }

    let  distribution = []
    for (let i = 0; i < weight.length; i++) {
        distribution.push(weight[i]/sum);
    }

    let rand = Math.random();
    for (let i = 0, left = 0; i < distribution.length; i++) {
        let right = left + distribution[i];
        if (rand >= left && rand < right) {
            return i;
        } else {
            left = right;
        }
    }
}

function fallInRange(val, weight){
    let sum = 0;
    for (let i = 0; i < weight.length; i++) {
        sum += weight[i];
    }

    let  distribution = []
    for (let i = 0; i < weight.length; i++) {
        distribution.push(weight[i]/sum);
    }

    for (let i = 0, left = 0; i < distribution.length; i++) {
        let right = left + distribution[i];
        if (val >= left && val < right) {
            return i;
        } else {
            left = right;
        }
    }
}

function probability(p) {
    return Math.random() > (1 - p);
}














