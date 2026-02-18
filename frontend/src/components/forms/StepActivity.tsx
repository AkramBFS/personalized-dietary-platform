"use client";

const LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { id: "moderate", label: "Moderate", desc: "3-4 days a week" },
  { id: "active", label: "Very Active", desc: "Daily intense training" },
];

export default function StepActivity({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">How active are you?</h2>
      <div className="space-y-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() =>
              setFormData({ ...formData, activityLevel: level.id })
            }
            className={`w-full p-4 text-left border rounded-xl transition-all ${
              formData.activityLevel === level.id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="font-semibold">{level.label}</div>
            <div className="text-sm text-gray-500">{level.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
