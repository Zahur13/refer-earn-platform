import { auth } from "../firebase/config";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

async function callAPI(endpoint, data) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const token = await currentUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "API request failed");
    }

    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export const submitActivationRequest = async (utrNumber) => {
  return callAPI("submitActivationRequest", { utrNumber });
};

export const approveActivation = async (requestId) => {
  return callAPI("approveActivation", { requestId });
};

export const rejectActivation = async (requestId, reason) => {
  return callAPI("rejectActivation", { requestId, reason });
};

export const createWithdrawalRequest = async (amount, upiId) => {
  return callAPI("createWithdrawalRequest", { amount, upiId });
};

export const approveWithdrawal = async (withdrawalId, adminNote) => {
  return callAPI("approveWithdrawal", { withdrawalId, adminNote });
};

export const rejectWithdrawal = async (withdrawalId, reason) => {
  return callAPI("rejectWithdrawal", { withdrawalId, reason });
};
