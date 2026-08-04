import { useState } from 'react'
import {
  addIEEE754,
  multiplyIEEE754,
  parseOperand,
  type ArithmeticResult,
} from '../utils/arithmetic_logic'
import { computeArithmeticFlags } from '../utils/flags_logic'
import { StepsLog } from './StepsLog'
import { ExceptionFlagsDisplay, type ExceptionFlags } from './ExceptionFlags'

// ── GRS Badge ─────────────────────────────────────────────────────────────────

function GRSBadge({ g, r, s }: { g: number; r: number; s: number }) {
  const color = (v: number) => v === 1 ? 'var(--yellow)' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>GRS:</span>
      {[['G', g], ['R', r], ['S', s]].map(([label, val]) => (
        <span
          key={label as string}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            color: color(val as number),
            border: `1px solid ${color(val as number)}`,
            borderRadius: '4px',
            padding: '0.1rem 0.6rem',
            background: (val as number) === 1 ? 'rgba(255,255,85,0.1)' : 'rgba(0,0,0,0.2)',
            minWidth: '2.5rem',
            textAlign: 'center',
          }}
        >
          {label}={val}
        </span>
      ))}
    </div>
  )
}

// ── Result Row ─────────────────────────────────────────────────────────────────

function ResultSection({ result }: { result: ArithmeticResult }) {
  return (
    <>
      <hr className="divider" />
      <h3>Result</h3>

      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
        <div className="result-block">
          <div className="result-label">Operand A</div>
          <div className="result-value small">{result.operand1Binary}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            = {result.operand1Decimal}
          </div>
        </div>
        <div className="result-block">
          <div className="result-label">Operand B</div>
          <div className="result-value small">{result.operand2Binary}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            = {result.operand2Decimal}
          </div>
        </div>
      </div>

      <div className="result-block">
        <div className="result-label">Result — IEEE 754 Binary (64-bit)</div>
        <div className="result-value small" style={{ color: 'var(--cyan)' }}>{result.resultBinary}</div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
        <div className="result-block">
          <div className="result-label">Result — Hexadecimal</div>
          <div className="result-value" style={{ fontSize: '1.3rem' }}>{result.resultHex}</div>
        </div>
        <div className="result-block">
          <div className="result-label">Result — Decimal</div>
          <div className="result-value" style={{ color: 'var(--green)', fontSize: '1.5rem' }}>
            {result.resultDecimal}
          </div>
        </div>
      </div>

      {/* GRS Info */}
      <div className="result-block">
        <div className="result-label">GRS (Guard · Round · Sticky) Info</div>
        <GRSBadge g={result.grsInfo.guard} r={result.grsInfo.round} s={result.grsInfo.sticky} />
        <div style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: '#A0B0CC' }}>
          {result.grsInfo.action}
        </div>
      </div>

      <StepsLog steps={result.steps} defaultOpen={true} />
    </>
  )
}

// ── Quick Examples ─────────────────────────────────────────────────────────────

