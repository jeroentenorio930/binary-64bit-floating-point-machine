import { useState } from 'react'
import './App.css'
import { Conversion } from './components/Conversion'
import { Rounding } from './components/Rounding'
import { Arithmetic } from './components/Arithmetic'

type Tab = 'conversion' | 'rounding' | 'arithmetic';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('conversion')

  return (
    <div className="app-container">
      <header className="header">
        <h1>Binary 64-bit Floating-Point Machine</h1>
        <p className="subtitle">IEEE 754 Double-Precision Operations Simulator</p>
      </header>

      <nav className="tab-navigation">
        <button 
          className={activeTab === 'conversion' ? 'active' : ''} 
          onClick={() => setActiveTab('conversion')}
        >
          Conversion
        </button>
        <button 
          className={activeTab === 'rounding' ? 'active' : ''} 
          onClick={() => setActiveTab('rounding')}
        >
          Rounding
        </button>
        <button 
          className={activeTab === 'arithmetic' ? 'active' : ''} 
          onClick={() => setActiveTab('arithmetic')}
        >
          Arithmetic
        </button>
      </nav>

      <main className="content">
        {activeTab === 'conversion' && <Conversion />}
        {activeTab === 'rounding' && <Rounding />}
        {activeTab === 'arithmetic' && <Arithmetic />}
      </main>

      <footer className="footer">
        <p>CSARCH2 Simulation Project - Group 4</p>
      </footer>
    </div>
  )
}

export default App
