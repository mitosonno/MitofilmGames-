export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
    const body = req.body;

    if (!body || !body.message) return res.status(200).json({ ok: true });

    const chatId = body.message.chat.id;
    const firstName = body.message.from.first_name || 'Oyunçu';

    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎬 <b>Salam, ${firstName}!</b>\n\nAşağıdakı düyməyə bas və oyna! 🚀`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🎮 Oyunu Başlat',
              web_app: { url: 'https://mitofilm-games.vercel.app/game' }
            }
          ]]
        }
      })
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}
