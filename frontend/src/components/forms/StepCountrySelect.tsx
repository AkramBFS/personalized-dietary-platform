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
  // Common styles for the select inputs
  const selectClasses = `
    w-full 
    appearance-none 
    bg-white 
    border border-gray-200 
    text-gray-700 
    py-3.5 px-5 pr-10
    rounded-2xl 
    shadow-sm
    leading-tight 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all
    cursor-pointer
  `;

  // Custom arrow component to keep the JSX clean
  const DropdownArrow = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
      <svg
        className="fill-current h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      {/* Header - Centered text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Regional Settings</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please provide your location and language preference.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Country Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Current Location
          </label>
          <div className="relative">
            <select
              value={formData.country || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  country: e.target.value,
                }))
              }
              className={selectClasses}
            >
              <option value="" disabled>
                Select country
              </option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <DropdownArrow />
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Preferred Language
          </label>
          <div className="relative">
            <select
              value={formData.language || ""}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  language: e.target.value,
                }))
              }
              className={selectClasses}
            >
              <option value="" disabled>
                Select preferred language
              </option>
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <DropdownArrow />
          </div>
        </div>
      </div>
    </div>
  );
}
