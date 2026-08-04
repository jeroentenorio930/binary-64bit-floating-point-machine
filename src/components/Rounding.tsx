import { useState } from 'react'
import { calculateRounding, type RoundingResult } from '../utils/rounding_logic'
import { StepsLog } from './StepsLog'
import { ExceptionFlagsDisplay, type ExceptionFlags } from './ExceptionFlags'

const SMALLEST_NORMAL_DOUBLE = Math.pow(2, -1022)
const MAX_DOUBLE = Number.MAX_VALUE

const QUICK_EXAMPLES = [
  { label: '2.35 → 1 decimal (base 10)', input: '2.35', base: 10 as const, digits: 1 },
  { label: '1.101 → 2 bits (base 2)',    input: '1.101', base: 2 as const, digits: 2 },
  { label: '-0.15 → 1 decimal',          input: '-0.15',  base: 10 as const, digits: 1 },
  { label: '1.11011 → 3 bits',           input: '1.11011', base: 2 as const, digits: 3 },
]

function ResultRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <tr>
      <td><span className="method-name">{label}</span></td>
      <td>
        <span className="method-result" style={accent ? { color: 'var(--cyan)' } : undefined}>
          {value}
        </span>
      </td>
    </tr>
  )
}

export function Rounding() {
  const [input, setInput]   = useState('')
  const [base, setBase]     = useState<2 | 10>(10)
  const [digits, setDigits] = useState(3)
  const [result, setResult] = useState<RoundingResult | null>(null)
  const [error, setError]   = useState('')
  const [flags, setFlags]   = useState<ExceptionFlags>({
    inv: false,
    of: false,
    uf: false,
    inx: false,
  })

  function validate(val: string, b: 2 | 10): boolean {
    const trimmed = val.trim().replace(/^[+-]/, '')
    const parts   = trimmed.split('.')
    if (parts.length > 2) return false
    const charset = b === 2 ? /^[01]+$/ : /^\d+$/
    return parts.every(p => p === '' || charset.test(p))
  }

  function handleCalculate() {
    if (!input.trim()) {
      setError('Please enter a value.')
      setFlags({ inv: false, of: false, uf: false, inx: false })
      return
    }
    if (!validate(input, base)) {
      setError(`Invalid ${base === 2 ? 'binary' : 'decimal'} number. Use only digits 0-9${base === 2 ? ' and 1' : ''}.`)
      setFlags({ inv: true, of: false, uf: false, inx: false })
      return
    }
    if (digits < 0) {
      setError('Target digits cannot be negative.')
      setFlags({ inv: true, of: false, uf: false, inx: false })
      return
    }

    const res = calculateRounding(input, base, digits)
    setResult(res)
    setError('')

    // Helper to parse binary or decimal float to number
    const parseToNumber = (str: string, b: 2 | 10): number => {
      const clean = str.trim();
      const isNeg = clean.startsWith('-');
      const unsigned = isNeg || clean.startsWith('+') ? clean.slice(1) : clean;
      if (b === 10) {
        return Number(str);
      } else {
        const parts = unsigned.split('.');
        const intPart = parseInt(parts[0] || '0', 2);
        const fracPart = parts[1] || '';
        let fracVal = 0;
        for (let i = 0; i < fracPart.length; i++) {
          if (fracPart[i] === '1') {
            fracVal += Math.pow(2, -(i + 1));
          }
        }
        return (isNeg ? -1 : 1) * (intPart + fracVal);
      }
    };

    // Compute CPU Exception Flags during rounding
    const cleanInput = input.trim().replace(/^[+-]/, '')
    const parts = cleanInput.split('.')
    const fracPart = parts[1] || ''
    const droppedFrac = fracPart.slice(digits)
    const hasRemainder = /[^0]/.test(droppedFrac)

    const numVal = parseToNumber(input, base)
    const roundedVal = parseToNumber(res.roundNearestEven, base)
    const absVal = Math.abs(numVal)
    const absRounded = Math.abs(roundedVal)

    const isInv = Number.isNaN(numVal) && input.toLowerCase() !== 'nan'
    const isOf = !Number.isNaN(numVal) && absVal > MAX_DOUBLE
    const isInx = hasRemainder
    // Underflow: tiny AND inexact (e.g. non-zero input rounds to subnormal/zero and is inexact)
    const isUf = !Number.isNaN(numVal) && absVal > 0 && isInx && (absRounded === 0 || absRounded < SMALLEST_NORMAL_DOUBLE)

    setFlags({
      inv: isInv,
      of: isOf,
      uf: isUf,
      inx: isInx,
    })
  }

  function applyExample(ex: typeof QUICK_EXAMPLES[0]) {
    setInput(ex.input)
    setBase(ex.base)
    setDigits(ex.digits)

    const res = calculateRounding(ex.input, ex.base, ex.digits)
    setResult(res)
    setError('')

    const cleanInput = ex.input.trim().replace(/^[+-]/, '')
    const parts = cleanInput.split('.')
    const fracPart = parts[1] || ''
    const droppedFrac = fracPart.slice(ex.digits)
    const hasRemainder = /[^0]/.test(droppedFrac)

    setFlags({
      inv: false,
      of: false,
      uf: false,
      inx: hasRemainder,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCalculate()
  }

  return (
    <section id="rounding-section" aria-labelledby="rounding-heading">
      <div className="panel">
        <h2 id="rounding-heading">Rounding Methods</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          Enter a number in decimal or binary, choose a target number of fractional digits, and
          compare all four rounding methods: <em>Chopping</em>, <em>Round-Up</em>, <em>Round-Down</em>,
          and <em>Round-to-Nearest Ties-to-Even</em>.
        </p>

        {/* Quick Examples */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem', alignSelf: 'center' }}>Quick examples:</span>
          {QUICK_EXAMPLES.map(ex => (
            <button
              key={ex.label}
              id={`example-${ex.input.replace('.','')}-btn`}
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', color: 'var(--purple)', borderColor: 'var(--purple)' }}
              onClick={() => applyExample(ex)}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="round-input">Number</label>
            <input
              id="round-input"
              type="text"
              placeholder={base === 2 ? 'e.g. 1.101011' : 'e.g. 2.35'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="form-group" style={{ maxWidth: '160px' }}>
            <label htmlFor="round-base">Number Base</label>
            <select
              id="round-base"
              value={base}
              onChange={e => setBase(Number(e.target.value) as 2 | 10)}
            >
              <option value={10}>Base 10 (Decimal)</option>
              <option value={2}>Base 2 (Binary)</option>
            </select>
          </div>

          <div className="form-group" style={{ maxWidth: '160px' }}>
            <label htmlFor="round-digits">Target Fraction Digits</label>
            <input
              id="round-digits"
              type="number"
              min={0}
              max={20}
              value={digits}
              onChange={e => setDigits(Number(e.target.value))}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button id="round-calculate-btn" className="btn-green" onClick={handleCalculate}>
            Calculate ▸
          </button>
        </div>

        <ExceptionFlagsDisplay flags={flags} />

        {error && <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>⚠ {error}</p>}

        {result && (
          <>
            <hr className="divider" />
            <h3>Results for <code>{result.original}</code> → {result.targetLength} fraction digit{result.targetLength !== 1 ? 's' : ''}</h3>

            <table className="rounding-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <ResultRow label="Chopping (Truncation)" value={result.chopped} />
                <ResultRow label="Round Up (→ +∞)" value={result.roundUp} />
                <ResultRow label="Round Down (→ −∞)" value={result.roundDown} />
                <ResultRow label="Round-to-Nearest Ties-to-Even" value={result.roundNearestEven} accent />
              </tbody>
            </table>

            <StepsLog steps={result.steps} defaultOpen={true} />
          </>
        )}
      </div>
    </section>
  )
}
