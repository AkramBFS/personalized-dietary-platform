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
    <fieldset className="space-y-6">
      <div className="space-y-1">
        <legend className="text-xl font-bold text-gray-800">
          Medical History
        </legend>
        <p className="text-sm text-gray-500">
          Select all that apply. This helps us tailor your plan safely.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CONDITIONS.map((condition) => {
          const isChecked = selected.includes(condition);
          const isNone = condition === "None";

          return (
            <label
              key={condition}
              className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98]
                ${
                  isChecked
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }
                ${isNone && isChecked ? "border-green-600 bg-green-50 ring-green-600" : ""}`}
            >
              <span
                className={`font-medium ${isChecked ? "text-blue-700" : "text-gray-700"} ${isNone && isChecked ? "text-green-700" : ""}`}
              >
                {condition}
              </span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCondition(condition)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
