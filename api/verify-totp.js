// ===== TOTP Verification API =====
// Google Authenticator-ის კოდის შემოწმება

const ALLOWED_ORIGINS = [
  "https://filosofia-xi.vercel.app",
  "https://philosoph.vercel.app"
];

// Base32 decode
function base32Decode(s) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  s = s.toUpperCase().replace(/=+$/, '');
  let bits = 0, val = 0;
  const out = [];
  for (const c of s) {
    val = (val << 5) | chars.indexOf(c);
    bits += 5;
    if (bits >= 8) { bits -= 8; out.push((val >> bits) & 0xff); }
  }
  return Buffer.from(out);
}

// HOTP
async function hotp(secret, counter) {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) { msg[i] = Number(c & 0xffn); c >>= 8n; }
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha1', key).update(msg).digest();
  const offset = hmac[19] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset+1] << 16) | (hmac[offset+2] << 8) | hmac[offset+3];
  return String(code % 1000000).padStart(6, '0');
}

// TOTP — 30 წამიანი ფანჯარა (+-1 ბლოქი tolerant)
async function verifyTotp(secret, token) {
  const t = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [0, -1, 1]) {
    const expected = await hotp(secret, t + delta);
    if (expected === token) return true;
  }
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers['origin'] || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    if (isAllowed) res.setHeader('Access-Control-Allow-Origin', origin);
    return res.status(200).end();
  }
  if (!isAllowed) return res.status(403).json({ error: 'Forbidden' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.TOTP_SECRET;
  if (!secret) return res.status(500).json({ error: 'TOTP not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const token = (body?.token || '').replace(/\s/g, '');

  if (!token || token.length !== 6) return res.status(400).json({ ok: false });

  const valid = await verifyTotp(secret, token);
  return res.status(200).json({ ok: valid });
}
