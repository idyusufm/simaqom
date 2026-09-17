import React, { useState, useEffect } from 'react'
import logoImg from '../components/simaqom_logo.png'

const FALLBACK_VERSION = '1.1.2'

function getAppVersion() {
  if (typeof window !== 'undefined' && window.AndroidBridge && typeof window.AndroidBridge.getAppVersion === 'function') {
    try {
      return window.AndroidBridge.getAppVersion()
    } catch (e) {
      return FALLBACK_VERSION
    }
  }
  return FALLBACK_VERSION
}

//function TelegramIcon() {
//  return (
//    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.5 4.5L2.5 12l6 2 2 6.5 3-4 5 4 3-16z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none" /></svg>
//  )
//}
function TelegramIcon({ width = 24, height = 24, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 256 256"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      preserveAspectRatio="xMidYMid"
      className={className}
    >
      <g>
        <path
          d="M128,0 C57.307,0 0,57.307 0,128 L0,128 C0,198.693 57.307,256 128,256 L128,256 C198.693,256 256,198.693 256,128 L256,128 C256,57.307 198.693,0 128,0 L128,0 Z"
          fill="#40B3E0"
        />
        <path
          d="M190.2826,73.6308 L167.4206,188.8978 C167.4206,188.8978 164.2236,196.8918 155.4306,193.0548 L102.6726,152.6068 L83.4886,143.3348 L51.1946,132.4628 C51.1946,132.4628 46.2386,130.7048 45.7586,126.8678 C45.2796,123.0308 51.3546,120.9528 51.3546,120.9528 L179.7306,70.5928 C179.7306,70.5928 190.2826,65.9568 190.2826,73.6308"
          fill="#FFFFFF"
        />
        <path
          d="M98.6178,187.6035 C98.6178,187.6035 97.0778,187.4595 95.1588,181.3835 C93.2408,175.3085 83.4888,143.3345 83.4888,143.3345 L161.0258,94.0945 C161.0258,94.0945 165.5028,91.3765 165.3428,94.0945 C165.3428,94.0945 166.1418,94.5735 163.7438,96.8115 C161.3458,99.0505 102.8328,151.6475 102.8328,151.6475"
          fill="#D2E5F1"
        />
        <path
          d="M122.9015,168.1154 L102.0335,187.1414 C102.0335,187.1414 100.4025,188.3794 98.6175,187.6034 L102.6135,152.2624"
          fill="#B5CFE4"
        />
      </g>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.8c-2.93.64-3.55-1.4-3.55-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.42-2.34-.27-4.8-1.17-4.8-5.22 0-1.15.41-2.1 1.08-2.83-.11-.27-.47-1.35.1-2.8 0 0 .88-.28 2.88 1.08a10 10 0 0 1 5.24 0c2-1.36 2.88-1.08 2.88-1.08.57 1.45.21 2.53.1 2.8.67.73 1.08 1.68 1.08 2.83 0 4.06-2.47 4.95-4.82 5.21.38.33.72.97.72 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5z" /></svg>
  )
}

function openExternal(url) {
  if (typeof window !== 'undefined' && window.AndroidBridge && typeof window.AndroidBridge.openExternal === 'function') {
    window.AndroidBridge.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

export default function About() {
  const [appVersion, setAppVersion] = useState(FALLBACK_VERSION)

  useEffect(() => {
    setAppVersion(getAppVersion())
  }, [])

  return (
    <>
      <div className="section-row">
        <h2>Tentang Aplikasi</h2>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px 18px' }}>
        <div style={{ marginBottom: 12 }}>
          < img 
            src={logoImg} 
            alt="Logo Si Maqom" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }} 
          />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.02em' }}>SIMAQOM</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Versi {appVersion}</div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={() => openExternal('https://t.me/zwielichtstern')} className="avatar-circle" style={{ background: '#229ED9', width: 52, height: 52, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Telegram">
            <TelegramIcon />
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Telegram</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={() => openExternal('https://github.com/idyusufm/simaqom')} className="avatar-circle" style={{ background: '#1a1a1a', width: 52, height: 52, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="GitHub">
            <GithubIcon />
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>GitHub</span>
        </div>
      </div>
    </>
  )
}
