"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

const networks = ["Ethereum", "Polygon", "BSC", "Solana", "Avalanche"];

const transactions = [
  { hash: "0xabc...123", type: "Transfer", amount: "1.5 ETH", status: "confirmed", time: "2m ago" },
  { hash: "0xdef...456", type: "Contract Deploy", amount: "0.08 ETH", status: "confirmed", time: "15m ago" },
  { hash: "0x789...abc", type: "Swap", amount: "500 USDC", status: "pending", time: "1h ago" },
  { hash: "0x321...def", type: "Transfer", amount: "2.3 ETH", status: "confirmed", time: "3h ago" },
  { hash: "0xfed...987", type: "Mint NFT", amount: "0.05 ETH", status: "failed", time: "6h ago" },
];

const contracts = [
  { name: "TokenVault.sol", address: "0xAbCd...1234", network: "Ethereum", status: "deployed" },
  { name: "GovernanceDAO.sol", address: "Not deployed", network: "Polygon", status: "draft" },
  { name: "NFTMarket.sol", address: "0xDeF0...5678", network: "BSC", status: "deployed" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-900 text-emerald-300",
  pending: "bg-yellow-900 text-yellow-300",
  failed: "bg-red-900 text-red-300",
  deployed: "bg-emerald-900 text-emerald-300",
  draft: "bg-gray-700 text-gray-300",
};

export default function BlockchainPage() {
  const [network, setNetwork] = useState("Ethereum");
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Blockchain / Web3
            </h1>
            <p className="text-gray-400 mt-1">Smart contracts and DeFi integrations</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
            >
              {networks.map((n) => <option key={n}>{n}</option>)}
            </select>
            <button
              onClick={() => setWalletConnected(!walletConnected)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                walletConnected
                  ? "bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {walletConnected ? "🔗 0xAbCd...1234" : "Connect Wallet"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Transactions", value: "1,284" },
            { label: "Smart Contracts", value: "12" },
            { label: "Token Holdings", value: "$48,320" },
            { label: "Gas Used", value: "2.4 ETH" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent transactions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left pb-3 font-medium">Hash</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-right pb-3 font-medium">Amount</th>
                    <th className="text-right pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 text-purple-400 font-mono">{tx.hash}</td>
                      <td className="py-3 text-gray-300">{tx.type}</td>
                      <td className="py-3 text-right text-gray-200">{tx.amount}</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status]}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smart contracts */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Smart Contracts</h2>
              <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                + Deploy New
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {contracts.map((c) => (
                <div key={c.name} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono mb-1">{c.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{c.network}</span>
                    {c.status === "draft" && (
                      <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1 transition-colors">
                        Deploy
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
