"use client";

export default function StepReview({ formData, setFormData }: any) {
  const summary = [
    { label: "Goal", value: formData.goal },
    { label: "BMI", value: formData.bmi },
    { label: "Country", value: formData.country },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Check your details</h2>
      <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
        {summary.map((item) => (
          <div key={item.label} className="flex justify-between">
            <span className="text-gray-500">{item.label}</span>
            <span className="font-semibold">{item.value || "Not set"}</span>
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
        <input
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={(e) =>
            setFormData({ ...formData, agreedToTerms: e.target.checked })
          }
          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">
          I confirm that the medical information provided is accurate and I
          agree to the terms of service.
        </span>
      </label>
    </div>
  );
}
