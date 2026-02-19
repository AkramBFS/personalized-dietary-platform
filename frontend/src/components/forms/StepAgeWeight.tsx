"use client";

export default function StepAgeWeight({ formData, setFormData }: any) {
  return (
    <div className="flex flex-col items-center w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Tell us about yourself
        </h2>
        <p className="text-sm text-gray-500">
          We use this to calculate your metabolic rate and metrics.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          {/* Age Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Age
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="25"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="
                  w-full p-4 pr-12 bg-white border border-gray-200 
                  rounded-2xl shadow-sm outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  transition-all text-gray-700 text-lg
                "
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                yrs
              </span>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">
              Weight
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="70"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="
                  w-full p-4 pr-12 bg-white border border-gray-200 
                  rounded-2xl shadow-sm outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  transition-all text-gray-700 text-lg
                "
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
