import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "./useAuth";

export const useWallet = () => {
  const { userData } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }

    // Real-time listener for wallet balance
    const userRef = doc(db, "users", userData.id);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setBalance(data.wallet?.balance || 0);
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to wallet:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData?.id]);

  return {
    balance,
    loading,
    error,
  };
};

export default useWallet;
