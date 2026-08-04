// MACHINE 3: BINARY 64-BIT FLOATING-POINT (IEEE 754 DOUBLE-PRECISION) LOGIC
// src/utils/conversion_logic.ts

// ===== CONSTANTS =====
const TOTAL_BITS = 64;
const SIGN_BIT_COUNT = 1;
const EXPONENT_BIT_COUNT = 11;
const FRACTION_BIT_COUNT = 52;
const EXPONENT_BIAS = 1023;
const MAX_EXPONENT_VALUE = (1 << EXPONENT_BIT_COUNT) - 1; // 2047
const BUFFER_SIZE_BYTES = 8;

// ===== INTERFACES =====
export interface IEEE754EncodingResult {
    binary: string;
    hex: string;
    steps: string[];
    error?: string; 
}

export interface IEEE754DecodingResult {
    decimal: string;
    steps: string[];
    error?: string;
}

type IEEE754Class = 
    | 'Normal' 
    | 'Subnormal' 
    | 'PositiveZero' 
    | 'NegativeZero' 
    | 'PositiveInfinity' 
    | 'NegativeInfinity' 
    | 'NaN';

// ===== HELPER FUNCTIONS =====
function getBufferViews() {
    const buffer = new ArrayBuffer(BUFFER_SIZE_BYTES);
    return {
        floatView: new Float64Array(buffer),
        bigIntView: new BigUint64Array(buffer)
    };
}

function bigIntToBinary(rawBits: bigint, length: number): string {
    return rawBits.toString(2).padStart(length, '0');
}

function formatBinary(binaryStr: string): string {
    const expStart = SIGN_BIT_COUNT;
    const fracStart = SIGN_BIT_COUNT + EXPONENT_BIT_COUNT;
    return `${binaryStr.slice(0, expStart)} ${binaryStr.slice(expStart, fracStart)} ${binaryStr.slice(fracStart, TOTAL_BITS)}`;
}

function formatHex(rawBits: bigint): string {
    return "0x" + rawBits.toString(16).toUpperCase().padStart(16, '0');
}

function extractIEEE754Layout(binaryString: string) {
    const expStart = SIGN_BIT_COUNT;
    const fracStart = SIGN_BIT_COUNT + EXPONENT_BIT_COUNT;
    return {
        sign: binaryString.slice(0, expStart),
        exponent: binaryString.slice(expStart, fracStart),
        fraction: binaryString.slice(fracStart, TOTAL_BITS)
    };
}

function classifyIEEE754Value(expVal: number, fractionStr: string, signBit: string): IEEE754Class {
    if (expVal === MAX_EXPONENT_VALUE) {
        return fractionStr.includes('1') ? 'NaN' : (signBit === '1' ? 'NegativeInfinity' : 'PositiveInfinity');
    }
    if (expVal === 0) {
        return fractionStr.includes('1') ? 'Subnormal' : (signBit === '1' ? 'NegativeZero' : 'PositiveZero');
    }
    return 'Normal';
}

// ===== VALIDATION & PARSING HELPERS =====
function validateDecimalInput(input: string | number): number | null {
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed === '') return null; 
        if (trimmed.toLowerCase() === 'nan') return NaN;
        if (trimmed.toLowerCase() === 'infinity' || trimmed.toLowerCase() === '+infinity') return Infinity;
        if (trimmed.toLowerCase() === '-infinity') return -Infinity;
        
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
    }
    if (Number.isNaN(input)) return NaN; 
    return input;
}

function sanitizeInput(input: string): string {
    let clean = input.trim().toUpperCase();
    if (clean.startsWith('0X') || clean.startsWith('0B')) {
        clean = clean.slice(2);
    }
    return clean;
}

function parseRawBits(cleanInput: string): { rawBits: bigint; isHex: boolean } | null {
    const hexRegex = /^[0-9A-F]{16}$/;
    if (hexRegex.test(cleanInput)) {
        return { rawBits: BigInt('0x' + cleanInput), isHex: true };
    }
    
    const binaryRegex = /^[01]{64}$/;
    if (binaryRegex.test(cleanInput)) {
        return { rawBits: BigInt('0b' + cleanInput), isHex: false };
    }
    
    return null;
}

