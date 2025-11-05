import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

const isProduction = typeof process !== "undefined" && process.env?.NODE_ENV === "production";
const envSecret = typeof process !== "undefined" ? process.env?.QR_HMAC_SECRET : undefined;

if (!envSecret) {
  const message = "WARNING: Using default QR_HMAC_SECRET. This is insecure and should only be used in development.";
  if (isProduction) {
    console.warn(message);
  } else {
    console.warn(message);
  }
}

const secret = envSecret || "dev-secret-change";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function computeSignature(base: string) {
  const signatureBytes = hmac(sha256, utf8ToBytes(secret), utf8ToBytes(base));
  return base32(signatureBytes).slice(0, 4).toUpperCase();
}

export function signKv(kv: Record<string, string | number>) {
  const base = Object.entries(kv)
    .map(([k, v]) => `${k}=${v}`)
    .join(";");
  const sig = computeSignature(base);
  return `${base};S=${sig}`;
}

export function parseKv(text: string): Record<string, string> {
  const parts = text.split(";").filter(Boolean);
  const kv = Object.fromEntries(
    parts.map((p) => {
      const [k, ...rest] = p.split("=");
      return [k, rest.join("=")];
    })
  ) as Record<string, string>;
  const { S, ...rest } = kv;
  const base = Object.entries(rest)
    .map(([k, v]) => `${k}=${v}`)
    .join(";");
  const sig = computeSignature(base);
  if (!S || S !== sig) throw new Error("QR signature invalid");
  return rest;
}
