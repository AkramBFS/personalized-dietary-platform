"use client";

const DIETS = ["None", "Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo"];

export default function StepDiet({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Any dietary preferences?</h2>
      <select
        value={formData.diet}
        onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Choose a diet...</option>
        {DIETS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
