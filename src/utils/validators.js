/**
 * Validation utility functions
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  return { valid: true };
};

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  if (!re.test(phone)) {
    return {
      valid: false,
      message: "Please enter a valid 10-digit Indian phone number",
    };
  }
  return { valid: true };
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters long",
    };
  }
  if (password.length > 128) {
    return { valid: false, message: "Password is too long" };
  }
  return { valid: true };
};

export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return { valid: false, message: "Name must be at least 2 characters long" };
  }
  if (name.length > 50) {
    return { valid: false, message: "Name is too long" };
  }
  const re = /^[a-zA-Z\s]+$/;
  if (!re.test(name)) {
    return {
      valid: false,
      message: "Name can only contain letters and spaces",
    };
  }
  return { valid: true };
};

export const validateAmount = (amount, min = 10, max = 10000) => {
  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { valid: false, message: "Please enter a valid amount" };
  }
  if (numAmount < min) {
    return { valid: false, message: `Minimum amount is ₹${min}` };
  }
  if (numAmount > max) {
    return { valid: false, message: `Maximum amount is ₹${max}` };
  }
  return { valid: true };
};

export const validateIFSC = (ifsc) => {
  const re = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!re.test(ifsc)) {
    return {
      valid: false,
      message: "Please enter a valid IFSC code (e.g., SBIN0001234)",
    };
  }
  return { valid: true };
};

export const validateAccountNumber = (accountNumber) => {
  const re = /^\d{9,18}$/;
  if (!re.test(accountNumber)) {
    return {
      valid: false,
      message: "Please enter a valid account number (9-18 digits)",
    };
  }
  return { valid: true };
};

export const validateReferralCode = (code) => {
  if (!code || code.trim().length < 3) {
    return { valid: false, message: "Referral code is too short" };
  }
  const re = /^[A-Z0-9]+$/;
  if (!re.test(code.toUpperCase())) {
    return {
      valid: false,
      message: "Referral code can only contain letters and numbers",
    };
  }
  return { valid: true };
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  // Remove potential XSS attempts
  return input.replace(/[<>]/g, "").trim();
};

export const validateFormData = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const rule = rules[field];

    if (rule.required && (!value || value.toString().trim() === "")) {
      errors[field] = `${field} is required`;
      return;
    }

    if (rule.validator && value) {
      const result = rule.validator(value);
      if (!result.valid) {
        errors[field] = result.message;
      }
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validateAmount,
  validateIFSC,
  validateAccountNumber,
  validateReferralCode,
  sanitizeInput,
  validateFormData,
};
