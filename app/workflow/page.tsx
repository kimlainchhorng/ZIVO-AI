"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

interface Workflow {
  id: string;
  name: string;
  trigger: "webhook" | "schedule" | "event";
  lastRun: string;
  status: boolean;
}

const initialWorkflows: Workflow[] = [
  { id: "1", name: "Daily Analytics Report", trigger: "schedule", lastRun: "2h ago", status: true },
  { id: "2", name: "New User Onboarding", trigger: "event", lastRun: "15m ago", status: true },
  { id: "3", name: "GitHub PR Review Alert", trigger: "webhook", lastRun: "1d ago", status: false },
  { id: "4", name: "Weekly ML Model Retrain", trigger: "schedule", lastRun: "6d ago", status: true },
  { id: "5", name: "Payment Failed Recovery", trigger: "event", lastRun: "3h ago", status: true },
];

const sampleSteps = [
  { icon: "⚡", label: "Trigger: New Event", color: "bg-blue-900 border-blue-700" },
  { icon: "🔍", label: "Filter: Check Conditions", color: "bg-gray-700 border-gray-600" },
  { icon: "🧠", label: "AI: Analyze Data", color: "bg-purple-900 border-purple-700" },
  { icon: "📧", label: "Action: Send Notification", color: "bg-emerald-900 border-emerald-700" },
];

const triggerColors: Record<string, string> = {
  webhook: "bg-blue-900 text-blue-300",
  schedule: "bg-purple-900 text-purple-300",
  event: "bg-emerald-900 text-emerald-300",
};

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<"webhook" | "schedule" | "event">("event");

  const toggleStatus = (id: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, status: !w.status } : w)));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const createWorkflow = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, trigger: newTrigger }),
      });
      const data = await res.json();
      setWorkflows((prev) => [...prev, data]);
    } catch {
      setWorkflows((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newName, trigger: newTrigger, lastRun: "Never", status: false },
      ]);
    }
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Workflow Automation
            </h1>
            <p className="text-gray-400 mt-1">Visual workflow builder with 50+ triggers</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            + Create Workflow
          </button>
        </div>

        {/* Create workflow form */}
        {creating && (
          <div className="bg-gray-800 rounded-xl p-6 border border-purple-700 mb-8">
            <h2 className="font-semibold mb-4">New Workflow</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workflow name..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value as typeof newTrigger)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-300 focus:outline-none"
              >
                <option value="event">Event</option>
                <option value="webhook">Webhook</option>
                <option value="schedule">Schedule</option>
              </select>
              <button
                onClick={createWorkflow}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflow list */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Active Workflows</h2>
            <div className="flex flex-col gap-3">
              {workflows.map((wf) => (
                <div key={wf.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{wf.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${triggerColors[wf.trigger]}`}>
                        {wf.trigger}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">Last run: {wf.lastRun}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStatus(wf.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${wf.status ? "bg-emerald-600" : "bg-gray-600"}`}
                      aria-label="Toggle workflow"
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${wf.status ? "left-5" : "left-0.5"}`}></span>
                    </button>
                    <button className="text-gray-400 hover:text-white text-sm transition-colors">▶</button>
                    <button className="text-gray-400 hover:text-white text-sm transition-colors">✏️</button>
                    <button onClick={() => deleteWorkflow(wf.id)} className="text-gray-400 hover:text-red-400 text-sm transition-colors">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step builder */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Sample Workflow</h2>
            <div className="flex flex-col gap-0">
              {sampleSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-full rounded-xl p-4 border ${step.color} flex items-center gap-3`}>
                    <span className="text-xl">{step.icon}</span>
                    <span className="text-sm font-medium text-gray-200">{step.label}</span>
                  </div>
                  {i < sampleSteps.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
