"use client";

import { Input } from "@/components/ui/Input";

export default function StepSignUp({ formData, setFormData }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Consistent input styling to match the rest of the form
  const inputStyles = `
    !bg-white border-gray-200 rounded-2xl p-4 h-auto 
    shadow-sm transition-all text-gray-700 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Account Details</h2>
        <p className="text-sm text-gray-500">
          Please provide your account creation details below.
        </p>
      </div>

      <div className="w-full max-w-md space-y-5">
        {/* Name Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              First Name
            </label>
            <Input
              name="firstName"
              className={inputStyles}
              type="text"
              placeholder="John"
              value={formData.firstName || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Last Name
            </label>
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
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Email Address
          </label>
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
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Phone Number
          </label>
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
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Password
          </label>
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
