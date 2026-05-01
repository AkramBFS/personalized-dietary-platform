"use client";

import React, { useEffect } from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepBMI({ formData }: Props) {
  const cardClasses = `
    w-full bg-card/40 backdrop-blur-md 
    border border-border
    rounded-2xl p-8 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    text-center
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Health Metrics Calculation
        </h2>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
          Our specialized algorithms will process your profile data.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className={cardClasses}>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-2">Server-Side Processing</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To ensure maximum precision, your Body Mass Index (BMI) and Basal Metabolic Rate (BMR) 
            will be calculated by our clinical engine using the Mifflin-St Jeor formula upon completion.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
          <p className="text-xs font-semibold text-brand uppercase tracking-wider">
            Ready for final analysis
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground italic px-8 leading-relaxed">
          Your personalized dietary requirements will be available in your dashboard immediately after setup.
        </p>
      </div>
    </div>
  );
}
