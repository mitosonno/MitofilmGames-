export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).json({ ok: true });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const TMDB_KEY = process.env.TMDB_KEY;
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
    const body = req.body;

    if (!body || !body.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const text = (body.message.text || '').trim();
    const userId = String(body.message.from.id);

    if (!global._s) global._s = {};
    if (!global._s[userId]) {
      global._s[userId] = { coins: 0, streak: 0, score: 0, used: [], actor: null, hints: 0 };
    }
    const s = global._s[userId];

    async function send(msg) {
      await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
      });
    }

    if (text === '/start') {
      await send('🎬 MitoFilm Oyununa xos geldin!\n\n/oyna yaz!');
      return res.status(200).json({ ok: true });
    }

    if (text === '/oyna') {
      const page = Math.floor(Math.random() * 20) + 1;
      const r = await fetch(`https://api.themoviedb.org/3/person/popular?api_key=${TMDB_KEY}&page=${page}`);
      const data = await r.json();
      const list = (data.results || []).filter(p => p.profile_path && !s.used.includes(p.id));

      if (!list.length) {
        s.used = [];
        await send('Sifirlanir! /oyna yaz');
        return res.status(200).json({ ok: true });
      }

      const actor = list[Math.floor(Math.random() * list.length)];
      s.used.push(actor.id);
      s.actor = actor;
      s.hints = 0;

      const films = (actor.known_for || []).slice(0, 2).map(f => f.title || f.name).join(', ');
      const img = `https://image.tmdb.org/t/p/w500${actor.profile_path}`;

      await fetch(`${API}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: img,
          caption: `Bu aktyor kimdir?\nFilmler: ${films}\n\nCavabi yazin!\n/ipucu /kec /skor`
        })
      });
      return res.status(200).json({ ok: true });
    }

    if (text === '/ipucu') {
      if (!s.actor) { await send('/oyna yaz!'); return res.status(200).json({ ok: true }); }
      s.hints++;
      s.coins = Math.max(0, s.coins - 10);
      const hint = s.actor.name.split(' ').map(p => p[0] + '...').join(' ');
      await send(`Ipucu: ${hint}\n-10 coin. Cem: ${s.coins}`);
      return res.status(200).json({ ok: true });
    }

    if (text === '/kec') {
      if (!s.actor) { await send('/oyna yaz!'); return res.status(200).json({ ok: true }); }
      const name = s.actor.name;
      s.actor = null;
      s.streak = 0;
      s.coins = Math.max(0, s.coins - 5);
      await send(`Kecildi! Cavab: ${name}\n/oyna yaz!`);
      return res.status(200).json({ ok: true });
    }

    if (text === '/skor') {
      await send(`Statistika:\nCoins: ${s.coins}\nDuzgun: ${s.score}\nSeriya: ${s.streak}`);
      return res.status(200).json({ ok: true });
    }

    if (s.actor) {
      const correct = s.actor.name.toLowerCase();
      const answer = text.toLowerCase();
      const isOk = correct === answer || correct.includes(answer) ||
        correct.split(' ').some(p => p === answer);

      if (isOk) {
        const earned = s.hints === 0 ? 100 : 50;
        const bonus = s.streak >= 2 ? Math.min(s.streak * 10, 50) : 0;
        s.coins += earned + bonus;
        s.score++;
        s.streak++;
        const name = s.actor.name;
        s.actor = null;
        await send(`Duzgun! ${name}\n+${earned + bonus} coin\nSeriya: ${s.streak}\nCem: ${s.coins}\n\n/oyna!`);
      } else {
        s.coins = Math.max(0, s.coins - 20);
        s.streak = 0;
        await send(`Yanlis! -20 coin\n/ipucu ve ya /kec`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true });
  }
}
