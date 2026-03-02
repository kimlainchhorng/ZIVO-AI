"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

interface MLModel {
  id: string;
  name: string;
  type: "Classification" | "Regression" | "NLP" | "Vision";
  accuracy: number;
  status: "training" | "deployed" | "idle";
}

const typeColors: Record<string, string> = {
  Classification: "bg-blue-900 text-blue-300",
  Regression: "bg-purple-900 text-purple-300",
  NLP: "bg-emerald-900 text-emerald-300",
  Vision: "bg-orange-900 text-orange-300",
};

const statusColors: Record<string, string> = {
  training: "bg-yellow-900 text-yellow-300",
  deployed: "bg-emerald-900 text-emerald-300",
  idle: "bg-gray-700 text-gray-300",
};

const initialModels: MLModel[] = [
  { id: "1", name: "Customer Churn Predictor", type: "Classification", accuracy: 94.2, status: "deployed" },
  { id: "2", name: "Revenue Forecaster", type: "Regression", accuracy: 88.7, status: "deployed" },
  { id: "3", name: "Sentiment Analyzer", type: "NLP", accuracy: 91.3, status: "training" },
  { id: "4", name: "Product Categorizer", type: "Vision", accuracy: 96.1, status: "deployed" },
  { id: "5", name: "Anomaly Detector", type: "Classification", accuracy: 87.5, status: "idle" },
];

const features = [
  { name: "User Engagement", importance: 0.92 },
  { name: "Session Duration", importance: 0.78 },
  { name: "Page Views", importance: 0.65 },
  { name: "Purchase History", importance: 0.58 },
  { name: "Device Type", importance: 0.34 },
];

const trainingJobs = [
  { model: "Sentiment Analyzer v2", progress: 67, eta: "12m" },
  { model: "Image Classifier", progress: 23, eta: "45m" },
];

export default function MLPage() {
  const [models, setModels] = useState<MLModel[]>(initialModels);

  const trainModel = (id: string) => {
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, status: "training" } : m));
  };

  const deployModel = (id: string) => {
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, status: "deployed" } : m));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          ML Integration
        </h1>
        <p className="text-gray-400 mb-10">Custom model training and inference pipelines</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Model list */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Models</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700 bg-gray-900/50">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-right p-4 font-medium">Accuracy</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="p-4 text-gray-200 font-medium">{m.name}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[m.type]}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${m.accuracy >= 90 ? "text-emerald-400" : "text-yellow-400"}`}>
                          {m.accuracy}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {m.status !== "training" && (
                            <button
                              onClick={() => trainModel(m.id)}
                              className="text-xs bg-blue-700 hover:bg-blue-600 text-white rounded px-2 py-1 transition-colors"
                            >
                              Train
                            </button>
                          )}
                          {m.status === "idle" && (
                            <button
                              onClick={() => deployModel(m.id)}
                              className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded px-2 py-1 transition-colors"
                            >
                              Deploy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Model comparison */}
            <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold mb-4">Model Comparison</h3>
              <div className="flex flex-col gap-3">
                {models.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-48 truncate">{m.name}</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${m.accuracy}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-300 w-12 text-right">{m.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Training jobs */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold mb-4">Training Queue</h3>
              {trainingJobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No active training jobs</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {trainingJobs.map((job) => (
                    <div key={job.model}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{job.model}</span>
                        <span className="text-gray-500">ETA {job.eta}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full animate-pulse"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feature importance */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold mb-4">Feature Importance</h3>
              <div className="flex flex-col gap-3">
                {features.map((f) => (
                  <div key={f.name}>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{f.name}</span>
                      <span>{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${f.importance * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
