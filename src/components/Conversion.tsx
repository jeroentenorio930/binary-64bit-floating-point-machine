import { useState } from 'react'
import {
  convertDecimalToIEEE754Double,
  convertIEEE754ToDecimal,
  type IEEE754EncodingResult,
  type IEEE754DecodingResult,
} from '../utils/conversion_logic'
import { StepsLog } from './StepsLog'
import { ExceptionFlagsDisplay, type ExceptionFlags } from './ExceptionFlags'
const SMALLEST_NORMAL_DOUBLE = Math.pow(2, -1022)
const MAX_DOUBLE = Number.MAX_VALUE

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseBinaryDisplay(binaryStr: string) {
  // Expects "S EEEEEEEEEEE FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
  const parts = binaryStr.trim().split(' ')
  return {
    sign:     parts[0] ?? '',
    exponent: parts[1] ?? '',
    fraction: parts[2] ?? '',
  }
}

function BitDisplay({ binary }: { binary: string }) {
  if (!binary) return null
  const { sign, exponent, fraction } = parseBinaryDisplay(binary)
  return (
    <div className="bit-display">
      <div className="bit-group">
        <span className="bit-group-label">Sign (1)</span>
        <span className="bit-group-value sign">{sign}</span>
      </div>
      <div className="bit-group">
        <span className="bit-group-label">Exponent (11)</span>
        <span className="bit-group-value exponent">{exponent}</span>
      </div>
      <div className="bit-group" style={{ flex: 1 }}>
        <span className="bit-group-label">Fraction (52)</span>
        <span className="bit-group-value fraction">{fraction}</span>
      </div>
    </div>
  )
}

// ── Encode Panel ──────────────────────────────────────────────────────────────

function EncodePanel() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<IEEE754EncodingResult | null>(null)
  const [error, setError] = useState('')

  const [flags, setFlags] = useState<ExceptionFlags>({
    inv: false,
    of: false,
    uf: false,
    inx: false,
  })

  function handleConvert() {
    if (!input.trim()) 
    { 
      setError('Please enter a value.');
      setFlags({ inv: false, of: false, uf: false, inx: false })
      return 
    }

    const res = convertDecimalToIEEE754Double(input)
    
    if (res.error) 
    { 
      setError(res.error)
      setResult(null)
      setFlags({ inv: true, of: false, uf: false, inx: false })
    } 
    else 
    { 
      setResult(res)
      setError('')
      setResult(res)
      setError('')

      const lowerInput = input.toLowerCase().trim()
      const num = Number(input)
      const absNum = Math.abs(num)

      const isNaNVal = Number.isNaN(num) || lowerInput.includes('nan')

      const isOverflowVal = !isNaNVal && (absNum > MAX_DOUBLE || !Number.isFinite(num) || lowerInput.includes('infinity'))

      const isUnderflowVal = !isNaNVal && absNum > 0 && absNum < SMALLEST_NORMAL_DOUBLE

      const isInexactVal = !isNaNVal && !isOverflowVal && !Number.isInteger(num)

      setFlags({
        inv: isNaNVal,
        of: isOverflowVal,     
        uf: isUnderflowVal,    
        inx: isInexactVal,    
      })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConvert()
  }

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        Enter a decimal number (or <code>NaN</code>, <code>Infinity</code>, <code>-Infinity</code>)
        and see its IEEE 754 double-precision binary and hexadecimal representation.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="encode-input">Decimal Input</label>
          <input
            id="encode-input"
            type="text"
            placeholder="e.g. 13.625, -0.1, NaN, Infinity"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button id="encode-convert-btn" className="btn-green" onClick={handleConvert}>
          Convert ▸
        </button>
      </div>

      <ExceptionFlagsDisplay flags={flags} />

      {error && <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>⚠ {error}</p>}

      {result && (
        <>
          <hr className="divider" />
          <h3 style={{ marginBottom: '0.75rem' }}>Results</h3>

          <div className="result-block">
            <div className="result-label">IEEE 754 Binary (64-bit)</div>
            <BitDisplay binary={result.binary} />
          </div>

          <div className="result-block">
            <div className="result-label">Hexadecimal</div>
            <div className="result-value">{result.hex}</div>
          </div>

          <StepsLog steps={result.steps} defaultOpen={true} />
        </>
      )}
    </div>
  )
}

// ── Decode Panel ──────────────────────────────────────────────────────────────

function DecodePanel() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<IEEE754DecodingResult | null>(null)
  const [error, setError] = useState('')

  const [flags, setFlags] = useState<ExceptionFlags>({
    inv: false,
    of: false,
    uf: false,
    inx: false,
  })

  function handleConvert() {
    if (!input.trim()) 
    { 
      setError('Please enter a value.');
      setFlags({ inv: false, of: false, uf: false, inx: false })
      return 
    }

    const res = convertIEEE754ToDecimal(input)

    if (res.error) 
    { 
      setError(res.error)
      setResult(null)
      setFlags({ inv: true, of: false, uf: false, inx: false })
    } 
    else 
    { 
      const decVal = res.decimal.toLowerCase()
      const num = Number(res.decimal)
      const absNum = Math.abs(num)

      const isNaNVal = decVal.includes('nan') || Number.isNaN(num)
    
      const isOverflowVal = !isNaNVal && (absNum > MAX_DOUBLE || !Number.isFinite(num) || decVal.includes('infinity'))
      
      const isUnderflowVal = !isNaNVal && absNum > 0 && absNum < SMALLEST_NORMAL_DOUBLE

      setFlags({
        inv: isNaNVal,
        of: isOverflowVal,
        uf: isUnderflowVal,
        inx: false,
      })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConvert()
  }

  return (
    <div>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
        Enter exactly <strong>16 hex characters</strong> (e.g. <code>402B400000000000</code>) or exactly{' '}
        <strong>64 binary digits</strong> to decode back to a decimal value.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="decode-input">Binary or Hex Input</label>
          <input
            id="decode-input"
            type="text"
            placeholder="e.g. 402B400000000000 or 0100000000101011..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button id="decode-convert-btn" className="btn-green" onClick={handleConvert}>
          Decode ▸
        </button>
      </div>

      <ExceptionFlagsDisplay flags={flags} />

      {error && <p style={{ color: 'var(--red)', fontSize: '0.9rem' }}>⚠ {error}</p>}

      {result && (
        <>
          <hr className="divider" />
          <h3 style={{ marginBottom: '0.75rem' }}>Decoded Value</h3>
          <div className="result-block">
            <div className="result-label">Decimal Result</div>
            <div className="result-value">{result.decimal}</div>
          </div>
          <StepsLog steps={result.steps} defaultOpen={true} />
        </>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

type Mode = 'encode' | 'decode'

export function Conversion() {
  const [mode, setMode] = useState<Mode>('encode')

  return (
    <section id="conversion-section" aria-labelledby="conversion-heading">
      <div className="panel">
        <h2 id="conversion-heading">Decimal ↔ IEEE 754 Conversion</h2>

        <div className="mode-toggle">
          <button
            id="mode-encode-btn"
            className={mode === 'encode' ? 'btn-active' : ''}
            onClick={() => setMode('encode')}
          >
            Decimal → Binary
          </button>
          <button
            id="mode-decode-btn"
            className={mode === 'decode' ? 'btn-active' : ''}
            onClick={() => setMode('decode')}
          >
            Binary / Hex → Decimal
          </button>
        </div>

        {mode === 'encode' ? <EncodePanel /> : <DecodePanel />}
      </div>
    </section>
  )
}
