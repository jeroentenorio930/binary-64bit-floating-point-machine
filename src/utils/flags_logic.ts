// src/utils/flags_logic.ts
// Single source of truth for IEEE 754 Exception Flag calculations

export interface ExceptionFlags {
  inv: boolean // Invalid Operation
  of:  boolean // Overflow
  uf:  boolean // Underflow
  inx: boolean // Inexact
}

export const SMALLEST_NORMAL_DOUBLE = Math.pow(2, -1022) // ~2.2250738585072014e-308
export const MAX_DOUBLE = Number.MAX_VALUE                // ~1.7976931348623157e+308

/**
 * Case-insensitive decimal string parser.
 * JavaScript's native Number("infinity") returns NaN, so we handle infinity case-insensitively.
 */
export function parseDecimalString(str: string): number {
  const lower = str.trim().toLowerCase()
  if (lower === 'nan') return NaN
  if (lower === 'infinity' || lower === '+infinity') return Infinity
  if (lower === '-infinity') return -Infinity
  return Number(str)
}

/**
 * Returns true if the decimal input string can be represented exactly in IEEE 754 double precision.
 * A decimal fraction p / 10^n is exactly representable in binary iff 5^n divides p.
 */
export function isExactlyRepresentable(inputStr: string): boolean {
  const clean = inputStr.trim().toLowerCase()
  if (clean === 'nan') return true
  if (clean === 'infinity' || clean === '+infinity' || clean === '-infinity') return true

  const asNum = parseDecimalString(inputStr)
  if (!Number.isFinite(asNum)) return false // overflow case like 2e308 is not exactly representable

  const noSign = clean.replace(/^[+-]/, '')
  const parts = noSign.split('.')
  const intStr = parts[0] || '0'
  const fracStr = parts[1] || ''
  const n = fracStr.length

  if (n === 0) return Number.isInteger(asNum) // e.g. 5e-324 has n=0 in string format but is not an integer

  try {
    const p = BigInt(intStr.replace(/e.*/i, '') + fracStr)
    const fivePow = 5n ** BigInt(n)
    return p % fivePow === 0n
  } catch {
    return false
  }
}

/**
 * Compute Exception Flags for Decimal ↔ IEEE 754 Conversion (Encoding / Decoding)
 */
export function computeConversionFlags(
  input: string,
  isDecode: boolean,
  error?: string,
  resultDecimal?: string
): ExceptionFlags {
  if (error) {
    return { inv: true, of: false, uf: false, inx: false }
  }

  const cleanInput = input.trim().toLowerCase()

  if (isDecode) {
    // Decoding 64-bit IEEE 754 bits back to Decimal (exact bit inspection)
    const decVal = (resultDecimal || '').toLowerCase()
    const num = parseDecimalString(resultDecimal || '')
    const absNum = Math.abs(num)

    const isNaNVal = decVal.includes('nan') || Number.isNaN(num)
    const isOverflowVal = !isNaNVal && (absNum > MAX_DOUBLE || !Number.isFinite(num) || decVal.includes('infinity'))
    const isUnderflowVal = !isNaNVal && absNum > 0 && absNum < SMALLEST_NORMAL_DOUBLE

    return {
      inv: isNaNVal,
      of: isOverflowVal,
      uf: isUnderflowVal,
      inx: false, // Bit-exact decoding never causes inexact precision loss
    }
  }

  // Encoding Decimal → IEEE 754 Binary
  const num = parseDecimalString(input)
  const absNum = Math.abs(num)

  const isNaNVal = Number.isNaN(num) || cleanInput.includes('nan')
  const isInfinityLiteral = cleanInput === 'infinity' || cleanInput === '+infinity' || cleanInput === '-infinity'
  const isOverflowVal = !isNaNVal && !isInfinityLiteral && (absNum > MAX_DOUBLE || !Number.isFinite(num))

  // Per IEEE 754: Overflow always implies Inexact
  const isInexactVal = !isNaNVal && (!isExactlyRepresentable(input) || isOverflowVal)

  // Per IEEE 754: Underflow requires the result to be tiny AND inexact
  const isUnderflowVal = !isNaNVal && absNum > 0 && absNum < SMALLEST_NORMAL_DOUBLE && isInexactVal

  return {
    inv: isNaNVal,
    of: isOverflowVal,
    uf: isUnderflowVal,
    inx: isInexactVal,
  }
}

