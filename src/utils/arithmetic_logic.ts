// MACHINE 3: BINARY 64-BIT FLOATING-POINT
// src/utils/arithmetic_logic.ts
// GRS (Guard, Round, Sticky) method for Addition and Multiplication

// ===== CONSTANTS =====
const EXPONENT_BIAS = 1023
const MAX_EXP_STORED = 2047  // all-ones exponent (inf/nan)
const BUFFER_BYTES = 8

// ===== INTERFACES =====
export interface ArithmeticResult {
  operand1Decimal: string
  operand2Decimal: string
  operand1Binary:  string
  operand2Binary:  string
  resultBinary:    string
  resultHex:       string
  resultDecimal:   string
  steps:           string[]
  error?:          string
  grsInfo:         GRSInfo
}

export interface GRSInfo {
  guard:  number
  round:  number
  sticky: number
  action: string
}

// ===== HELPERS =====
function getViews() {
  const buf = new ArrayBuffer(BUFFER_BYTES)
  return { f64: new Float64Array(buf), u64: new BigUint64Array(buf) }
}

function numToBits(n: number): bigint {
  const { f64, u64 } = getViews()
  f64[0] = n
  return u64[0]
}

function bitsToNum(bits: bigint): number {
  const { f64, u64 } = getViews()
  u64[0] = bits
  return f64[0]
}

function bitsToStr(bits: bigint): string {
  return bits.toString(2).padStart(64, '0')
}

function formatBinary(b: string): string {
  return `${b.slice(0, 1)} ${b.slice(1, 12)} ${b.slice(12)}`
}

function formatHex(bits: bigint): string {
  return '0x' + bits.toString(16).toUpperCase().padStart(16, '0')
}

function formatDecimal(val: number): string {
  return Object.is(val, -0) ? '-0' : String(val)
}

/** Parse either decimal or hex (16 chars) or binary (64 chars) into a JS number. */
export function parseOperand(raw: string): { value: number; displayDecimal: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Try hex: 16 hex chars (with or without 0x prefix)
  const hexClean = trimmed.toUpperCase().replace(/^0X/, '')
  if (/^[0-9A-F]{16}$/.test(hexClean)) {
    const bits = BigInt('0x' + hexClean)
    const v = bitsToNum(bits)
    return { value: v, displayDecimal: formatDecimal(v) }
  }

  // Try 64-bit binary string
  if (/^[01]{64}$/.test(trimmed)) {
    const bits = BigInt('0b' + trimmed)
    const v = bitsToNum(bits)
    return { value: v, displayDecimal: formatDecimal(v) }
  }

  // Try decimal
  const lower = trimmed.toLowerCase()
  if (lower === 'nan')      return { value: NaN,       displayDecimal: 'NaN' }
  if (lower === 'infinity'  || lower === '+infinity') return { value: Infinity,  displayDecimal: 'Infinity' }
  if (lower === '-infinity') return { value: -Infinity, displayDecimal: '-Infinity' }

  const n = Number(trimmed)
  if (!isNaN(n) || trimmed === 'NaN') return { value: n, displayDecimal: formatDecimal(n) }

  return null
}

// ===== GRS ROUNDING =====
function evaluateGRS(truncated: bigint, G: number, R: number, S: number, steps: string[]): { rounded: bigint; grs: GRSInfo } {
  let action = 'Truncate (G=0)'
  let rounded = truncated

  if (G === 1) {
    if (R === 1 || S === 1) {
      action = 'Round Up (G=1 and (R=1 or S=1) → strictly above halfway)'
      rounded = truncated + 1n
    } else {
      const isOdd = (truncated & 1n) === 1n
      if (isOdd) {
        action = 'Round Up (Ties-to-Even: LSB was odd → increment to make even)'
        rounded = truncated + 1n
      } else {
        action = 'Truncate (Ties-to-Even: LSB was already even → no increment)'
      }
    }
  }

  steps.push(`   -> GRS Bits: Guard(G)=${G}, Round(R)=${R}, Sticky(S)=${S}`)
  steps.push(`   -> Decision: ${action}`)
  return { rounded, grs: { guard: G, round: R, sticky: S, action } }
}

