"use client";

import React from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepSignUp({ formData, setFormData }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Glassmorphic input styles matching StepCountrySelect and StepMedicalHistory
  const inputStyles = `
    w-full !bg-white/40 backdrop-blur-md 
    border-white/50 rounded-2xl py-6 px-6 h-auto
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    transition-all duration-300 text-slate-800 font-medium
    placeholder:text-slate-400
    focus:!bg-white/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
  `;

  const labelStyles = "text-sm font-bold text-slate-700 ml-1";

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Account Details
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          Please provide your account creation details below.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Name Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelStyles}>First Name</label>
            <Input
              name="firstName"
              className={inputStyles}
              type="text"
              placeholder="John"
              value={formData.firstName || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className={labelStyles}>Last Name</label>
            <Input
              name="lastName"
              className={inputStyles}
              type="text"
              placeholder="Doe"
              value={formData.lastName || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className={labelStyles}>Email Address</label>
          <Input
            name="email"
            className={inputStyles}
            type="email"
            placeholder="john@example.com"
            value={formData.email || ""}
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className={labelStyles}>Phone Number</label>
          <Input
            name="phone"
            className={inputStyles}
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone || ""}
            onChange={handleChange}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className={labelStyles}>Password</label>
          <Input
            name="password"
            className={inputStyles}
            type="password"
            placeholder="••••••••"
            value={formData.password || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
