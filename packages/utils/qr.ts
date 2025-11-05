import { createHmac } from "crypto";
const SECRET = process.env.QR_HMAC_SECRET || "dev-secret-change";

function base32(buf: Buffer) {
  // minimal base32 encoder (RFC4648) for short sigs
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, output = "";
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export function signKv(kv: Record<string,string|number>) {
  const base = Object.entries(kv).map(([k,v])=>`${k}=${v}`).join(";");
  const sig = base32(createHmac("sha256", SECRET).update(base).digest()).slice(0,4).toUpperCase();
  return `${base};S=${sig}`;
}

export function parseKv(text: string): Record<string,string> {
  const parts = text.split(";").filter(Boolean);
  const kv = Object.fromEntries(parts.map(p => {
    const [k,...rest] = p.split("="); return [k, rest.join("=")];
  })) as Record<string,string>;
  const { S, ...rest } = kv;
  const base = Object.entries(rest).map(([k,v])=>`${k}=${v}`).join(";");
  const sig = base32(createHmac("sha256", SECRET).update(base).digest()).slice(0,4).toUpperCase();
  if (!S || S !== sig) throw new Error("QR signature invalid");
  return rest;
}
