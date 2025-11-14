import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../utils/constants";

const TransactionHistory = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [userData]);

  useEffect(() => {
    filterTransactions();
  }, [filter, transactions]);

  const fetchTransactions = async () => {
    if (!userData) return;

    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", userData.id),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (filter === "ALL") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.type === filter));
    }
  };

  const getTransactionIcon = (type) => {
    if (
      type === TRANSACTION_TYPES.CREDIT ||
      type === TRANSACTION_TYPES.REFERRAL_BONUS
    ) {
      return <ArrowDownRight className="h-5 w-5 text-green-600" />;
    } else {
      return <ArrowUpRight className="h-5 w-5 text-red-600" />;
    }
  };

  const getTransactionColor = (type) => {
    if (
      type === TRANSACTION_TYPES.CREDIT ||
      type === TRANSACTION_TYPES.REFERRAL_BONUS
    ) {
      return "bg-green-100";
    } else {
      return "bg-red-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="ALL">All Transactions</option>
              <option value={TRANSACTION_TYPES.CREDIT}>Credits</option>
              <option value={TRANSACTION_TYPES.DEBIT}>Debits</option>
              <option value={TRANSACTION_TYPES.REFERRAL_BONUS}>
                Referral Bonus
              </option>
              <option value={TRANSACTION_TYPES.WITHDRAWAL}>Withdrawals</option>
            </select>
          </div>
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No transactions found
          </p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-lg ${getTransactionColor(
                      txn.type
                    )}`}
                  >
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {txn.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(txn.createdAt)}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {txn.type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-bold ${
                      txn.type === TRANSACTION_TYPES.CREDIT ||
                      txn.type === TRANSACTION_TYPES.REFERRAL_BONUS
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {txn.type === TRANSACTION_TYPES.CREDIT ||
                    txn.type === TRANSACTION_TYPES.REFERRAL_BONUS
                      ? "+"
                      : "-"}
                    {formatCurrency(txn.amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{txn.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
