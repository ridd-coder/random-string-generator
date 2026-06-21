import { useState, useCallback, useEffect } from 'react'

function App() {
  // 1. useState Hooks for options and application state
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(false)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  
  const [generatedString, setGeneratedString] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('str_gen_history')
    return saved ? JSON.parse(saved) : []
  })

  // 2. useCallback Hook to memoize string generation logic
  const generateString = useCallback(() => {
    let charSet = ''
    if (includeUppercase) charSet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLowercase) charSet += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers) charSet += '0123456789'
    if (includeSymbols) charSet += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (excludeSimilar) {
      // Exclude i, l, 1, I, o, 0, O, L
      charSet = charSet.replace(/[il1Io0OL]/g, '')
    }

    if (charSet.length === 0) {
      setGeneratedString('')
      return ''
    }

    let result = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charSet.length)
      result += charSet[randomIndex]
    }
    
    setGeneratedString(result)
    return result;
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar])

  // 3. useEffect Hook to auto-generate string when options change
  useEffect(() => {
    generateString()
  }, [generateString])

  // 4. useEffect Hook to persist history in localStorage
  useEffect(() => {
    localStorage.setItem('str_gen_history', JSON.stringify(history))
  }, [history])

  // 5. useEffect Hook to clear the 'copied' notification toast after a delay
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => {
      setCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [copied])

  // Helper functions
  const copyToClipboard = useCallback((str) => {
    if (!str) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setHistory((prev) => {
        // Add to history and keep unique, max 5 items
        const filtered = prev.filter((item) => item !== str)
        return [str, ...filtered].slice(0, 5)
      })
    }).catch((err) => {
      console.error('Failed to copy: ', err)
    })
  }, [])

  const handleManualGenerate = () => {
    const str = generateString()
    if (str) {
      setHistory((prev) => {
        const filtered = prev.filter((item) => item !== str)
        return [str, ...filtered].slice(0, 5)
      })
    }
  }

  const clearHistory = () => {
    setHistory([])
  }

  // Calculate strength of current string
  const getStrength = () => {
    if (!generatedString) return { text: 'Empty', width: '0%', color: 'transparent' }
    const len = generatedString.length
    if (len < 6) return { text: 'Very Weak', width: '20%', color: 'var(--strength-weak)' }
    
    let score = 0
    if (len >= 8) score += 1
    if (len >= 12) score += 1
    if (len >= 16) score += 2
    
    if (/[A-Z]/.test(generatedString)) score += 1
    if (/[a-z]/.test(generatedString)) score += 1
    if (/[0-9]/.test(generatedString)) score += 1
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(generatedString)) score += 1
    
    if (score <= 3) {
      return { text: 'Weak', width: '40%', color: 'var(--strength-weak)' }
    } else if (score <= 5) {
      return { text: 'Medium', width: '60%', color: 'var(--strength-medium)' }
    } else if (score <= 7) {
      return { text: 'Strong', width: '80%', color: 'var(--strength-strong)' }
    } else {
      return { text: 'Very Secure', width: '100%', color: 'var(--strength-secure)' }
    }
  }

  const strength = getStrength()

  return (
    <div className="app-card">
      <h1>Random String Generator</h1>
      <p className="subtitle">Generate secure, customized random strings instantly</p>

      {/* String Output Display */}
      <div className="display-wrapper">
        <div className={`display-string ${!generatedString ? 'empty' : ''}`}>
          {generatedString || 'Select at least one character set'}
        </div>
        <div className="action-buttons">
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => copyToClipboard(generatedString)} 
            disabled={!generatedString}
            title="Copy String"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={handleManualGenerate} 
            title="Regenerate"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Strength Meter */}
      <div className="strength-container">
        <span className="strength-label">Strength:</span>
        <div className="strength-indicator">
          <div 
            className="strength-bar" 
            style={{ width: strength.width, backgroundColor: strength.color }}
          ></div>
        </div>
        <span className="strength-text" style={{ color: strength.color }}>
          {strength.text}
        </span>
      </div>

      {/* Controls / Options */}
      <div className="settings-section">
        {/* Length Slider */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="slider-label">String Length</span>
            <span className="slider-value">{length}</span>
          </div>
          <input 
            type="range" 
            min="4" 
            max="64" 
            value={length} 
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Checkbox Grid */}
        <div className="checkbox-grid">
          <label className="checkbox-control">
            <span className="checkbox-label">Uppercase (A-Z)</span>
            <div className="switch">
              <input 
                type="checkbox" 
                checked={includeUppercase} 
                onChange={(e) => setIncludeUppercase(e.target.checked)}
              />
              <span className="slider-switch"></span>
            </div>
          </label>

          <label className="checkbox-control">
            <span className="checkbox-label">Lowercase (a-z)</span>
            <div className="switch">
              <input 
                type="checkbox" 
                checked={includeLowercase} 
                onChange={(e) => setIncludeLowercase(e.target.checked)}
              />
              <span className="slider-switch"></span>
            </div>
          </label>

          <label className="checkbox-control">
            <span className="checkbox-label">Numbers (0-9)</span>
            <div className="switch">
              <input 
                type="checkbox" 
                checked={includeNumbers} 
                onChange={(e) => setIncludeNumbers(e.target.checked)}
              />
              <span className="slider-switch"></span>
            </div>
          </label>

          <label className="checkbox-control">
            <span className="checkbox-label">Symbols (&amp;%$#)</span>
            <div className="switch">
              <input 
                type="checkbox" 
                checked={includeSymbols} 
                onChange={(e) => setIncludeSymbols(e.target.checked)}
              />
              <span className="slider-switch"></span>
            </div>
          </label>
        </div>

        {/* Similar Characters Switch */}
        <label className="checkbox-control">
          <span className="checkbox-label">Exclude Similar (i, l, 1, I, o, 0)</span>
          <div className="switch">
            <input 
              type="checkbox" 
              checked={excludeSimilar} 
              onChange={(e) => setExcludeSimilar(e.target.checked)}
            />
            <span className="slider-switch"></span>
          </div>
        </label>
      </div>

      <button 
        type="button" 
        className="btn-generate" 
        onClick={handleManualGenerate}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Generate &amp; Copy
      </button>

      {/* History log */}
      <div className="history-section">
        <div className="history-header">
          <span className="history-title">Recent History</span>
          {history.length > 0 && (
            <button type="button" className="btn-clear" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">No history yet. Generated strings will appear here.</div>
          ) : (
            history.map((str, index) => (
              <div key={index} className="history-item">
                <span className="history-string">{str}</span>
                <button 
                  type="button" 
                  className="btn-icon" 
                  onClick={() => copyToClipboard(str)}
                  title="Copy from history"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Copy Toast Alert */}
      <div className={`toast ${copied ? 'show' : ''}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied to Clipboard!</span>
      </div>
    </div>
  )
}

export default App
