const crypto = require("crypto");

function getSecret() {
  return (
    process.env.TABLE_QR_SECRET ||
    process.env.JWT_SECRET ||
    "dev-insecure-change-me"
  );
}

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signTableToken(cafeId, tableNumber) {
  const payload = `${cafeId}:${Number(tableNumber)}`;
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest();
  return base64Url(hmac);
}

function verifyTableToken(cafeId, tableNumber, token) {
  if (!token) return false;
  const expected = signTableToken(cafeId, tableNumber);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = { signTableToken, verifyTableToken };
