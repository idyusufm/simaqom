import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { notifyTelegram } from '../telegram'

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function Verify() {
  const { firebaseUser, logout, recheckApproval } = useAuth()
  const email = (firebaseUser?.email || '').toLowerCase()
  const [checkingPending, setCheckingPending] = useState(true)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const ensurePending = async () => {
      if (!email) return
      try {
        const existing = await getDoc(doc(db, 'pendingApprovals', email))
        if (!existing.exists()) {
          const newCode = randomCode()
          const name = firebaseUser?.displayName || ''
          await setDoc(doc(db, 'pendingApprovals', email), {
            code: newCode,
            name,
            createdAt: serverTimestamp(),
          })
          await notifyTelegram(
            'Permintaan akses baru Si Maqom\n' +
              'Nama: ' + (name || '-') + '\n' +
              'Email: ' + email + '\n' +
              'Kode: ' + newCode
          )
        }
      } catch (e) {
        // Ignore — form below still lets them try entering a code.
      } finally {
        setCheckingPending(false)
      }
    }
    ensurePending()
  }, [email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await setDoc(doc(db, 'allowedEmails', email), {
        code: code.trim(),
        name: firebaseUser?.displayName || '',
        approvedAt: serverTimestamp(),
      })
      await recheckApproval()
    } catch (err) {
      setError('Kode salah. Periksa kembali dengan admin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-logo">🔑</div>
      <div className="login-title">Si Maqom</div>

      <div className="login-card">
        <h1>Menunggu Persetujuan</h1>
        <p>
          Akun <strong>{email}</strong> belum disetujui. Hubungi admin untuk mendapatkan
          kode verifikasi, lalu masukkan di bawah ini.
        </p>

        {checkingPending ? (
          <p className="empty-state">Memuat…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <label htmlFor="code">Kode Verifikasi</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="cth. 482913"
              style={{ marginBottom: 12 }}
              required
            />
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Memeriksa…' : 'Masuk'}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        )}

        <p style={{ marginTop: 18, fontSize: 15 }}>
          Salah akun?{' '}
          <button type="button" className="login-toggle-link" onClick={logout}>
            Keluar
          </button>
        </p>
      </div>
    </div>
  )
}
