export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const url = `https://${req.headers.host}/api/webhook`;
  
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${url}`
  );
  const data = await response.json();
  
  res.status(200).json(data);
}
