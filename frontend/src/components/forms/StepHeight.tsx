"use client";

export default function StepHeight({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">How tall are you?</h2>
      <div className="flex flex-col items-center gap-4">
        <input
          type="range"
          min="120"
          max="250"
          value={formData.height}
          onChange={(e) =>
            setFormData({ ...formData, height: Number(e.target.value) })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="text-4xl font-black text-blue-600">
          {formData.height}{" "}
          <span className="text-lg font-normal text-gray-400">cm</span>
        </div>
      </div>
    </div>
  );
}
