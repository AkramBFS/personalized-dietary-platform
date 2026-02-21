"use client";

import React from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepHeight({ formData, setFormData }: Props) {
  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          How tall are you?
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          Slide to set your height.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col items-center space-y-12">
        {/* Large Glass Display */}
        <div className="relative bg-white/40 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
          <div className="text-6xl font-black text-emerald-400 tabular-nums tracking-tighter">
            {formData.height}
            <span className="text-xl font-bold text-emerald-400 ml-2 uppercase">
              cm
            </span>
          </div>
          {/* Decorative Arrow/Indicator */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/40 border-r border-b border-white/50 rotate-45 backdrop-blur-md"></div>
        </div>

        <div className="w-full space-y-6">
          <div className="relative px-2">
            <input
              type="range"
              min="120"
              max="250"
              step="1"
              value={formData.height}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  height: Number(e.target.value),
                }))
              }
              className="
                w-full h-3 bg-slate-200/50 rounded-full appearance-none cursor-pointer 
                accent-emerald-500 hover:accent-emerald-600 transition-all
                [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-lg
              "
            />

            {/* Ruler Markings */}
            <div className="flex justify-between w-full px-1 mt-6 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="flex flex-col items-center gap-1">
                <span className="h-2 w-px bg-slate-300"></span>
                120 cm
              </span>
              <span className="hidden sm:flex flex-col items-center gap-1 opacity-40">
                <span className="h-2 w-px bg-slate-300"></span>
                185 cm
              </span>
              <span className="flex flex-col items-center gap-1">
                <span className="h-2 w-px bg-slate-300"></span>
                250 cm
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
