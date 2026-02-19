"use client";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const CONDITIONS = [
  "None",
  "Diabetes",
  "Hypertension",
  "Thyroid Issues",
  "PCOS",
  "High Cholesterol",
];

export default function StepMedicalHistory({ formData, setFormData }: Props) {
  const selected = formData.medicalConditions || [];

  const toggleCondition = (condition: string) => {
    if (condition === "None") {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: selected.includes("None") ? [] : ["None"],
      }));
    } else {
      const filtered = selected.filter((c: string) => c !== "None");
      if (filtered.includes(condition)) {
        setFormData((prev: any) => ({
          ...prev,
          medicalConditions: filtered.filter((c: string) => c !== condition),
        }));
      } else {
        setFormData((prev: any) => ({
          ...prev,
          medicalConditions: [...filtered, condition],
        }));
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Medical History</h2>
        <p className="text-sm text-gray-500">
          Select all that apply. This helps us tailor your plan safely.
        </p>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-3">
        {CONDITIONS.map((condition) => {
          const isChecked = selected.includes(condition);
          const isNone = condition === "None";

          return (
            <button
              key={condition}
              type="button"
              onClick={() => toggleCondition(condition)}
              className={`
                w-full flex items-center justify-between p-5 
                border-2 rounded-2xl transition-all duration-200 
                active:scale-[0.98] text-left
                ${
                  isChecked
                    ? isNone
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <span
                className={`text-lg font-bold transition-colors ${
                  isChecked
                    ? isNone
                      ? "text-emerald-700"
                      : "text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {condition}
              </span>

              {/* Custom Checkbox Indicator */}
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${
                    isChecked
                      ? isNone
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-blue-600 border-blue-600"
                      : "border-gray-200 bg-white"
                  }
                `}
              >
                {isChecked && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={4}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
