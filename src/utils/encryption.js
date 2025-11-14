import CryptoJS from "crypto-js";

// Encryption key - In production, use environment variable
const ENCRYPTION_KEY =
  process.env.REACT_APP_ENCRYPTION_KEY ||
  "your-secret-key-change-in-production";

/**
 * Encrypt sensitive data before storing
 */
export const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      ENCRYPTION_KEY
    ).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
};

/**
 * Decrypt data when reading
 */
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

/**
 * Hash sensitive data (one-way, for passwords, etc.)
 */
export const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Mask sensitive information for display
 */
export const maskEmail = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  const maskedName = name.charAt(0) + "***" + name.slice(-1);
  return `${maskedName}@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return "";
  return phone.slice(0, 2) + "******" + phone.slice(-2);
};

export const maskBankAccount = (accountNumber) => {
  if (!accountNumber) return "";
  return "****" + accountNumber.slice(-4);
};

export const maskUPI = (upiId) => {
  if (!upiId) return "";
  const [name, domain] = upiId.split("@");
  const maskedName = name.charAt(0) + "***" + name.slice(-1);
  return `${maskedName}@${domain}`;
};
