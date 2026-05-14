"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { MAX_PROFILE_PHOTO_BYTES } from "@/lib/constants";

type RegistrationFormData = {
  country: string;
  language: string;
  goal: string;
  goalCustom: string;
  activityLevel: string;
  diet: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  medicalConditions: string[];
  medicalConditionsCustom: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePhoto: File | null;
  agreedToTerms: boolean;
};

interface Props {
  formData: RegistrationFormData;
  setFormData: React.Dispatch<React.SetStateAction<RegistrationFormData>>;
  errors?: Record<string, string>;
}

const formatFileSize = (bytes: number) => {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
};

export default function StepSignUp({
  formData,
  setFormData,
  errors = {},
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setFormData((prev) => ({ ...prev, profilePhoto: null }));
      return;
    }

    setFormData((prev) => ({ ...prev, profilePhoto: file }));

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      e.target.value = "";
    }
  };

  const clearPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
  };

  // Glassmorphic input styles matching StepCountrySelect and StepMedicalHistory
  const inputStyles = `
    w-full !bg-card/40 backdrop-blur-md 
    border-border rounded-2xl py-6 px-6 h-auto
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    transition-all duration-300 text-foreground font-medium
    placeholder:text-muted-foreground
    focus:!bg-accent focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none
  `;

  const labelStyles =
    "text-sm font-bold text-foreground ml-1";
  const errorStyles = "text-sm font-semibold text-red-500 dark:text-red-400";
  const preferenceItems = [
    { label: "Country", value: formData.country },
    { label: "Language", value: formData.language },
    { label: "Activity", value: formData.activityLevel },
    { label: "Diet", value: formData.diet },
  ];

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Account Details
        </h2>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
          Please provide your account creation details below.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Selected Profile Preferences
          </p>
          <div className="grid grid-cols-2 gap-3">
            {preferenceItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-muted/60 px-3 py-2"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-sm font-bold text-foreground">
                  {item.value || "Not selected"}
                </p>
              </div>
            ))}
          </div>
        </div>

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
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.firstName && errors.firstName)}
            />
            {touched.firstName && errors.firstName ? (
              <p className={errorStyles}>{errors.firstName}</p>
            ) : null}
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
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.lastName && errors.lastName)}
            />
            {touched.lastName && errors.lastName ? (
              <p className={errorStyles}>{errors.lastName}</p>
            ) : null}
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
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.email && errors.email)}
          />
          {touched.email && errors.email ? (
            <p className={errorStyles}>{errors.email}</p>
          ) : null}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className={labelStyles}>Password</label>
          <Input
            name="password"
            className={inputStyles}
            type="password"
            placeholder="Password"
            value={formData.password || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.password && errors.password)}
          />
          {touched.password && errors.password ? (
            <p className={errorStyles}>{errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className={labelStyles}>Profile Photo</label>
          <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <Input
              ref={fileInputRef}
              name="profilePhoto"
              className={`${inputStyles}"h-11 cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground`}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.profilePhoto && errors.profilePhoto)}
            />

            {formData.profilePhoto ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {formData.profilePhoto.name}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatFileSize(formData.profilePhoto.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-accent"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          {touched.profilePhoto && errors.profilePhoto ? (
            <p className={errorStyles}>{errors.profilePhoto}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
