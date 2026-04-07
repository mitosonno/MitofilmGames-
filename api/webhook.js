export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const TMDB_KEY = process.env.TMDB_KEY;
  const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

  async function sendMessage(chatId, text) {
    await fetch(TELEGRAM_API + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  }

  async function sendPhoto(chatId, photoUrl, caption) {
    await fetch(TELEGRAM_API + '/sendPhoto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
    });
  }

  async function getRandomActor(usedIds = []) {
    const page = Math.floor(Math.random() * 20) + 1;
    const r = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${TMDB_KEY}&page=${page}`);
    const data = await r.json();
    const available = (data.results || []).filter(p =>
      p.profile_path && p.known_for && p.known_for.length > 0 && !usedIds.includes(p.id)
    );
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  const update = req.body;
  const message = update.message;
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const userId = message.from.id;

  global.sessions = global.sessions || {};
  if (!global.sessions[userId]) {
    global.sessions[userId] = { coins: 0, streak: 0, score: 0, usedIds: [], currentActor: null, hintsUsed: 0 };
  }
  const session = global.sessions[userId];

  if (text === '/start') {
    await sendMessage(chatId,
      `🎬 <b>MitoFilm Oyununa xoş gəldin!</b>\n\n` +
      `🎭 Aktyor şəklinə baxaraq adını tap\n` +
      `🪙 Düzgün cavab = +100 MitoCoins\n` +
      `🔥 Seriya bonusu = əlavə coins\n\n` +
      `Başlamaq üçün /oyna yaz!`
    );
    return res.status(200).json({ ok: true });
  }

  if (text === '/oyna') {
    const actor = await getRandomActor(session.usedIds);
    if (!actor) {
      session.usedIds = [];
      await sendMessage(chatId, '♻️ Bütün aktyorlar oynanıldı! Sıfırlanır... /oyna yaz');
      return res.status(200).json({ ok: true });
    }
    session.use
