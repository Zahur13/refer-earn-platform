export const generateReferralCode = (name, uid) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const namePrefix = name.substring(0, 3).toUpperCase();
  const uidSuffix = uid.substring(0, 4).toUpperCase();
  return `${namePrefix}${randomNum}${uidSuffix}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};

export const validateUPI = (upi) => {
  // Format: username@bankname
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return re.test(upi);
};

export const maskUPI = (upi) => {
  if (!upi) return "";
  const [name, domain] = upi.split("@");
  if (!name || !domain) return upi;
  const maskedName = name.charAt(0) + "***" + name.slice(-1);
  return `${maskedName}@${domain}`;
};
