export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const url = `https://${req.headers.host}/api/webhook`;

  // Menu düyməsini də quraşdır
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text: '🎮 Oyna Başla',
        web_app: { url: 'https://mitofilm-games.vercel.app/game' }
      }
    })
  });

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${url}`
  );
  const data = await response.json();
  res.status(200).json(data);
}
