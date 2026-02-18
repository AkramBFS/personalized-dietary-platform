"use client";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Thyroid Issues",
  "PCOS",
  "High Cholesterol",
];

export default function StepMedicalHistory({ formData, setFormData }: Props) {
  const selected = formData.medicalConditions || [];

  const toggleCondition = (condition: string) => {
    if (selected.includes(condition)) {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: selected.filter((c: string) => c !== condition),
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: [...selected, condition],
      }));
    }
  };

  return (
    <fieldset className="space-y-6">
      <legend className="text-xl font-semibold">
        Do you have any medical conditions?
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CONDITIONS.map((condition) => {
          const isChecked = selected.includes(condition);

          return (
            <label
              key={condition}
              className={`border rounded-xl p-4 cursor-pointer transition
                ${isChecked ? "border-blue-600 bg-blue-50" : "border-gray-300"}
                focus-within:ring-2 focus-within:ring-blue-500`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCondition(condition)}
                className="sr-only"
              />
              {condition}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
