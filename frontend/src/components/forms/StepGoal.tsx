"use client";

const GOALS = ["Weight Loss", "Muscle Gain", "Improve Fitness", "Endurance"];

export default function StepGoal({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">What is your primary goal?</h2>
      <div className="grid grid-cols-1 gap-3">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setFormData({ ...formData, goal: g })}
            className={`p-4 text-left border rounded-xl transition-all ${
              formData.goal === g
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