// ===== DECIMAL TO IEEE 754 DOUBLE =====
export function convertDecimalToIEEE754Double(inputNumber: number | string): IEEE754EncodingResult {
    const num = validateDecimalInput(inputNumber);
    
    if (num === null) {
        return {
            binary: "", hex: "", steps: [],
            error: "Invalid numeric input. Please enter a valid decimal number, 'NaN', or 'Infinity'."
        };
    }

    const steps: string[] = [];
    const { floatView, bigIntView } = getBufferViews();
    
    // JavaScript numbers are already IEEE754 doubles. The buffer is used to expose 
    // the underlying bit representation instead of manually recreating the encoding algorithm.
    floatView[0] = num;
    const rawBits = bigIntView[0];
    const binaryString = bigIntToBinary(rawBits, TOTAL_BITS);
    
    const { sign, exponent, fraction } = extractIEEE754Layout(binaryString);
    const expVal = parseInt(exponent, 2);
    const classification = classifyIEEE754Value(expVal, fraction, sign);

    // ----- Generate Mathematical Step-by-Step Breakdown -----
    steps.push(`Step 1: Input Analysis. Evaluating decimal value: ${num}`);
    
    if (classification === 'NaN') {
        steps.push(`Step 2: Sign Bit Extraction.`);
        steps.push(`   -> NaN does not have a mathematical sign.`);
        steps.push(`   -> IEEE754 still stores a sign bit: ${sign}.`);
    } else {
        const isNegative = Object.is(num, -0) || num < 0;
        steps.push(`Step 2: Sign Determination. Number is ${isNegative ? 'negative' : 'positive'}, so Sign Bit = ${sign}.`);
    }

    if (classification === 'NaN') {
        steps.push(`   -> Value is NaN (Not a Number).`);
        steps.push(`   -> Rule: Exponent bits are all 1s (${MAX_EXPONENT_VALUE}), and Fraction bits are non-zero.`);
        steps.push(`   -> Note: Result uses the JavaScript engine's default NaN payload (one of many valid IEEE754 NaN representations).`);
    } else if (classification === 'PositiveInfinity' || classification === 'NegativeInfinity') {
        const isOverflow = typeof inputNumber === 'string' && inputNumber.toLowerCase().indexOf('infinity') === -1;
        if (isOverflow) steps.push(`   -> Note: Input overflowed into IEEE754 Infinity.`);
        steps.push(`   -> Value is Infinite.`);
        steps.push(`   -> Rule: Exponent bits are all 1s (${MAX_EXPONENT_VALUE}), and Fraction bits are all 0s.`);
    } else if (classification === 'PositiveZero' || classification === 'NegativeZero') {
        steps.push(`   -> Value is exactly zero.`);
        steps.push(`   -> Rule: Exponent bits are all 0s, and Fraction bits are all 0s.`);
    } else {
        const absNum = Math.abs(num);
        
        if (classification === 'Subnormal') {
            steps.push(`Step 3: Subnormal Evaluation. Value is too small for normal representation.`);
            steps.push(`   -> Exponent is fixed to 0 (all 0s). Actual mathematical exponent evaluates to -1022.`);
            steps.push(`   -> Mantissa is evaluated as 0.fraction (No hidden leading 1 exists).`);
        } else {
            // Normal Mathematical Conversion Tracing
            steps.push(`Step 3: Manual Binary Conversion & Normalization`);
            
            const intPart = Math.floor(absNum);
            let fracPart = absNum - intPart;
            
            const intPartBin = intPart.toString(2);
            steps.push(`   -> Integer part: ${intPart} → ${intPartBin}`);
            
            steps.push(`   -> Fractional part multiplication trace:`);
            let currentFrac = fracPart;
            let fracBits = "";
            let iteration = 0;
            const MAX_TRACE = 5;
            
            while (currentFrac > 0 && iteration < 60) {
                const next = currentFrac * 2;
                const bit = Math.floor(next);
                fracBits += bit;
                if (iteration < MAX_TRACE) {
                    steps.push(`      ${currentFrac} × 2 = ${next} → ${bit}`);
                } else if (iteration === MAX_TRACE) {
                    steps.push(`      ... (repeated multiplication continues)`);
                }
                currentFrac = next - bit;
                iteration++;
            }
            if (fracBits === "") fracBits = "0";
            
            const unnormalizedBin = `${intPartBin}.${fracBits}`;
            steps.push(`   -> Combined Binary: ${unnormalizedBin}`);
            
            // Calculate the actual mathematical exponent
            const calculatedExponent = Math.floor(Math.log2(absNum));
            const actualExponent = expVal - EXPONENT_BIAS;
            
            // Generate the normalized mantissa string manually for educational display
            const unnormalizedNoDot = intPartBin + fracBits;
            const firstOneIdx = unnormalizedNoDot.indexOf('1');
            const mantissaGenerated = "1." + unnormalizedNoDot.slice(firstOneIdx + 1);
            
            const shiftDirection = calculatedExponent < 0 ? 'right' : 'left';
            steps.push(`   -> Shift the radix point by ${Math.abs(calculatedExponent)} positions ${shiftDirection}: ${mantissaGenerated.slice(0, 12)}${mantissaGenerated.length > 12 ? '...' : ''} × 2^(${calculatedExponent})`);
            steps.push(`   -> Calculated Base-2 Exponent (E) = ${calculatedExponent}`);
            
            if (calculatedExponent === actualExponent) {
                steps.push(`   -> Verification: IEEE754 encoded exponent matches calculated: ${actualExponent}`);
            }
            
            steps.push(`Step 4: Biased Exponent Calculation.`);
            steps.push(`   -> Biased Exponent = E + Bias = ${actualExponent} + ${EXPONENT_BIAS} = ${expVal}`);
            steps.push(`   -> Converted to 11-bit binary: ${exponent}`);
            
            if (iteration >= 52 || mantissaGenerated.length > 54) {
                steps.push(`Step 5: Fractional Extraction, Precision Loss & Rounding.`);
                steps.push(`   -> Not every decimal number has an exact binary representation.`);
                steps.push(`   -> The generated binary fraction exceeds the 52 stored bits.`);
                steps.push(`   -> IEEE754 checks additional bits (guard, round, sticky) and applies round-to-nearest ties-to-even.`);
            } else {
                steps.push(`Step 5: Fractional Extraction and Padding.`);
                const generatedFraction = mantissaGenerated.slice(2);
                steps.push(`   -> Generated fraction: ${generatedFraction}`);
                steps.push(`   -> Padded fraction: ${fraction} (zeros appended to reach 52 bits)`);
            }
        }
    }

    steps.push(`Final Assembly: ${formatBinary(binaryString)}`);

    return {
        binary: formatBinary(binaryString),
        hex: formatHex(rawBits),
        steps
    };
}

