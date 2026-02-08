import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

// In a real production app, this should definitely be in an environment variable!
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "library-default-secret-key-change-this";

/**
 * Encrypts sensitive text using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return "";

  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const key = crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha512",
  );

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encrypted
  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts text encrypted using the encrypt function above
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) return encryptedData;

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 4) return encryptedData;

    const [saltHex, ivHex, tagHex, encryptedHex] = parts;

    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const key = crypto.pbkdf2Sync(
      ENCRYPTION_KEY,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      "sha512",
    );

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final("utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Error: Decryption Failed]";
  }
}
