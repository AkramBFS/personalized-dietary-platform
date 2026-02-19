"use client";

const LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { id: "moderate", label: "Moderate", desc: "3-4 days a week" },
  { id: "active", label: "Very Active", desc: "Daily intense training" },
];

export default function StepActivity({ formData, setFormData }: any) {
  return (
    <div className="flex flex-col items-center w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          How active are you?
        </h2>
        <p className="text-sm text-gray-500">
          This helps us calculate your daily calorie requirements.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {LEVELS.map((level) => {
          const isSelected = formData.activityLevel === level.id;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() =>
                setFormData({ ...formData, activityLevel: level.id })
              }
              className={`
                w-full flex flex-col items-center justify-center p-5 
                border-2 rounded-2xl transition-all duration-200 
                active:scale-[0.99]
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <div
                className={`text-lg font-bold transition-colors ${isSelected ? "text-blue-700" : "text-gray-800"}`}
              >
                {level.label}
              </div>
              <div
                className={`text-sm transition-colors ${isSelected ? "text-blue-600/80" : "text-gray-500"}`}
              >
                {level.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
