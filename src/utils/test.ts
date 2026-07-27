import { convertDecimalToIEEE754Double, convertIEEE754ToDecimal } from './conversion_logic';
import { calculateRounding } from './rounding_logic';

// this is an AI-generated FILE

function runTests() {
    console.log("=================================================");
    console.log("🧪 TEST 1: DECIMAL TO IEEE 754 DOUBLE");
    console.log("=================================================");
    const decToIeee = convertDecimalToIEEE754Double("13.625");
    console.log(`Input: 13.625`);
    console.log(`Binary: ${decToIeee.binary}`);
    console.log(`Hex:    ${decToIeee.hex}`);
    console.log(`\nSteps Preview (First 4):`);
    decToIeee.steps.slice(0, 4).forEach(step => console.log(step));


    console.log("\n=================================================");
    console.log("🧪 TEST 2: IEEE 754 TO DECIMAL (REVERSE)");
    console.log("=================================================");
    // Using the hex output from 13.625
    const ieeeToDec = convertIEEE754ToDecimal("0x402B400000000000");
    console.log(`Input: 0x402B400000000000`);
    console.log(`Result: ${ieeeToDec.decimal}`);
    console.log(`\nSteps Preview (First 4):`);
    ieeeToDec.steps.slice(0, 4).forEach(step => console.log(step));


    console.log("\n=================================================");
    console.log("🧪 TEST 3: ROUNDING METHODS (DECIMAL)");
    console.log("=================================================");
    // 2.35 rounded to 1 decimal place. Tie-to-even should round up to 2.4 (since 3 is odd)
    const roundDec = calculateRounding("2.35", 10, 1);
    console.log(`Input: 2.35 (Base 10) | Target Fraction Digits: 1`);
    console.log(`Chopping (Truncate):   ${roundDec.chopped}`);
    console.log(`Round Up (+Inf):       ${roundDec.roundUp}`);
    console.log(`Round Down (-Inf):     ${roundDec.roundDown}`);
    console.log(`Ties-to-Even:          ${roundDec.roundNearestEven}`);


    console.log("\n=================================================");
    console.log("🧪 TEST 4: ROUNDING METHODS (BINARY)");
    console.log("=================================================");
    // 1.101 rounded to 2 fraction bits. 
    // Dropped bit is '1'. Kept is '1.10'. Last kept digit is '0' (Even).
    // Tie-to-even should stay on the even digit -> 1.10
    const roundBin = calculateRounding("1.101", 2, 2);
    console.log(`Input: 1.101 (Base 2) | Target Fraction Digits: 2`);
    console.log(`Chopping (Truncate):   ${roundBin.chopped}`);
    console.log(`Round Up (+Inf):       ${roundBin.roundUp}`);
    console.log(`Round Down (-Inf):     ${roundBin.roundDown}`);
    console.log(`Ties-to-Even:          ${roundBin.roundNearestEven}`);
    console.log("=================================================\n");
}

runTests();