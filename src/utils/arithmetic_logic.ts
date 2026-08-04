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

/** Parse either decimal or hex (16 chars) or binary (64 chars) into a JS number. */
export function parseOperand(raw: string): { value: number; displayDecimal: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Try hex: 16 hex chars (with or without 0x prefix)
  const hexClean = trimmed.toUpperCase().replace(/^0X/, '')
  if (/^[0-9A-F]{16}$/.test(hexClean)) {
    const bits = BigInt('0x' + hexClean)
    const v = bitsToNum(bits)
    return { value: v, displayDecimal: String(v) }
  }

  // Try 64-bit binary string
  if (/^[01]{64}$/.test(trimmed)) {
    const bits = BigInt('0b' + trimmed)
    const v = bitsToNum(bits)
    return { value: v, displayDecimal: String(v) }
  }

  // Try decimal
  const lower = trimmed.toLowerCase()
  if (lower === 'nan')      return { value: NaN,       displayDecimal: 'NaN' }
  if (lower === 'infinity'  || lower === '+infinity') return { value: Infinity,  displayDecimal: 'Infinity' }
  if (lower === '-infinity') return { value: -Infinity, displayDecimal: '-Infinity' }

  const n = Number(trimmed)
  if (!isNaN(n) || trimmed === 'NaN') return { value: n, displayDecimal: String(n) }

  return null
}

