"use client";

export default function StepHeight({ formData, setFormData }: any) {
  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">How tall are you?</h2>
        <p className="text-sm text-gray-500">Slide to set your height.</p>
      </div>

      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Large Height Display */}
        <div className="relative bg-blue-50 px-8 py-4 rounded-3xl border border-blue-100 shadow-sm">
          <div className="text-5xl font-black text-blue-600 tabular-nums">
            {formData.height}
            <span className="text-xl font-medium text-blue-400 ml-1 uppercase">
              cm
            </span>
          </div>
          {/* Subtle decoration for a "measuring" feel */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-50 border-r border-b border-blue-100 rotate-45"></div>
        </div>

        <div className="w-full space-y-6">
          <div className="relative px-2">
            <input
              type="range"
              min="120"
              max="250"
              step="1"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: Number(e.target.value) })
              }
              className="
                w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer 
                accent-blue-600 hover:accent-blue-700 transition-all
                [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
              "
            />

            {/* Ruler Markings */}
            <div className="flex justify-between w-full px-1 mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <span>120 cm</span>
              <span className="opacity-0 sm:opacity-100 text-gray-300">|</span>
              <span>185 cm</span>
              <span className="opacity-0 sm:opacity-100 text-gray-300">|</span>
              <span>250 cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