const EXAMPLES = {
  addition: [
    { label: '1.5 + 2.5',     a: '1.5',    b: '2.5' },
    { label: '0.1 + 0.2',     a: '0.1',    b: '0.2' },
    { label: '1e308 + 1e308', a: '1e308',  b: '1e308' },
    { label: '-3.14 + 3.14',  a: '-3.14',  b: '3.14' },
  ],
  multiplication: [
    { label: '1.5 × 2.0',     a: '1.5',    b: '2.0' },
    { label: '0.1 × 0.2',     a: '0.1',    b: '0.2' },
    { label: '3.14 × −1',     a: '3.14',   b: '-1' },
    { label: '1e200 × 1e200', a: '1e200',  b: '1e200' },
  ],
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Op = 'addition' | 'multiplication'

export function Arithmetic() {
  const [op, setOp]         = useState<Op>('addition')
  const [a, setA]           = useState('')
  const [b, setB]           = useState('')
  const [result, setResult] = useState<ArithmeticResult | null>(null)
  const [error, setError]   = useState('')
  const [flags, setFlags]   = useState<ExceptionFlags>({
    inv: false,
    of: false,
    uf: false,
    inx: false,
  })

  function handleCompute() {
    if (!a.trim() || !b.trim()) {
      setError('Please fill in both operands.')
      setFlags({ inv: false, of: false, uf: false, inx: false })
      return
    }

    const parsedA = parseOperand(a)
    const parsedB = parseOperand(b)

    if (!parsedA) {
      setError('Operand A is invalid. Enter a decimal number, 16-char hex, or 64-bit binary.')
      setFlags({ inv: true, of: false, uf: false, inx: false })
      return
    }
    if (!parsedB) {
      setError('Operand B is invalid. Enter a decimal number, 16-char hex, or 64-bit binary.')
      setFlags({ inv: true, of: false, uf: false, inx: false })
      return
    }

    setError('')
    const res = op === 'addition'
      ? addIEEE754(parsedA.value, parsedB.value)
      : multiplyIEEE754(parsedA.value, parsedB.value)
    setResult(res)
    setFlags(computeArithmeticFlags(parsedA.value, parsedB.value, res.resultDecimal, res.grsInfo))
  }

  function applyExample(ex: { a: string; b: string }) {
    setA(ex.a)
    setB(ex.b)
    setError('')
    const parsedA = parseOperand(ex.a)!
    const parsedB = parseOperand(ex.b)!
    const res = op === 'addition'
      ? addIEEE754(parsedA.value, parsedB.value)
      : multiplyIEEE754(parsedA.value, parsedB.value)
    setResult(res)
    setFlags(computeArithmeticFlags(parsedA.value, parsedB.value, res.resultDecimal, res.grsInfo))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCompute()
  }

  const examples = EXAMPLES[op]

  return (
    <section id="arithmetic-section" aria-labelledby="arithmetic-heading">
      <div className="panel">
        <h2 id="arithmetic-heading">Arithmetic Operations (GRS Method)</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          Enter two operands in <em>decimal</em>, <em>16-char hex</em>, or <em>64-bit binary</em> format.
          Select an operation to see the full GRS-method step-by-step trace and the IEEE 754 result.
        </p>

        {/* Operation selector */}
        <div className="mode-toggle" style={{ marginBottom: '1.25rem' }}>
          <button
            id="op-add-btn"
            className={op === 'addition' ? 'btn-active' : ''}
            onClick={() => { setOp('addition'); setResult(null) }}
          >
            Addition ( A + B )
          </button>
          <button
            id="op-mul-btn"
            className={op === 'multiplication' ? 'btn-active' : ''}
            onClick={() => { setOp('multiplication'); setResult(null) }}
          >
            Multiplication ( A × B )
          </button>
        </div>

        {/* Quick examples */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Quick examples:</span>
          {examples.map(ex => (
            <button
              key={ex.label}
              id={`arith-ex-${ex.label.replace(/[^a-z0-9]/gi, '')}-btn`}
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', color: 'var(--purple)', borderColor: 'var(--purple)' }}
              onClick={() => applyExample(ex)}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="arith-a">Operand A</label>
            <input
              id="arith-a"
              type="text"
              placeholder="decimal / 16 hex chars / 64 binary bits"
              value={a}
              onChange={e => setA(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div style={{ alignSelf: 'flex-end', paddingBottom: '0.6rem', color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
            {op === 'addition' ? '+' : '×'}
          </div>
          <div className="form-group">
            <label htmlFor="arith-b">Operand B</label>
            <input
              id="arith-b"
              type="text"
              placeholder="decimal / 16 hex chars / 64 binary bits"
              value={b}
              onChange={e => setB(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button id="arith-compute-btn" className="btn-green" onClick={handleCompute}>
            Compute ▸
          </button>
        </div>

        <ExceptionFlagsDisplay flags={flags} />

        {error && <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>⚠ {error}</p>}

        {result && <ResultSection result={result} />}
      </div>
    </section>
  )
}