// ===== GRS ROUNDING =====
// Given a 106-bit integer significand (for addition) or 105-bit (for mult),
// extract GRS bits beyond position `guardPos` from the right and round.
function applyGRS(
  mantissa105: bigint,
  totalBits: number,
  steps: string[]
): { rounded: bigint; grs: GRSInfo } {
  // We need to keep 53 bits (1 hidden + 52 fraction). The rest are GRS.
  const keepBits = 53
  const dropBits = totalBits - keepBits

  const guardMask  = dropBits >= 1 ? (1n << BigInt(dropBits - 1)) : 0n
  const roundMask  = dropBits >= 2 ? (1n << BigInt(dropBits - 2)) : 0n
  const stickyMask = dropBits >= 3 ? (guardMask - 1n)             : 0n

  const G = dropBits >= 1 ? Number((mantissa105 & guardMask)  !== 0n ? 1 : 0) : 0
  const R = dropBits >= 2 ? Number((mantissa105 & roundMask)  !== 0n ? 1 : 0) : 0
  const S = dropBits >= 3 ? Number((mantissa105 & stickyMask) !== 0n ? 1 : 0) : 0

  const truncated = mantissa105 >> BigInt(dropBits)

  steps.push(`GRS Bits: Guard(G)=${G}, Round(R)=${R}, Sticky(S)=${S}`)
  steps.push(`   -> GRS Method: these extra bits determine the rounding direction.`)

  let action = 'Truncate (G=0)'
  let rounded = truncated

  // Round-to-nearest ties-to-even
  if (G === 1) {
    if (R === 1 || S === 1) {
      // Strictly above halfway → round up
      action = 'Round Up (G=1 and (R=1 or S=1) → strictly above halfway)'
      rounded = truncated + 1n
    } else {
      // Exactly halfway → ties-to-even
      const lsb = truncated & 1n
      if (lsb === 1n) {
        action = 'Round Up (Ties-to-Even: LSB was odd → increment to make even)'
        rounded = truncated + 1n
      } else {
        action = 'Truncate (Ties-to-Even: LSB was already even → no increment)'
        rounded = truncated
      }
    }
  }

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

  steps.push(`Operation: (${a}) + (${b})`)
  steps.push(`Step 1: Extract IEEE 754 fields.`)
  steps.push(`   Operand A: ${formatBinary(aBin)}`)
  steps.push(`   Operand B: ${formatBinary(bBin)}`)

  // Extract fields
  const aSign = Number(aBits >> 63n)
  const bSign = Number(bBits >> 63n)
  let aExp  = Number((aBits >> 52n) & 0x7FFn)
  let bExp  = Number((bBits >> 52n) & 0x7FFn)
  let aFrac = aBits & 0x000FFFFFFFFFFFFFn
  let bFrac = bBits & 0x000FFFFFFFFFFFFFn

  steps.push(`   A: sign=${aSign}, biased_exp=${aExp}, frac=0x${aFrac.toString(16)}`)
  steps.push(`   B: sign=${bSign}, biased_exp=${bExp}, frac=0x${bFrac.toString(16)}`)

  // Special cases: let JS handle IEEE 754 special values
  if (!isFinite(a) || !isFinite(b) || isNaN(a) || isNaN(b) || a === 0 || b === 0) {
    const result = a + b
    const resultBits = numToBits(result)
    const resultBin = bitsToStr(resultBits)
    steps.push(`Step 2: Special-case detected. Result = ${result}`)
    steps.push(`   -> Final Assembly: ${formatBinary(resultBin)}`)
    return {
      operand1Decimal: String(a), operand2Decimal: String(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
      resultDecimal: String(result), steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Special case (no GRS needed)' }
    }
  }

  // Add hidden bit
  const aHidden = aExp === 0 ? 0n : 1n
  const bHidden = bExp === 0 ? 0n : 1n
  let aMantissa = (aHidden << 52n) | aFrac
  let bMantissa = (bHidden << 52n) | bFrac
  let aExpEffective = aExp === 0 ? 1 : aExp
  let bExpEffective = bExp === 0 ? 1 : bExp

  steps.push(`Step 2: Add hidden bit to significands.`)
  steps.push(`   A mantissa (1.frac): 0x${aMantissa.toString(16)} (biased exp: ${aExpEffective})`)
  steps.push(`   B mantissa (1.frac): 0x${bMantissa.toString(16)} (biased exp: ${bExpEffective})`)

  // Align exponents (shift the smaller one right)
  let expDiff = aExpEffective - bExpEffective
  let resultExp = aExpEffective
  const EXTRA = 3 // guard, round, sticky guard positions

  // Scale mantissas to 55 bits (52 + 3 extra for GRS)
  aMantissa <<= BigInt(EXTRA)
  bMantissa <<= BigInt(EXTRA)

  steps.push(`Step 3: Align exponents. Exponent difference = ${Math.abs(expDiff)}.`)

  if (expDiff > 0) {
    steps.push(`   B is smaller — shift B mantissa right by ${expDiff} bits.`)
    bMantissa >>= BigInt(expDiff)
    resultExp = aExpEffective
  } else if (expDiff < 0) {
    steps.push(`   A is smaller — shift A mantissa right by ${-expDiff} bits.`)
    aMantissa >>= BigInt(-expDiff)
    resultExp = bExpEffective
  } else {
    steps.push(`   Exponents are equal. No alignment needed.`)
  }

  steps.push(`   Aligned A: 0x${aMantissa.toString(16)}`)
  steps.push(`   Aligned B: 0x${bMantissa.toString(16)}`)

  // Add or subtract based on signs
  steps.push(`Step 4: Perform addition/subtraction (considering signs).`)
  let resultSign: number
  let resultMantissa: bigint

  const aPositive = aSign === 0
  const bPositive = bSign === 0

  if (aPositive === bPositive) {
    resultMantissa = aMantissa + bMantissa
    resultSign = aSign
    steps.push(`   Same sign: ${aPositive ? '+' : '-'}A + ${aPositive ? '+' : '-'}B = add magnitudes.`)
  } else {
    if (aMantissa >= bMantissa) {
      resultMantissa = aMantissa - bMantissa
      resultSign = aSign
    } else {
      resultMantissa = bMantissa - aMantissa
      resultSign = bSign
    }
    steps.push(`   Different signs: subtract smaller from larger. Result sign: ${resultSign === 0 ? '+' : '-'}.`)
  }

  steps.push(`   Raw result mantissa: 0x${resultMantissa.toString(16)} (biased exp: ${resultExp})`)

  // Normalize
  steps.push(`Step 5: Normalize the result.`)

  if (resultMantissa === 0n) {
    steps.push(`   Result is zero.`)
    const resultBits = numToBits(resultSign === 1 ? -0 : 0)
    const resultBin = bitsToStr(resultBits)
    return {
      operand1Decimal: String(a), operand2Decimal: String(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
      resultDecimal: resultSign === 1 ? '-0' : '0', steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Result is zero' }
    }
  }

  // Find bit length of resultMantissa
  let mantissaBitLen = resultMantissa.toString(2).length

  if (mantissaBitLen > 55 + 1) {
    // Overflow from addition: right shift by 1 and increment exponent
    const shift = mantissaBitLen - 55 - 1
    resultMantissa >>= BigInt(shift)
    resultExp += shift
    steps.push(`   Overflow after addition — right-shifted by ${shift}, exp now ${resultExp}.`)
    mantissaBitLen = 55 + 1
  } else {
    // Left-normalize to 55+1 bits
    const targetLen = 55 + 1
    while (resultMantissa.toString(2).length < targetLen && resultExp > 1) {
      resultMantissa <<= 1n
      resultExp -= 1
    }
    steps.push(`   Normalized mantissa length: ${resultMantissa.toString(2).length} bits. Biased exp: ${resultExp}`)
  }

  // Now extract GRS bits and truncate to 53 bits (1 hidden + 52 fraction)
  steps.push(`Step 6: Apply GRS rounding.`)
  const totalBits = resultMantissa.toString(2).length
  const { rounded, grs } = applyGRS(resultMantissa, totalBits, steps)

  // If rounding caused overflow of the hidden bit, adjust
  let finalFrac = rounded & 0x000FFFFFFFFFFFFFn
  let overflowCheck = rounded >> 53n
  if (overflowCheck > 0n) {
    finalFrac = rounded >> 1n & 0x000FFFFFFFFFFFFFn
    resultExp += 1
    steps.push(`   Rounding caused carry — exponent incremented to ${resultExp}.`)
  }

  let finalExp = resultExp
  if (finalExp >= MAX_EXP_STORED) {
    finalExp = MAX_EXP_STORED
    finalFrac = 0n
    steps.push(`   Overflow detected: result exponent >= ${MAX_EXP_STORED}. Rounding to Infinity.`)
  }

  const resultBits =
    (BigInt(resultSign) << 63n) |
    (BigInt(finalExp) << 52n) |
    finalFrac

  const resultBin = bitsToStr(resultBits)
  const resultNum = bitsToNum(resultBits)

  steps.push(`Final Assembly: ${formatBinary(resultBin)}`)
  steps.push(`Decimal Result: ${resultNum}`)

  return {
    operand1Decimal: String(a), operand2Decimal: String(b),
    operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
    resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
    resultDecimal: String(resultNum), steps, grsInfo: grs
  }
}

// ===== MULTIPLICATION =====
export function multiplyIEEE754(a: number, b: number): ArithmeticResult {
  const steps: string[] = []
  const aBits = numToBits(a)
  const bBits = numToBits(b)
  const aBin  = bitsToStr(aBits)
  const bBin  = bitsToStr(bBits)

  steps.push(`Operation: (${a}) × (${b})`)
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
  steps.push(`Step 2: Result sign = A_sign XOR B_sign = ${aSign} XOR ${bSign} = ${resultSign}`)

  // Special cases
  if (!isFinite(a) || !isFinite(b) || isNaN(a) || isNaN(b) || a === 0 || b === 0) {
    const result = a * b
    const resultBits2 = numToBits(result)
    const resultBin2 = bitsToStr(resultBits2)
    steps.push(`Step 3: Special-case detected. Result = ${result}`)
    steps.push(`   -> Final Assembly: ${formatBinary(resultBin2)}`)
    return {
      operand1Decimal: String(a), operand2Decimal: String(b),
      operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
      resultBinary: formatBinary(resultBin2), resultHex: formatHex(resultBits2),
      resultDecimal: String(result), steps,
      grsInfo: { guard: 0, round: 0, sticky: 0, action: 'Special case (no GRS needed)' }
    }
  }

  // Exponent: add biased exponents, subtract one bias
  let resultExp = aExp + bExp - EXPONENT_BIAS
  steps.push(`Step 3: Result biased exponent = ${aExp} + ${bExp} - ${EXPONENT_BIAS} = ${resultExp}`)

  // Significand multiplication (53-bit × 53-bit = up to 106-bit product)
  const aHidden = aExp === 0 ? 0n : 1n
  const bHidden = bExp === 0 ? 0n : 1n
  const aMantissa = (aHidden << 52n) | aFrac
  const bMantissa = (bHidden << 52n) | bFrac

  steps.push(`Step 4: Multiply significands.`)
  steps.push(`   A significand (with hidden bit): 0x${aMantissa.toString(16)}`)
  steps.push(`   B significand (with hidden bit): 0x${bMantissa.toString(16)}`)

  let product = aMantissa * bMantissa
  const productLen = product.toString(2).length
  steps.push(`   Raw product (${productLen}-bit): 0x${product.toString(16)}`)

  // Normalize product: should be in range [1.0, 2.0), i.e., bit 105 or 104 is the leading 1
  // A 53-bit × 53-bit product is 105-106 bits. Leading bit at position 104 or 105.
  steps.push(`Step 5: Normalize product.`)

  if (productLen === 106) {
    // Shift right by 1 to normalize
    product >>= 1n
    resultExp += 1
    steps.push(`   Product is 106 bits (overflow) — right-shifted by 1, exp now ${resultExp}.`)
  } else if (productLen < 105) {
    const shift = 105 - productLen
    product <<= BigInt(shift)
    resultExp -= shift
    steps.push(`   Product is ${productLen} bits — left-shifted by ${shift}, exp now ${resultExp}.`)
  } else {
    steps.push(`   Product is exactly 105 bits. No normalization shift needed.`)
  }

  // Now product is 105 bits: 1 hidden + 52 fraction + 52 extra (G,R,S,...)
  steps.push(`Step 6: Apply GRS rounding to 105-bit product.`)
  const { rounded, grs } = applyGRS(product, 105, steps)

  let finalFrac = rounded & 0x000FFFFFFFFFFFFFn
  const overflowCheck = rounded >> 53n
  if (overflowCheck > 0n) {
    finalFrac = rounded >> 1n & 0x000FFFFFFFFFFFFFn
    resultExp += 1
    steps.push(`   Rounding caused carry — exponent incremented to ${resultExp}.`)
  }

  let finalExp = resultExp
  if (finalExp >= MAX_EXP_STORED) {
    finalExp = MAX_EXP_STORED
    finalFrac = 0n
    steps.push(`   Overflow detected: result exponent >= ${MAX_EXP_STORED}. Rounding to Infinity.`)
  } else if (finalExp <= 0) {
    // Result is subnormal (or underflows to zero): stored exponent = 0.
    // 'rounded' is the 53-bit normalised significand (1.fraction).
    // To represent as 0.fraction × 2^(−1022), right-shift by max(0, −resultExp).
    const denormShift = Math.max(0, -resultExp)
    steps.push(`   Subnormal result: exponent ${finalExp} <= 0. Denormalising: right-shift significand by ${denormShift}.`)
    finalFrac = (rounded >> BigInt(denormShift)) & 0x000FFFFFFFFFFFFFn
    finalExp = 0
  }

  const resultBits =
    (BigInt(resultSign) << 63n) |
    (BigInt(finalExp) << 52n) |
    finalFrac

  const resultBin = bitsToStr(resultBits)
  const resultNum = bitsToNum(resultBits)

  steps.push(`Final Assembly: ${formatBinary(resultBin)}`)
  steps.push(`Decimal Result: ${resultNum}`)

  return {
    operand1Decimal: String(a), operand2Decimal: String(b),
    operand1Binary: formatBinary(aBin), operand2Binary: formatBinary(bBin),
    resultBinary: formatBinary(resultBin), resultHex: formatHex(resultBits),
    resultDecimal: String(resultNum), steps, grsInfo: grs
  }
}
