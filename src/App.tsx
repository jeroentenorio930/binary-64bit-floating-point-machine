import { useState } from 'react'
import './App.css'
import { Conversion } from './components/Conversion'
import { Rounding } from './components/Rounding'
import { Arithmetic } from './components/Arithmetic'

type Tab = 'conversion' | 'rounding' | 'arithmetic'

const TABS: { id: Tab; label: string }[] = [
  { id: 'conversion', label: '[ Conversion ]' },
  { id: 'rounding',   label: '[ Rounding ]' },
  { id: 'arithmetic', label: '[ Arithmetic ]' },
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('conversion')

  return (
    <div className="app-container">
      <header className="site-header">
        <h1>Binary 64-Bit Floating-Point Machine</h1>
        <p className="site-subtitle">IEEE 754 Double-Precision Operations Simulator · CSARCH2 Group 4</p>
      </header>

      <nav className="tab-nav" role="navigation" aria-label="Main sections">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={activeTab === tab.id ? 'btn-active' : ''}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main-content" key={activeTab}>
        {activeTab === 'conversion' && <Conversion />}
        {activeTab === 'rounding'   && <Rounding />}
        {activeTab === 'arithmetic' && <Arithmetic />}
      </main>

      <footer className="site-footer">
        CSARCH2 Machine 3 · Binary 64-Bit Floating-Point Simulator · Group 4
      </footer>
    </div>
  )
}

export default App
