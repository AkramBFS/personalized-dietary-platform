"use client";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Qatar",
  "Saudi Arabia",
  "UAE",
];

export default function StepCountrySelect({ formData, setFormData }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        Where are you currently located?
      </h2>

      <select
        value={formData.country || ""}
        onChange={(e) =>
          setFormData((prev: any) => ({
            ...prev,
            country: e.target.value,
          }))
        }
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select country</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </div>
  );
}
