const PROXY_URL = 'https://simaqom-telebot.id-yusufm.workers.dev/'

export async function notifyTelegram(text, email) {
  try {
    await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, email }),
    })
  } catch (e) {
    // Diamkan saja — notifikasi gagal tidak boleh menghentikan alur login.
  }
}
