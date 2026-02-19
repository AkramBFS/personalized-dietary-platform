"use client";

const DIETS = ["None", "Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo"];

export default function StepDiet({ formData, setFormData }: any) {
  return (
    // Added 'flex flex-col items-center' to center the content in the div
    <div className="space-y-6 flex flex-col items-center w-full">
      <h2 className="text-xl font-bold text-gray-800">
        Any dietary preferences?
      </h2>

      <div className="relative w-full max-w-xs">
        <select
          value={formData.diet}
          onChange={(e) => setFormData({ ...formData, diet: e.target.value })}
          className="
            w-full 
            appearance-none 
            bg-white 
            border border-gray-200 
            text-gray-700 
            py-3 px-5 pr-10
            rounded-2xl 
            shadow-sm
            leading-tight 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all
            cursor-pointer
          "
        >
          <option value="" disabled>
            Choose a diet...
          </option>
          {DIETS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* This creates a custom dropdown arrow since we used 'appearance-none' */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
