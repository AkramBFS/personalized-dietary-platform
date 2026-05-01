"use client";

import { FormEvent, useMemo, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { submitNutritionistRegistration } from "@/app/actions/submitNutritionistRegistration";
import { nutritionistRegistrationSchema } from "@/lib/constants";
import { Logo } from "../layout/logo";
import {
  bootstrapLookups,
  getCountries,
  getSpecializations,
  LookupItem,
} from "@/lib/lookups";

type FormState = {
  username: string;
  email: string;
  password: string;
  country_id: string;
  specialization_id: string;
  years_experience: string;
  consultation_price: string;
  bio: string;
  certification_ref: string;
  cert_image: File | null;
  language_ids: string;
};

const initialState: FormState = {
  username: "",
  email: "",
  password: "",
  country_id: "",
  specialization_id: "",
  years_experience: "",
  consultation_price: "",
  bio: "",
  certification_ref: "",
  cert_image: null,
  language_ids: "",
};

export default function NutritionistRegistrationForm() {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [specializations, setSpecializations] = useState<LookupItem[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const { setTheme, resolvedTheme } = useTheme();

  // Bootstrap lookup data on component mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        await bootstrapLookups();
        setCountries(getCountries());
        setSpecializations(getSpecializations());
      } catch (err) {
        console.error("Failed to load lookup data:", err);
      } finally {
        setIsLoadingLookups(false);
      }
    };

    loadLookups();
  }, []);

  const languageIds = useMemo(
    () =>
      formData.language_ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    [formData.language_ids],
  );

  const validate = () => {
    const result = nutritionistRegistrationSchema.safeParse({
      ...formData,
      country_id: Number(formData.country_id),
      specialization_id: Number(formData.specialization_id),
      years_experience: Number(formData.years_experience),
      consultation_price: Number(formData.consultation_price),
      cert_image: formData.cert_image,
      language_ids: languageIds,
    });

    if (result.success) {
      setErrors({});
      return result.data;
    }

    const fieldErrors = result.error.flatten().fieldErrors;
    const nextErrors: Record<string, string> = {};
    Object.entries(fieldErrors).forEach(([key, value]) => {
      if (value?.[0]) {
        nextErrors[key] = value[0];
      }
    });
    setErrors(nextErrors);
    return null;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setServerError("");

    const parsedData = validate();
    if (!parsedData) {
      return;
    }

    startTransition(async () => {
      try {
        await submitNutritionistRegistration(parsedData);
        setShowSuccessModal(true);
        setFormData(initialState);
        setErrors({});
      } catch (error) {
        setServerError(
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your registration.",
        );
      }
    });
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1 text-sm text-red-500 dark:text-red-400">
        {errors[name]}
      </p>
    ) : null;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0f141a] dark:text-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-[#1a2027] dark:text-gray-100 dark:hover:bg-[#222a33]"
          >
            <Logo />
            Back to home
          </Link>

          <button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition shadow-sm ${
              resolvedTheme === "dark"
                ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-100"
                : "bg-[#1a2027] text-white border-gray-700 hover:bg-[#222a33]"
            }`}
          >
            {resolvedTheme === "dark" ? (
              <>
                <Sun className="h-4 w-4 text-orange-500" />
                Light mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-blue-400" />
                Dark mode
              </>
            )}
          </button>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2a3038] dark:bg-[#1a2027] md:p-8">
          <h1 className="text-2xl font-semibold md:text-3xl">
            Nutritionist registration
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Complete this form to create your nutritionist account. New accounts
            remain pending approval before access is granted.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-medium">Username</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="username" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="email" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="password" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Country</span>
              <select
                value={formData.country_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    country_id: e.target.value,
                  }))
                }
                disabled={isLoadingLookups}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161c]"
              >
                <option value="">Select a country</option>
                {Array.isArray(countries) && countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              <FieldError name="country_id" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Specialization</span>
              <select
                value={formData.specialization_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    specialization_id: e.target.value,
                  }))
                }
                disabled={isLoadingLookups}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#11161c]"
              >
                <option value="">Select a specialization</option>
                {Array.isArray(specializations) && specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
              <FieldError name="specialization_id" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Years of experience</span>
              <input
                type="number"
                min={0}
                value={formData.years_experience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    years_experience: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="years_experience" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Consultation price (USD)
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formData.consultation_price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consultation_price: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="consultation_price" />
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Certification reference
              </span>
              <input
                type="text"
                value={formData.certification_ref}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certification_ref: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="certification_ref" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">
                Language IDs (comma-separated)
              </span>
              <input
                type="text"
                placeholder="Example: 1,2,3"
                value={formData.language_ids}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    language_ids: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="language_ids" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">
                Certification document image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    alert("Certification document must be under 5MB.");
                    e.target.value = "";
                    setFormData((prev) => ({ ...prev, cert_image: null }));
                    return;
                  }
                  setFormData((prev) => ({
                    ...prev,
                    cert_image: file,
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-sm file:text-white dark:border-gray-700 dark:bg-[#11161c]"
              />
              <FieldError name="cert_image" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium">
                Professional bio (optional)
              </span>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-[#11161c]"
              />
            </label>

            {serverError ? (
              <p className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {serverError}
              </p>
            ) : null}

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <Link
                href="/register"
                className="text-sm font-medium text-emerald-600 underline underline-offset-4 hover:text-emerald-500 dark:text-emerald-400"
              >
                Back to regular registration
              </Link>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Submitting..." : "Submit for approval"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-[#1a2027]">
            <h2 className="text-xl font-semibold">Registration submitted</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Your account is under review. Please expect a response email
              within 1-7 working days.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-[#222a33]"
              >
                Close
              </button>
              <Link
                href="/"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Go to home
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
