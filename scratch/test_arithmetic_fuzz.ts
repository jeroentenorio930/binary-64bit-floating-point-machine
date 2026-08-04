import { addIEEE754, multiplyIEEE754 } from '../src/utils/arithmetic_logic'

const buf = new ArrayBuffer(8)
const f64 = new Float64Array(buf)
const u64 = new BigUint64Array(buf)

function numToBits(n: number): bigint {
  f64[0] = n
  return u64[0]
}

function bitsToNum(b: bigint): number {
  u64[0] = b
  return f64[0]
}

function getRandomF64() {
  const bytes = new Uint8Array(8)
  for (let i = 0; i < 8; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return new Float64Array(bytes.buffer)[0]
}

const specialValues = [
  0, -0, 1, -1,
  Math.pow(2, -1022), // Smallest normal
  -Math.pow(2, -1022),
  Math.pow(2, -1074), // Smallest subnormal
  -Math.pow(2, -1074),
  Number.MAX_VALUE,
  -Number.MAX_VALUE,
  Infinity,
  -Infinity,
  NaN,
  5e-324,
  -5e-324,
  0.5,
  -0.5,
  1.5,
  3,
  0.1, 0.2, 0.3
]

// Add randoms
for (let i = 0; i < 1000; i++) {
  specialValues.push(getRandomF64())
}

let failsAdd = 0
let failsMul = 0

function formatHex(b: bigint) {
  return b.toString(16).padStart(16, '0').toUpperCase()
}

console.log('Testing additions...')
for (let i = 0; i < 5000; i++) {
  const a = specialValues[Math.floor(Math.random() * specialValues.length)]
  const b = specialValues[Math.floor(Math.random() * specialValues.length)]
  const expected = a + b
  const result = addIEEE754(a, b)
  const actualBits = BigInt(result.resultHex.startsWith('0x') ? result.resultHex : '0x' + result.resultHex)
  const expectedBits = numToBits(expected)
  
  if (actualBits !== expectedBits && !(Number.isNaN(expected) && Number.isNaN(bitsToNum(actualBits)))) {
    console.error('ADD FAIL: ' + a + ' + ' + b)
    console.error('  Expected: ' + formatHex(expectedBits) + ' (' + expected + ')')
    console.error('  Actual:   ' + formatHex(actualBits) + ' (' + result.resultDecimal + ')')
    failsAdd++
    if (failsAdd > 10) break
  }
}

console.log('Testing multiplications...')
for (let i = 0; i < 5000; i++) {
  const a = specialValues[Math.floor(Math.random() * specialValues.length)]
  const b = specialValues[Math.floor(Math.random() * specialValues.length)]
  const expected = a * b
  const result = multiplyIEEE754(a, b)
  const actualBits = BigInt(result.resultHex.startsWith('0x') ? result.resultHex : '0x' + result.resultHex)
  const expectedBits = numToBits(expected)
  
  if (actualBits !== expectedBits && !(Number.isNaN(expected) && Number.isNaN(bitsToNum(actualBits)))) {
    console.error('MUL FAIL: ' + a + ' * ' + b)
    console.error('  Expected: ' + formatHex(expectedBits) + ' (' + expected + ')')
    console.error('  Actual:   ' + formatHex(actualBits) + ' (' + result.resultDecimal + ')')
    failsMul++
    if (failsMul > 10) break
  }
}

console.log('Done. Addition fails: ' + failsAdd + ', Multiplication fails: ' + failsMul)
