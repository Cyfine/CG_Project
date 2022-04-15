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
function getTypeFromDistribution() {

    let rand = Math.random();

    for (let i = 0, left =0; i < arguments.length; i++) {
        let right = left + arguments[i];
        if (rand >= left && rand < right) {
            return i;
        }else{
            left = right;
        }

    }

}









