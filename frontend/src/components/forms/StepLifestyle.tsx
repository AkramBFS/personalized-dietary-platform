"use client";

export default function StepLifestyle({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Average sleep per night?</h2>
      <div className="grid grid-cols-4 gap-2">
        {[5, 6, 7, 8, 9, 10, 11, 12].map((hours) => (
          <button
            key={hours}
            onClick={() => setFormData({ ...formData, sleepHours: hours })}
            className={`p-4 border rounded-xl font-bold ${
              formData.sleepHours === hours
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {hours}h
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-400 italic">
        Most adults need 7-9 hours of sleep.
      </p>
    </div>
  );
}
