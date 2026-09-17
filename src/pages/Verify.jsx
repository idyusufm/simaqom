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
        // 1. Cek apakah user ini adalah Admin di database allowedEmails
        const adminDocRef = doc(db, 'allowedEmails', email)
        const adminDocSnap = await getDoc(adminDocRef)


        if (adminDocSnap.exists() && adminDocSnap.data().admin === true) {
          // Jika dia adalah admin, perbarui status login dan hentikan eksecusi
          // agar tidak masuk ke pendingApprovals dan Telegram.
          await recheckApproval()
          return
        }

        // 2. Generate variabel untuk Firebase dan Telegram
        const newCode = randomCode()
        const userName = firebaseUser?.displayName || '-'

        // 3. Simpan ke Firebase sebagai pending (untuk non-admin)
        await setDoc(doc(db, 'pendingApprovals', email), {
          code: newCode,
          name: userName,
          createdAt: serverTimestamp(),
        })

        // 4. Kirim notifikasi Telegram
        await notifyTelegram(
           'Permintaan akses baru Si Maqom\n' +
           'Nama: ' + userName + '\n' +
           'Email: ' + email + '\n' +
           'Kode: ' + newCode,
           email
        )
      } catch (e) {
        console.error('Failed to setup pending approval or send telegram notif:', e)
      } finally {
        setCheckingPending(false)
      }
    }

    ensurePending()
  }, [email, firebaseUser, recheckApproval])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await setDoc(doc(db, 'allowedEmails', email), {
        code: code.trim(),
        name: firebaseUser?.displayName || '',
        approvedAt: serverTimestamp(),
        admin: false,
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
      <div className="login-logo">9</div>
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

        <p style={{ marginTop: 18, fontSize: 13 }}>
          Salah akun?{' '}
          <button type="button" className="login-toggle-link" onClick={logout}>
            Keluar
          </button>
        </p>
      </div>
    </div>
  )
}