/**
 * Helper to parse binary float (e.g., "1.101") or decimal float to JavaScript number
 */
export function parseToNumber(str: string, base: 2 | 10): number {
  const clean = str.trim()
  if (clean.toLowerCase() === 'nan') return NaN
  if (clean.toLowerCase() === 'infinity' || clean.toLowerCase() === '+infinity') return Infinity
  if (clean.toLowerCase() === '-infinity') return -Infinity

  const isNeg = clean.startsWith('-')
  const unsigned = isNeg || clean.startsWith('+') ? clean.slice(1) : clean

  if (base === 10) {
    return parseDecimalString(str)
  } else {
    const parts = unsigned.split('.')
    const intPart = parseInt(parts[0] || '0', 2)
    const fracPart = parts[1] || ''
    let fracVal = 0
    for (let i = 0; i < fracPart.length; i++) {
      if (fracPart[i] === '1') {
        fracVal += Math.pow(2, -(i + 1))
      }
    }
    return (isNeg ? -1 : 1) * (intPart + fracVal)
  }
}

/**
 * Compute Exception Flags for Rounding Operations (Base 2 / Base 10)
 */
export function computeRoundingFlags(
  input: string,
  base: 2 | 10,
  digits: number,
  roundNearestEvenResult: string,
  error?: string
): ExceptionFlags {
  if (error) {
    return { inv: true, of: false, uf: false, inx: false }
  }

  const cleanInput = input.trim().replace(/^[+-]/, '')
  const parts = cleanInput.split('.')
  const fracPart = parts[1] || ''
  const droppedFrac = fracPart.slice(digits)
  const hasRemainder = /[^0]/.test(droppedFrac)

  const numVal = parseToNumber(input, base)
  const roundedVal = parseToNumber(roundNearestEvenResult, base)
  const absVal = Math.abs(numVal)
  const absRounded = Math.abs(roundedVal)

  const isInv = Number.isNaN(numVal) && input.toLowerCase() !== 'nan'
  const isOf = !Number.isNaN(numVal) && (absVal > MAX_DOUBLE || absRounded > MAX_DOUBLE)
  const isInx = hasRemainder || isOf
  // Underflow: tiny AND inexact
  const isUf = !Number.isNaN(numVal) && absVal > 0 && isInx && (absRounded === 0 || absRounded < SMALLEST_NORMAL_DOUBLE)

  return {
    inv: isInv,
    of: isOf,
    uf: isUf,
    inx: isInx,
  }
}

/**
 * Compute Exception Flags for Arithmetic Operations (Addition & Multiplication)
 */
export function computeArithmeticFlags(
  valA: number,
  valB: number,
  resultDecimal: string,
  grsInfo: { guard: number; round: number; sticky: number }
): ExceptionFlags {
  const resNum = Number(resultDecimal)
  const absRes = Math.abs(resNum)
  const resDecLower = resultDecimal.toLowerCase()

  const isNaNVal = Number.isNaN(resNum) || resDecLower.includes('nan') || Number.isNaN(valA) || Number.isNaN(valB)

  const operandsFinite = Number.isFinite(valA) && Number.isFinite(valB)
  const isOverflowVal = !isNaNVal && operandsFinite && (absRes > MAX_DOUBLE || !Number.isFinite(resNum) || resDecLower.includes('infinity'))

  // Overflow always implies Inexact; GRS non-zero also implies Inexact
  const isInexactVal = grsInfo.guard === 1 || grsInfo.round === 1 || grsInfo.sticky === 1 || isOverflowVal

  const operandsNonZero = valA !== 0 && valB !== 0 && operandsFinite
  // Underflow: tiny AND inexact
  const isUnderflowVal = !isNaNVal && operandsNonZero && isInexactVal && (absRes === 0 || (absRes > 0 && absRes < SMALLEST_NORMAL_DOUBLE))

  const finalInexact = isInexactVal || isUnderflowVal

  return {
    inv: isNaNVal,
    of: isOverflowVal,
    uf: isUnderflowVal,
    inx: finalInexact,
  }
}
