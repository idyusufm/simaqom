import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
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
  const [rejected, setRejected] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const ensurePending = async () => {
      if (!email) return

      try {
        // 1. Sudah pernah disetujui (admin atau bukan) → langsung lanjut, tanpa notif.
        const allowedSnap = await getDoc(doc(db, 'allowedEmails', email))
        if (allowedSnap.exists()) {
          await recheckApproval()
          return
        }

        // 2. Sudah pernah ditolak sebelumnya → tampilkan status ditolak, tanpa notif baru.
        const rejectedSnap = await getDoc(doc(db, 'rejectedEmails', email))
        if (rejectedSnap.exists()) {
          setRejected(true)
          return
        }

        // 3. Belum pernah diproses sama sekali → buat permintaan baru + kirim notif.
        const newCode = randomCode()
        const userName = firebaseUser?.displayName || '-'

        await setDoc(doc(db, 'pendingApprovals', email), {
          code: newCode,
          name: userName,
          createdAt: serverTimestamp(),
        })

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

  // Dengarkan secara real-time: begitu admin tekan Terima di Telegram,
  // dokumen ini otomatis muncul dan user langsung lanjut masuk tanpa refresh.
  useEffect(() => {
    if (!email) return
    const unsub = onSnapshot(doc(db, 'allowedEmails', email), (snap) => {
      if (snap.exists()) {
        recheckApproval()
      }
    })
    return unsub
  }, [email, recheckApproval])

  // Dengarkan juga status ditolak.
  useEffect(() => {
    if (!email) return
    const unsub = onSnapshot(doc(db, 'rejectedEmails', email), (snap) => {
      setRejected(snap.exists())
    })
    return unsub
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
      <div className="login-logo">{rejected ? '🚫' : '🔑'}</div>
      <div className="login-title">Si Maqom</div>

      <div className="login-card">
        {rejected ? (
          <>
            <h1>Akses Ditolak</h1>
            <p>
              Permintaan akses untuk <strong>{email}</strong> ditolak oleh admin.
              Hubungi admin jika ini keliru.
            </p>
            <button type="button" className="btn" onClick={logout}>
              Keluar
            </button>
          </>
        ) : (
          <>
            <h1>Menunggu Persetujuan</h1>
            <p>
              Akun <strong>{email}</strong> belum disetujui. Halaman ini akan otomatis lanjut
              begitu admin menyetujui — atau masukkan kode verifikasi dari admin di bawah ini.
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
          </>
        )}
      </div>
    </div>
  )
}
