export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const TMDB_KEY = process.env.TMDB_KEY;
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const body = req.body;
    if (!body || !body.message) return res.status(200).json({ ok: true });

    const chatId = body.message.chat.id;
    const text = (body.message.text || '').trim();
    const userId = String(body.message.from.id);

    async function send(msg) {
      await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
      });
    }

    async function sendPhoto(photo, caption) {
      await fetch(`${API}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption, parse_mode: 'HTML' })
      });
    }

    if (!global._sessions) global._sessions = {};
    if (!global._sessions[userId]) {
      global._sessions[userId] = { coins: 0, streak: 0, score: 0, used: [], actor: null, hints: 0 };
    }
    const s = global._sessions[userId];

    if (text === '/start') {
      await send(`🎬 <b>MitoFilm Oyununa xoş gəldin!</b>\n\n🎭 Aktyor şəklini gör, adını tap!\n🪙 Düzgün = +100 MitoCoins\n\n/oyna yazın!`);
      return res.status(200).json({ ok: true });
    }

    if (text === '/oyna') {
      const page = Math.floor(Math.random() * 20) + 1;
      const r = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${TMDB_KEY}&page=${page}`);
      const data = await r.json();
      const list = (data.results || []).filter(p => p.profile_path && !
