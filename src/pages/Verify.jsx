import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { notifyTelegram } from '../telegram'
import logoImg from '../component/simaqom_logo.png'

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function Verify() {
  const { firebaseUser, logout, recheckApproval } = useAuth()
  const email = (firebaseUser?.email || '').toLowerCase()
  
  const checkedEmail = React.useRef('')

  const [checkingPending, setCheckingPending] = useState(true)
  const [rejected, setRejected] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const ensurePending = async () => {
      // Gembok fungsi agar tidak jalan berkali-kali
      if (!email || checkedEmail.current === email) return
      checkedEmail.current = email

      try {
        // 1. CEK ALLOWED DULU
        const allowedSnap = await getDoc(doc(db, 'allowedEmails', email))
        if (allowedSnap.exists()) {
          await recheckApproval()
          return // 🛑 Berhenti total di sini! Jangan lanjut ke bawah.
        }

        // 2. JIKA TIDAK ADA DI ALLOWED, CEK REJECTED
        const rejectedSnap = await getDoc(doc(db, 'rejectedEmails', email))
        if (rejectedSnap.exists()) {
          setRejected(true)
          setCheckingPending(false)
          return // 🛑 Berhenti total di sini!
        }

        // 3. JIKA BELUM KEDUANYA, CEK APAKAH SEDANG ANTRI (PENDING)
        const pendingSnap = await getDoc(doc(db, 'pendingApprovals', email))
        if (pendingSnap.exists()) {
          setCheckingPending(false)
          return // 🛑 Berhenti total di sini!
        }

        // 4. JIKA KETIGANYA KOSONG, BARU GENERATE DAN KIRIM TELEGRAM
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
        console.error('Gagal mengecek status Firebase atau mengirim Telegram:', e)
        checkedEmail.current = '' // Buka gembok agar bisa dicoba ulang saat refresh
      } finally {
        setCheckingPending(false)
      }
    }

    ensurePending()
  }, [email, firebaseUser])

  useEffect(() => {
    if (!email) return
    const unsub = onSnapshot(doc(db, 'allowedEmails', email), (snap) => {
      if (snap.exists()) {
        recheckApproval()
      }
    })
    return unsub
  }, [email, recheckApproval])

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
      <div className="login-logo">
        {rejected ? (
          '🚫'
        ) : (
          <img 
            src={logoImg} 
            alt="Logo Si Maqom" 
            style={{ width: '64px', height: '64px', objectFit: 'contain' }} 
          />
        )}
      </div>
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
