"use client";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Qatar",
  "Saudi Arabia",
  "UAE",
  "Algeria",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Mandarin",
  "Hindi",
];

export default function StepCountrySelect({ formData, setFormData }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-800">Regional Settings</h2>
        <p className="text-sm text-gray-500">
          Please provide your location and language preference.
        </p>
      </div>

      <div className="space-y-4">
        {/* Country Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 ml-1">
            Current Location
          </label>
          <select
            value={formData.country || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                country: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 ml-1">
            Preferred Language
          </label>
          <select
            value={formData.language || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                language: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
          >
            <option value="">Select preferred language</option>
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
