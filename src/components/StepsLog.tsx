import { useState } from 'react'

interface StepsLogProps {
  steps: string[]
  defaultOpen?: boolean
}

export function StepsLog({ steps, defaultOpen = false }: StepsLogProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (steps.length === 0) return null

  return (
    <div className="steps-container">
      <div className="steps-header" onClick={() => setOpen(o => !o)} role="button" aria-expanded={open}>
        <span className="steps-header-title">▸ Step-by-Step Breakdown ({steps.length} steps)</span>
        <span className={`steps-header-arrow${open ? ' open' : ''}`}>▼</span>
      </div>
      {open && (
        <div className="steps-body">
          {steps.map((line, i) => (
            <div
              key={i}
              className={`step-line${line.startsWith('Step') || line.startsWith('Final') || line.startsWith('Runtime') ? ' highlight' : ''}`}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
