"use client";

import { useState } from "react";
import { Header } from "../components/header";
import { useMinaWallet } from "../hooks/use-mina-wallet";

export default function Home() {
  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  const userAddress = useMinaWallet().address;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Depositing:", depositAmount, "MINA");
    // Reset or notify the user after a successful deposit
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call your o1js payment function to send the payment
    console.log("Paying:", paymentAmount, "MINA to", recipientAddress);
    // Reset or notify the user after a successful payment
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-8">
          Anonymous Payment System
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Deposit Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Deposit Funds</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label
                  htmlFor="deposit-amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Deposit Amount (MINA)
                </label>
                <input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g., 1.0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                Deposit
              </button>
            </form>
          </div>

          {/* Payment Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Make a Payment</h2>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label
                  htmlFor="payment-amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Payment Amount (MINA)
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g., 0.5"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="recipient-address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Recipient Address
                </label>
                <input
                  id="recipient-address"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="e.g., B62qp...XYZ"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-indigo-200 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Send Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
