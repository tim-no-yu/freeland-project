"use client";
import React, { useState } from 'react';

export default function ReporterPortal() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: '', location: '', solutionDescription: '',
    problemStatement: '', teamSize: 0, outcomeIndicators: '', impactMetrics: ''
  });

  const handlePush = (tier: string) => {
    console.log(`Submitting ${tier} to Backend:`, { ...formData, tier });
    alert(`Success: ${tier} Level Submitted!`);
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">New ETS Report</h2>

      {/* STEP 1: COPPER (Collaboration) */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-orange-600 uppercase">Tier 1: Collaboration</p>
        <input className="w-full p-3 border rounded-lg" placeholder="Full Name" onChange={e => setFormData({...formData, userName: e.target.value})} />
        <textarea className="w-full p-3 border rounded-lg" placeholder="Basic Solution Description" onChange={e => setFormData({...formData, solutionDescription: e.target.value})} />
        
        {step === 1 && (
          <div className="flex gap-3">
            <button onClick={() => handlePush('COPPER')} className="flex-1 p-3 bg-slate-100 rounded-lg font-semibold">Submit Copper</button>
            <button onClick={() => setStep(2)} className="flex-1 p-3 bg-green-700 text-white rounded-lg font-semibold">Add Action (Silver)</button>
          </div>
        )}
      </div>

      {/* STEP 2: SILVER (Action) */}
      {step >= 2 && (
        <div className="mt-8 pt-8 border-t space-y-4 animate-in slide-in-from-top-2">
          <p className="text-xs font-bold text-slate-500 uppercase">Tier 2: Action Evidence</p>
          <textarea className="w-full p-3 border rounded-lg" placeholder="Problem Statement..." onChange={e => setFormData({...formData, problemStatement: e.target.value})} />
          <input type="number" className="w-full p-3 border rounded-lg" placeholder="Team Size" onChange={e => setFormData({...formData, teamSize: parseInt(e.target.value)})} />
          
          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => handlePush('SILVER')} className="flex-1 p-3 bg-slate-100 rounded-lg font-semibold">Submit Silver</button>
              <button onClick={() => setStep(3)} className="flex-1 p-3 bg-yellow-500 text-white rounded-lg font-semibold">Add Impact (Gold)</button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: GOLD (Impact) */}
      {step === 3 && (
        <div className="mt-8 pt-8 border-t space-y-4 animate-in slide-in-from-top-2">
          <p className="text-xs font-bold text-yellow-600 uppercase">Tier 3: Verified Impact</p>
          <textarea className="w-full p-3 border-2 border-yellow-100 bg-yellow-50 rounded-lg" placeholder="Outcome Indicators (e.g., traction)" onChange={e => setFormData({...formData, outcomeIndicators: e.target.value})} />
          <textarea className="w-full p-3 border-2 border-yellow-100 bg-yellow-50 rounded-lg" placeholder="Measurable Impact (e.g., species recovery)" onChange={e => setFormData({...formData, impactMetrics: e.target.value})} />
          <button onClick={() => handlePush('GOLD')} className="w-full p-4 bg-yellow-600 text-white rounded-lg font-bold uppercase">Submit Gold Verification</button>
        </div>
      )}
    </div>
  );
}