const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra })
  });
}

async function sendPhoto(chatId, photoUrl, caption, extra = {}) {
  await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML', ...extra })
  });
}

async function getRandomActor(usedIds = []) {
  const page = Math.floor(Math.random() * 20) + 1;
  const res = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${TMDB_KEY}&language=az-AZ&page=${page}`);
  const data = await res.json();
  
  const available = (data.results || []).filter(p =>
    p.profile_path &&
    p.known_for && p.known_for.length > 0 &&
    !usedIds.includes(p.id)
  );

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Yaddaş: hər user üçün cari sual
const sessions = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;
  const message = update.message;
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const userId = message.from.id;

  // /start
  if (text === '/start') {
    await sendMessage(chatId,
      `🎬 <b>MitoFilm Oyununa xoş gəldin!</b>\n\n` +
      `🎭 Aktyor şəklinə baxaraq adını tap\n` +
      `🪙 Düzgün cavab = +100 MitoCoins\n` +
      `🔥 Seriya bonusu = +10-50 əlavə coin\n\n` +
      `Başlamaq üçün /oyna yaz!`
    );
    return res.status(200).json({ ok: true });
  }

  // /oyna
  if (text === '/oyna') {
    if (!sessions[userId]) {
      sessions[userId] = { coins: 0, streak: 0, score: 0, usedIds: [], currentActor: null, hintsUsed: 0 };
    }

    const session = sessions[userId];
    const actor = await getRandomActor(session.usedIds);

    if (!actor) {
      session.usedIds = [];
      await sendMessage(chatId, '♻️ Bütün aktyorlar oynanıldı! Sıfırlanır...');
      return res.status(200).json({ ok: true });
    }

    session.usedIds.push(actor.id);
    session.currentActor = actor;
    session.hintsUsed = 0;

    const films = actor.known_for.filter(f => f.title || f.name).slice(0, 2).map(f => f.title || f.name);
    const imgUrl = `https://image.tmdb.org/t/p/w500${actor.profile_path}`;

    await sendPhoto(chatId, imgUrl,
      `🎭 <b>Bu aktyor kimdir?</b>\n\n` +
      `🎬 Tanınmış filmlər: <i>${films.join(', ')}</i>\n\n` +
      `Cavabı yazın! 👇\n` +
      `💡 İpucu üçün /ipucu\n` +
      `⏭ Keçmək üçün /kec`
    );

    return res.status(200).json({ ok: true });
  }

  // /ipucu
  if (text === '/ipucu') {
    const session = sessions[userId];
    if (!session || !session.currentActor) {
      await sendMessage(chatId, '❗ Əvvəlcə /oyna yaz!');
      return res.status(200).json({ ok: true });
    }
    const name = session.currentActor.name;
    const hint = name.split(' ').map(p => p[0] + '•'.repeat(p.length - 1)).join(' ');
    session.hintsUsed++;
    session.coins = Math.max(0, session.coins - 10);
    await sendMessage(chatId, `💡 İpucu: <b>${hint}</b>\n\n-10 MitoCoins. Cəmi: 🪙 ${session.coins}`);
    return res.status(200).json({ ok: true });
  }

  // /kec
  if (text === '/kec') {
    const session = sessions[userId];
    if (!session || !session.currentActor) {
      await sendMessage(chatId, '❗ Əvvəlcə /oyna ya