// ===== ADDITION =====
export function addIEEE754(a: number, b: number): ArithmeticResult {
  const steps: string[] = []
  const aBits = numToBits(a)
  const bBits = numToBits(b)
  const aBin  = bitsToStr(aBits)
  const bBin  = bitsToStr(bBits)

  steps.push(`Operation: (${formatDecimal(a)}) + (${formatDecimal(b)})`)
  steps.push(`Step 1: Extract IEEE 754 fields.`)
  steps.push(`   Operand A: ${formatBinary(aBin)}`)
  steps.push(`   Operand B: ${formatBinary(bBin)}`)

  // Extract fields
  const aSign = Number(aBits >> 63n)
  const bSign = Number(bBits >> 63n)
  const aExp  = Number((aBits >> 52n) & 0x7FFn)
  const bExp  = Number((bBits >> 52n) & 0x7FFn)
  const aFrac = aBits & 0x000FFFFFFFFFFFFFn
  const bFrac = bBits & 0x000FFFFFFFFFFFFFn

  steps.push(`   A: sign=${aSign}, biased_exp=${aExp}, frac=0x${aFrac.toString(16)}`)
  steps.push(`   B: sign=${bSign}, biased_exp=${bExp}, frac=0x${bFrac.toString(16)}`)

  // Special cases: let JS handle IEEE 754 special values
  if (!Number.isFinite(a) || !Number.isFinite(b) || Number.isNaN(a) || Number.isNaN(b) || a === 0 || b === 0) {
    const result = a + b
    const resultBits = numToBits(result)
    const resultBin = bitsToStr(resultBits)
    steps.push(`Step 2: Special-case detected. Result = ${formatDecimal(result)}`)
    steps.push(`   -> Final Assembly: ${formatBinary(resultBin)}`)
    return {
      operand1Decimal: formatDecimal(a), operand2Decimal: formatDecimal(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
      resultDecimal: formatDecimal(result), steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Special case (no GRS needed)' }
    }
  }

  // Anchor to position 55 (52 frac + 3 extra for GRS)
  let aExpEff = aExp === 0 ? 1 : aExp
  let bExpEff = bExp === 0 ? 1 : bExp
  let aMantissa = (BigInt(aExp === 0 ? 0 : 1) << 55n) | (aFrac << 3n)
  let bMantissa = (BigInt(bExp === 0 ? 0 : 1) << 55n) | (bFrac << 3n)

  steps.push(`Step 2: Add hidden bit and scale.`)
  steps.push(`   A mantissa: 0x${aMantissa.toString(16)} (biased exp: ${aExpEff})`)
  steps.push(`   B mantissa: 0x${bMantissa.toString(16)} (biased exp: ${bExpEff})`)

  let expDiff = aExpEff - bExpEff
  let resultExp = aExpEff

  steps.push(`Step 3: Align exponents. Exponent difference = ${Math.abs(expDiff)}.`)

  if (expDiff > 0) {
    steps.push(`   B is smaller — shift B mantissa right by ${expDiff} bits.`)
    const dropped = bMantissa & ((1n << BigInt(expDiff)) - 1n)
    const sticky = dropped > 0n ? 1n : 0n
    bMantissa = (bMantissa >> BigInt(expDiff)) | sticky
    resultExp = aExpEff
  } else if (expDiff < 0) {
    steps.push(`   A is smaller — shift A mantissa right by ${-expDiff} bits.`)
    const diff = -expDiff
    const dropped = aMantissa & ((1n << BigInt(diff)) - 1n)
    const sticky = dropped > 0n ? 1n : 0n
    aMantissa = (aMantissa >> BigInt(diff)) | sticky
    resultExp = bExpEff
  } else {
    steps.push(`   Exponents are equal. No alignment needed.`)
  }

  steps.push(`Step 4: Perform addition/subtraction.`)
  let resultSign: number
  let resultMantissa: bigint

  if (aSign === bSign) {
    resultMantissa = aMantissa + bMantissa
    resultSign = aSign
    steps.push(`   Same sign: magnitudes added.`)
  } else {
    if (aMantissa >= bMantissa) {
      resultMantissa = aMantissa - bMantissa
      resultSign = aSign
    } else {
      resultMantissa = bMantissa - aMantissa
      resultSign = bSign
    }
    steps.push(`   Different signs: subtracted smaller from larger. Result sign: ${resultSign === 0 ? '+' : '-'}.`)
  }

  steps.push(`Step 5: Normalize the result.`)

  if (resultMantissa === 0n) {
    steps.push(`   Result is zero.`)
    const resultBits = numToBits(resultSign === 1 ? -0 : 0)
    const resultBin = bitsToStr(resultBits)
    return {
      operand1Decimal: formatDecimal(a), operand2Decimal: formatDecimal(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
      resultDecimal: resultSign === 1 ? '-0' : '0', steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Result is zero' }
    }
  }

  if (resultMantissa & (1n << 56n)) {
    const sticky = resultMantissa & 1n
    resultMantissa = (resultMantissa >> 1n) | sticky
    resultExp++
    steps.push(`   Overflowed 55-bit threshold — right-shifted by 1, exp now ${resultExp}.`)
  } else {
    while ((resultMantissa & (1n << 55n)) === 0n && resultExp > 1 && resultMantissa > 0n) {
      resultMantissa <<= 1n
      resultExp--
    }
  }

  if ((resultMantissa & (1n << 55n)) === 0n) {
    resultExp = 0
    steps.push(`   Result falls into Subnormal range. Biased exponent forced to 0.`)
  }

  steps.push(`Step 6: Apply GRS rounding.`)
  const G = Number((resultMantissa >> 2n) & 1n)
  const R = Number((resultMantissa >> 1n) & 1n)
  const S = Number(resultMantissa & 1n)
  const truncated = resultMantissa >> 3n

  const { rounded, grs } = evaluateGRS(truncated, G, R, S, steps)

  let finalRounded = rounded
  if (finalRounded & (1n << 53n)) {
    finalRounded >>= 1n
    resultExp++
    steps.push(`   Rounding caused carry — exponent incremented to ${resultExp}.`)
  }

  let finalExp = resultExp
  let finalFrac = finalRounded & 0x000FFFFFFFFFFFFFn

  if (finalExp >= MAX_EXP_STORED) {
    finalExp = MAX_EXP_STORED
    finalFrac = 0n
    steps.push(`   Overflow detected: result exponent >= ${MAX_EXP_STORED}. Rounding to Infinity.`)
  }

  const resultBits = (BigInt(resultSign) << 63n) | (BigInt(finalExp) << 52n) | finalFrac
  const resultBin = bitsToStr(resultBits)
  const resultNum = bitsToNum(resultBits)

  steps.push(`Final Assembly: ${formatBinary(resultBin)}`)
  steps.push(`Decimal Result: ${formatDecimal(resultNum)}`)

  return {
    operand1Decimal: formatDecimal(a), operand2Decimal: formatDecimal(b),
    operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
    resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
    resultDecimal: formatDecimal(resultNum), steps, grsInfo: grs
  }
}

// ===== MULTIPLICATION =====
export function multiplyIEEE754(a: number, b: number): ArithmeticResult {
  const steps: string[] = []
  const aBits = numToBits(a)
  const bBits = numToBits(b)
  const aBin  = bitsToStr(aBits)
  const bBin  = bitsToStr(bBits)

  steps.push(`Operation: (${formatDecimal(a)}) × (${formatDecimal(b)})`)
  steps.push(`Step 1: Extract IEEE 754 fields.`)
  steps.push(`   Operand A: ${formatBinary(aBin)}`)
  steps.push(`   Operand B: ${formatBinary(bBin)}`)

  const aSign = Number(aBits >> 63n)
  const bSign = Number(bBits >> 63n)
  const aExp  = Number((aBits >> 52n) & 0x7FFn)
  const bExp  = Number((bBits >> 52n) & 0x7FFn)
  const aFrac = aBits & 0x000FFFFFFFFFFFFFn
  const bFrac = bBits & 0x000FFFFFFFFFFFFFn

  const resultSign = aSign ^ bSign
  steps.push(`   A: sign=${aSign}, biased_exp=${aExp}`)
  steps.push(`   B: sign=${bSign}, biased_exp=${bExp}`)
  steps.push(`Step 2: Result sign = A_sign XOR B_sign = ${resultSign}`)

  if (!Number.isFinite(a) || !Number.isFinite(b) || Number.isNaN(a) || Number.isNaN(b) || a === 0 || b === 0) {
    const result = a * b
    const resultBits = numToBits(result)
    const resultBin = bitsToStr(resultBits)
    steps.push(`Step 3: Special-case detected. Result = ${formatDecimal(result)}`)
    steps.push(`   -> Final Assembly: ${formatBinary(resultBin)}`)
    return {
      operand1Decimal: formatDecimal(a), operand2Decimal: formatDecimal(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
      resultDecimal: formatDecimal(result), steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Special case (no GRS needed)' }
    }
  }

  let aExpEff = aExp === 0 ? 1 : aExp
  let bExpEff = bExp === 0 ? 1 : bExp
  let aMantissa = (BigInt(aExp === 0 ? 0 : 1) << 52n) | aFrac
  let bMantissa = (BigInt(bExp === 0 ? 0 : 1) << 52n) | bFrac

  let resultExp = aExpEff + bExpEff - EXPONENT_BIAS
  steps.push(`Step 3: Base Result biased exponent = ${aExpEff} + ${bExpEff} - ${EXPONENT_BIAS} = ${resultExp}`)

  steps.push(`Step 4: Multiply significands.`)
  steps.push(`   A significand: 0x${aMantissa.toString(16)}`)
  steps.push(`   B significand: 0x${bMantissa.toString(16)}`)

  let product = aMantissa * bMantissa
  steps.push(`   Raw product (104-bit fractional alignment): 0x${product.toString(16)}`)

  steps.push(`Step 5: Normalize product.`)
  if (product & (1n << 105n)) {
    const sticky = product & 1n
    product = (product >> 1n) | sticky
    resultExp++
    steps.push(`   Product overflowed to 2.0+ — right-shifted by 1, exp now ${resultExp}.`)
  }

  while ((product & (1n << 104n)) === 0n && resultExp > 1 && product > 0n) {
    product <<= 1n
    resultExp--
  }

  if (resultExp < 1) {
    const denormShift = 1 - resultExp
    const shiftSafe = denormShift > 106 ? 106 : denormShift
    const dropped = product & ((1n << BigInt(shiftSafe)) - 1n)
    const sticky = dropped > 0n ? 1n : 0n
    product = (product >> BigInt(shiftSafe)) | sticky
    resultExp = 0
    steps.push(`   Underflow! Shifting product right by ${shiftSafe} for Subnormal alignment.`)
  } else if ((product & (1n << 104n)) === 0n) {
    resultExp = 0
  }

  steps.push(`Step 6: Apply GRS rounding to aligned product.`)
  const G = Number((product >> 51n) & 1n)
  const R = Number((product >> 50n) & 1n)
  const S = Number((product & ((1n << 50n) - 1n)) > 0n ? 1n : 0n)
  const truncated = product >> 52n

  const { rounded, grs } = evaluateGRS(truncated, G, R, S, steps)

  let finalRounded = rounded
  if (finalRounded & (1n << 53n)) {
    finalRounded >>= 1n
    resultExp++
    steps.push(`   Rounding caused carry — exponent incremented to ${resultExp}.`)
  }

  let finalExp = resultExp
  let finalFrac = finalRounded & 0x000FFFFFFFFFFFFFn

  if (finalExp >= MAX_EXP_STORED) {
    finalExp = MAX_EXP_STORED
    finalFrac = 0n
    steps.push(`   Overflow detected: result exponent >= ${MAX_EXP_STORED}. Rounding to Infinity.`)
  }

  const resultBits = (BigInt(resultSign) << 63n) | (BigInt(finalExp) << 52n) | finalFrac
  const resultBin = bitsToStr(resultBits)
  const resultNum = bitsToNum(resultBits)

  steps.push(`Final Assembly: ${formatBinary(resultBin)}`)
  steps.push(`Decimal Result: ${formatDecimal(resultNum)}`)

  return {
    operand1Decimal: formatDecimal(a), operand2Decimal: formatDecimal(b),
    operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
    resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
    resultDecimal: formatDecimal(resultNum), steps, grsInfo: grs
  }
}