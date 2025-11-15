import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Activity, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { TRANSACTION_TYPES } from "../../utils/constants";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [filter, transactions]);

  const fetchTransactions = async () => {
    try {
      const q = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
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
      return <ArrowDownRight className="w-5 h-5 text-green-600" />;
    } else {
      return <ArrowUpRight className="w-5 h-5 text-red-600" />;
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
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary-600"></div>
      </div>
    );
  }

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const creditVolume = transactions
    .filter(
      (t) =>
        t.type === TRANSACTION_TYPES.CREDIT ||
        t.type === TRANSACTION_TYPES.REFERRAL_BONUS
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const debitVolume = transactions
    .filter(
      (t) =>
        t.type === TRANSACTION_TYPES.DEBIT ||
        t.type === TRANSACTION_TYPES.WITHDRAWAL
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-blue-50 border-blue-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-700">Total Volume</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(totalVolume)}
              </p>
            </div>
            <Activity className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border-green-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Credits</p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(creditVolume)}
              </p>
            </div>
            <ArrowDownRight className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border-red-200 card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-700">Debits</p>
              <p className="text-3xl font-bold text-red-900">
                {formatCurrency(debitVolume)}
              </p>
            </div>
            <ArrowUpRight className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full input-field md:w-64"
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

      {/* Transactions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 font-semibold text-left text-gray-700">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold text-left text-gray-700">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-left text-gray-700">
                  Amount
                </th>
                <th className="px-4 py-3 font-semibold text-left text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-left text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-2 rounded-lg ${getTransactionColor(
                          txn.type
                        )}`}
                      >
                        {getTransactionIcon(txn.type)}
                      </div>
                      <span className="text-sm font-semibold">{txn.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {txn.description}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p
                      className={`text-lg font-bold ${
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
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        txn.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : txn.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {txn.status}
                    </span>

                    {/* // In the transaction display, add UTR if available:  */}
                    <td>
                      {txn.utrNumber && (
                        <div className="px-2 py-1 mt-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs text-blue-700">
                            UTR:{" "}
                            <span className="font-mono font-semibold">
                              {txn.utrNumber}
                            </span>
                          </span>
                        </div>
                      )}
                      {txn.upiId && (
                        <div className="px-2 py-1 mt-2 bg-green-50 rounded border border-green-200">
                          <span className="text-xs text-green-700">
                            UPI: <span className="font-mono">{txn.upiId}</span>
                          </span>
                        </div>
                      )}
                    </td>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(txn.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <p className="py-12 text-center text-gray-500">
              No transactions found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
