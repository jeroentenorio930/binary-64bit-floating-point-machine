export interface ExceptionFlags {
  inv: boolean 
  of: boolean
  uf: boolean
  inx: boolean
}

export function ExceptionFlagsDisplay({ flags }: { flags: ExceptionFlags }) {
  const flagItems = [
    { key: 'inv', label: 'Invalid Operation', title: 'set whenever an operations operands lie outside its domain', active: flags.inv },
    { key: 'of', label: 'Overflow', title: 'set when a result lies beyond the finite range of the floating-point format specified',   active: flags.of },
    { key: 'uf', label: 'Underflow', title: 'set when the result within the range of +2.2 e-308 and -2.2 e-308',  active: flags.uf },
    { key: 'inx', label: 'Inexact', title: 'set when a rounded result is not equal to the mathematical result',    active: flags.inx },
  ]

  return (
    <div className="flags-container">
        <div className="flags-header">
            Exception Flags
        </div>

        <div className="flags-grid">
            {flagItems.map(item => (
                <div
                    key={item.key}
                    className={`flag-rectangle ${item.active ? 'flag-active' : 'flag-inactive'}`}
                    title={item.title}
                >
                <span className="flag-code">{item.label}</span>
                <span className="flag-label">{item.title}</span>
                <span className="flag-status">{item.active ? 'TRIGGERED' : 'CLEAR'}</span>
            </div>
            ))}
        </div>
    </div>
  )
}