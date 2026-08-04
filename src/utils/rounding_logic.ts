// MACHINE 3: BINARY 64-BIT FLOATING-POINT (IEEE 754 DOUBLE-PRECISION) LOGIC
// src/utils/rounding_logic.ts

// ===== INTERFACES =====
export interface RoundingResult {
    original: string;
    targetLength: number;
    chopped: string;
    roundUp: string;
    roundDown: string;
    roundNearestEven: string;
    steps: string[];
}

// ===== ROUNDING HELPER FUNCTIONS =====
// increments a base-2 or base-10 string by 1.
function incrementString(str: string, base: 2 | 10): string {
    let carry = 1;
    let result = "";
    for (let i = str.length - 1; i >= 0; i--) {
        if (carry === 0) {
            result = str.slice(0, i + 1) + result;
            break;
        }
        const val = parseInt(str[i], base) + carry;
        if (val >= base) {
            carry = 1;
            result = (val - base).toString(base) + result;
        } else {
            carry = 0;
            result = val.toString(base) + result;
        }
    }
    if (carry > 0) result = carry.toString(base) + result;
    return result;
}

// ===== CORE ROUNDING LOGIC =====
export function calculateRounding(input: string, base: 2 | 10, targetLength: number): RoundingResult {
    const steps: string[] = [];
    let cleanInput = input.trim();
    
    // extract Sign
    const isNegative = cleanInput.startsWith('-');
    const signStr = isNegative ? '-' : '';
    if (isNegative || cleanInput.startsWith('+')) {
        cleanInput = cleanInput.slice(1);
    }

    if (!cleanInput) {
        return {
            original: input,
            targetLength,
            chopped: 'NaN',
            roundUp: 'NaN',
            roundDown: 'NaN',
            roundNearestEven: 'NaN',
            steps: ['Input is invalid (sign with no numeric value).']
        };
    }
    const parts = cleanInput.split('.');
    const intPart = parts[0] || "0";
    const fracPart = parts[1] || "";

    steps.push(`Step 1: Input parsed. Base: ${base}, Target fractional digits: ${targetLength}`);
    steps.push(`   -> Integer part: ${intPart}`);
    steps.push(`   -> Fractional part: ${fracPart || "(none)"}`);

    // if the number already fits within the target length, no rounding occurs.
    if (fracPart.length <= targetLength) {
        const paddedFrac = fracPart.padEnd(targetLength, '0');
        const formattedResult = signStr + intPart + (targetLength > 0 ? '.' + paddedFrac : '');
        
        steps.push(`Step 2: Fractional part is already within target length. No rounding needed.`);
        return {
            original: input,
            targetLength,
            chopped: formattedResult,
            roundUp: formattedResult,
            roundDown: formattedResult,
            roundNearestEven: formattedResult,
            steps
        };
    }

    // separate the kept fraction from the dropped fraction
    const choppedFrac = fracPart.slice(0, targetLength);
    const droppedFrac = fracPart.slice(targetLength);
    const hasRemainder = /[^0]/.test(droppedFrac); // true if any dropped digit is not '0'

    const choppedUnsignedStr = intPart + (targetLength > 0 ? '.' + choppedFrac : '');
    
    steps.push(`Step 2: Split fraction at target length.`);
    steps.push(`   -> Kept part: ${choppedUnsignedStr}`);
    steps.push(`   -> Dropped part: ${droppedFrac}`);
    
    // calculate the "incremented" version (chopped value + 1 to the LSD)
    const combinedChopped = intPart + choppedFrac;
    const incrementedCombined = incrementString(combinedChopped, base);
    
    let incInt = "";
    let incFrac = "";
    
    if (targetLength > 0) {
        incFrac = incrementedCombined.slice(-targetLength);
        incInt = incrementedCombined.slice(0, -targetLength) || "0";
    } else {
        incInt = incrementedCombined || "0";
    }
    
    const incrementedUnsignedStr = incInt + (targetLength > 0 ? '.' + incFrac : '');

    // ===== METHOD 1: CHOPPING (Truncation) =====
    const choppedResult = signStr + choppedUnsignedStr;
    steps.push(`\n[Chopping]`);
    steps.push(`   -> Simply discard the dropped bits/digits.`);
    steps.push(`   -> Result: ${choppedResult}`);

    // ===== METHOD 2 & 3: ROUND UP (+Inf) & ROUND DOWN (-Inf) =====
    let roundUpResult = "";
    let roundDownResult = "";

    if (!hasRemainder) {
        // if the dropped part is exactly zero, the value doesn't change
        roundUpResult = choppedResult;
        roundDownResult = choppedResult;
    } else {
        if (!isNegative) {
            roundUpResult = signStr + incrementedUnsignedStr; // moves further positive (+Inf)
            roundDownResult = signStr + choppedUnsignedStr;   // stays closer to 0 (-Inf)
        } else {
            roundUpResult = signStr + choppedUnsignedStr;     // stays closer to 0 (+Inf)
            roundDownResult = signStr + incrementedUnsignedStr; // moves further negative (-Inf)
        }
    }

    steps.push(`\n[Directional Rounding]`);
    steps.push(`   -> Round Up (Towards +Infinity): ${roundUpResult}`);
    steps.push(`   -> Round Down (Towards -Infinity): ${roundDownResult}`);

    // ===== METHOD 4: ROUND-TO-NEAREST TIES-TO-EVEN =====
    let isGreaterThanHalf = false;
    let isTie = false;
    const firstDropped = droppedFrac[0];

    if (base === 10) {
        if (firstDropped > '5') isGreaterThanHalf = true;
        else if (firstDropped === '5') {
            isTie = !/[^0]/.test(droppedFrac.slice(1));
            isGreaterThanHalf = !isTie;
        }
    } else if (base === 2) {
        if (firstDropped === '1') {
            isTie = !/[^0]/.test(droppedFrac.slice(1));
            isGreaterThanHalf = !isTie;
        }
    }

    steps.push(`\n[Round-to-Nearest Ties-to-Even]`);
    let nearestResult = "";

    if (isGreaterThanHalf) {
        steps.push(`   -> The dropped portion is strictly greater than half. Rounding UP absolute value.`);
        nearestResult = signStr + incrementedUnsignedStr;
    } else if (isTie) {
        const lastKeptDigit = targetLength > 0 ? choppedFrac.slice(-1) : intPart.slice(-1);
        const isEven = (parseInt(lastKeptDigit, base) % 2) === 0;
        
        steps.push(`   -> The dropped portion is an EXACT tie (Halfway).`);
        steps.push(`   -> Checking last kept digit ('${lastKeptDigit}'). It is ${isEven ? 'Even' : 'Odd'}.`);
        
        if (isEven) {
            steps.push(`   -> Tie-breaker rule: Stay on the even digit (Do not increment).`);
            nearestResult = signStr + choppedUnsignedStr;
        } else {
            steps.push(`   -> Tie-breaker rule: Round to make the digit even (Increment).`);
            nearestResult = signStr + incrementedUnsignedStr;
        }
    } else {
        steps.push(`   -> The dropped portion is strictly less than half. Truncating.`);
        nearestResult = signStr + choppedUnsignedStr;
    }

    return {
        original: input,
        targetLength,
        chopped: choppedResult,
        roundUp: roundUpResult,
        roundDown: roundDownResult,
        roundNearestEven: nearestResult,
        steps
    };
}