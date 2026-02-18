"use client";

export default function StepAgeWeight({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Tell us about yourself
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">Age</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) =>
              setFormData({ ...formData, age: Number(e.target.value) })
            }
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-500">
            Weight (kg)
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) =>
              setFormData({ ...formData, weight: Number(e.target.value) })
            }
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