// ===== IEEE 754 DOUBLE TO DECIMAL =====
export function convertIEEE754ToDecimal(input: string): IEEE754DecodingResult {
    const cleanInput = sanitizeInput(input);
    const parsed = parseRawBits(cleanInput);

    if (!parsed) {
        return {
            decimal: "", steps: [],
            error: "Invalid input. Provide exactly 64 binary digits or exactly 16 hexadecimal characters."
        };
    }

    const { rawBits, isHex } = parsed;
    const binaryString = bigIntToBinary(rawBits, TOTAL_BITS);
    const { sign, exponent, fraction } = extractIEEE754Layout(binaryString);
    const expVal = parseInt(exponent, 2);
    const classification = classifyIEEE754Value(expVal, fraction, sign);
    const steps: string[] = [];

    steps.push(`Step 1: Input successfully parsed as exactly ${isHex ? '16 Hexadecimal characters' : '64 Binary bits'}.`);
    steps.push(`Step 2: Extract IEEE 754 Bit Layout:`);
    steps.push(`   -> Sign Bit (1 bit): ${sign}`);
    steps.push(`   -> Exponent (11 bits): ${exponent} (Decimal: ${expVal})`);
    steps.push(`   -> Fraction (52 bits): ${fraction}`);

    // ----- Generate Mathematical Step-by-Step Breakdown -----
    steps.push(`Step 3: Classification and Numerical Reconstruction (${classification}):`);
    
    if (classification === 'NaN') {
        const nanType = fraction[0] === '1' ? 'Quiet NaN' : 'Signaling NaN';
        steps.push(`   -> Based on the common IEEE754 quiet/signaling NaN convention, this bit pattern evaluates to **${nanType}**.`);
    } else if (classification === 'PositiveInfinity' || classification === 'NegativeInfinity' || classification === 'PositiveZero' || classification === 'NegativeZero') {
        steps.push(`   -> Based on standard IEEE 754 rules, this bit pattern evaluates to **${classification.replace('Positive', '+').replace('Negative', '-')}**.`);
    } else {
        const isNormal = classification === 'Normal';
        const actualExponent = isNormal ? expVal - EXPONENT_BIAS : -1022;
        
        if (isNormal) {
            steps.push(`   -> Normal number: Unbiased Exponent = ${expVal} - ${EXPONENT_BIAS} = ${actualExponent}`);
        } else {
            steps.push(`   -> Subnormal number: Implicit exponent is fixed to -1022.`);
            steps.push(`   -> No hidden leading 1 exists. Significand = 0.fraction`);
        }

        let mantissaValue = isNormal ? 1.0 : 0.0;
        let mathString = isNormal ? "1" : "0";
        let termsShown = 0;

        for (let i = 0; i < FRACTION_BIT_COUNT; i++) {
            if (fraction[i] === '1') {
                const weight = Math.pow(2, -(i + 1));
                mantissaValue += weight;
                if (termsShown < 3) {
                    mathString += ` + 2^(-${i + 1})`;
                    termsShown++;
                }
            }
        }
        
        if (termsShown > 0 && termsShown < fraction.split('1').length - 1) {
            mathString += " + ...";
        }

        const signMultiplier = sign === '1' ? -1 : 1;
        
        steps.push(`   -> Reconstructing Mantissa: ${mathString}`);
        steps.push(`   -> Mantissa Evaluates to: ≈ ${mantissaValue}`);
        steps.push(`   -> Sign multiplier: (-1)^${sign} = ${signMultiplier}`);
        steps.push(`   -> Formula: ${signMultiplier} × ${mantissaValue} × 2^(${actualExponent})`);
        
        const mathApprox = signMultiplier * mantissaValue * Math.pow(2, actualExponent);
        steps.push(`   -> Calculated mathematical approximation: ${mathApprox}`);
    }

    const { floatView, bigIntView } = getBufferViews();
    bigIntView[0] = rawBits;
    const finalDecimal = floatView[0];

    steps.push(`Runtime IEEE754 decoded value: ${finalDecimal}`);

    // Object.is(-0, -0) is true; String(-0) returns "0" in JS, so we handle it explicitly.
    const decimalStr = Object.is(finalDecimal, -0) ? '-0' : finalDecimal.toString();

    return {
        decimal: decimalStr,
        steps
    };
}