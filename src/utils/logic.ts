// /src/utils/logic.ts

export interface IEEE754Result {
    binary: string;
    hex: string;
    steps: string[];
}

export function convertDecimalToIEEE754Double(inputNumber: number | string): IEEE754Result {
    
    const num: number = Number(inputNumber);
    const steps: string[] = [];

    // 8-byte memory buffer (64bit)
    const buffer = new ArrayBuffer(8);
    const floatView = new Float64Array(buffer);
    const bigIntView = new BigUint64Array(buffer);

    // storing the number as 64-bit float
    floatView[0] = num;

    // read it as raw bits
    const rawBits = bigIntView[0];

    // convert it to binary and pad to 64 bits
    const binaryString = rawBits.toString(2).padStart(64, '0');

    // apply the proper format
    // sign (1 bit) + exponent (11 bits) + fraction (52 bits)
    const sign = binaryString.substring(0, 1);
    const exponent = binaryString.substring(1, 12);
    const fraction = binaryString.substring(12);
    const spacedBinary = `${sign} ${exponent} ${fraction}`;

    const hexString = "0x" + rawBits.toString(16).toUpperCase().padStart(16, '0');

    // stepbystep logic - need refining
    if (Number.isNaN(num)) {
        steps.push("1. Input is Nan (Not a Number).")
        steps.push("Step 2: By IEEE 754 rules, Exponent must be all 1s (2047) and Fraction must be non-zero.");
    } 
    else if (num === Infinity || num === -Infinity) {
        steps.push(`Step 1: Input is ${num < 0 ? "-Infinity" : "+Infinity"}.`);
        steps.push(`Step 2: Sign bit is ${sign}.`);
        steps.push("Step 3: By IEEE 754 rules, Exponent must be all 1s (2047) and Fraction must be all 0s.");
    } 
    else if (num === 0) {
        const isNegativeZero = Object.is(num, -0);
        steps.push(`Step 1: Input is ${isNegativeZero ? "-0" : "+0"}. Sign bit is ${sign}.`);
        steps.push("Step 2: Exponent is all 0s.");
        steps.push("Step 3: Fraction is all 0s.");
    } 
    // Normal / Subnormal Numbers
    else {
        const isNegative = num < 0;
        steps.push(`Step 1: Identify Sign. Number is ${isNegative ? 'negative' : 'positive'}, so Sign Bit = ${sign}.`);

        const expDecimal = parseInt(exponent, 2);
        
        if (expDecimal === 0) {
            // Subnormal number
            steps.push(`Step 2: Number is very close to zero (Subnormal). Actual exponent is fixed at -1022.`);
            steps.push(`Step 3: Exponent bits are all 0s -> ${exponent}.`);
            steps.push(`Step 4: Extract the unnormalized fraction (52 bits) -> ${fraction}.`);
        } else {
            // Normal number
            const actualExponent = expDecimal - 1023;
            steps.push(`Step 2: Convert absolute value to binary and normalize to form 1.F x 2^E.`);
            steps.push(`Step 3: The actual exponent (E) is ${actualExponent}.`);
            steps.push(`Step 4: Calculate Biased Exponent: ${actualExponent} + 1023 (Bias) = ${expDecimal}.`);
            steps.push(`Step 5: Convert biased exponent (${expDecimal}) to 11-bit binary -> ${exponent}.`);
            steps.push(`Step 6: Drop the leading '1' and pad the fraction (F) to 52 bits -> ${fraction}.`);
        }
    }

    return { 
        binary: spacedBinary,
        hex: hexString,
        steps: steps
    };

}