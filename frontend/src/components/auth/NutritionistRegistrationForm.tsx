"use client";

import { FormEvent, useMemo, useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { submitNutritionistRegistration } from "@/app/actions/submitNutritionistRegistration";
import { nutritionistRegistrationSchema } from "@/lib/constants";
import { Logo } from "../layout/logo";
import {
  bootstrapLookups,
  getCountries,
  getSpecializations,
  getLanguages,
  LookupItem,
} from "@/lib/lookups";
import { ThemeToggle } from "../ui/theme-toggle";

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
  language_ids: number[];
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
  language_ids: [],
};

/* ─── Inline form-sized dropdown ──────────────────────────────────────── */
interface FormDropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function FormDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  isOpen,
  onToggle,
  onClose,
}: FormDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={ref}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-all hover:bg-muted/50 focus:ring-2 focus:ring-brand/50 focus:border-brand"
      >
        <span className={!value ? "text-muted-foreground" : ""}>
          {selectedLabel}
        </span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {options.length > 0 ? (
            options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  onClose();
                }}
                className={`cursor-pointer px-3 py-2 text-sm font-medium transition-colors hover:bg-brand hover:text-primary-foreground ${
                  value === opt.value
                    ? "bg-brand/10 text-brand"
                    : "text-foreground"
                }`}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No options available
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ─── Multi-select dropdown for languages ─────────────────────────────── */
interface MultiSelectDropdownProps {
  label: string;
  selectedIds: number[];
  options: { label: string; value: number }[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function MultiSelectDropdown({
  label,
  selectedIds,
  options,
  onChange,
  placeholder = "Select languages",
  isOpen,
  onToggle,
  onClose,
}: MultiSelectDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggleId = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((v) => v !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedLabels = options
    .filter((o) => selectedIds.includes(o.value))
    .map((o) => o.label);

  const displayText =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

  return (
    <div className="relative" ref={ref}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-all hover:bg-muted/50 focus:ring-2 focus:ring-brand/50 focus:border-brand"
      >
        <span
          className={`truncate ${selectedIds.length === 0 ? "text-muted-foreground" : ""}`}
        >
          {displayText}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = selectedIds.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  onClick={() => toggleId(opt.value)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-brand hover:text-primary-foreground ${
                    isSelected
                      ? "bg-brand/10 text-brand"
                      : "text-foreground"
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "border-brand bg-brand text-primary-foreground"
                        : "border-input bg-card"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No languages available
            </li>
          )}
        </ul>
      )}

      {/* Selected language chips */}
      {selectedIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options
            .filter((o) => selectedIds.includes(o.value))
            .map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {o.label}
                <button
                  type="button"
                  onClick={() => toggleId(o.value)}
                  className="ml-0.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main form ───────────────────────────────────────────────────────── */
export default function NutritionistRegistrationForm() {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [specializations, setSpecializations] = useState<LookupItem[]>([]);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { setTheme, resolvedTheme } = useTheme();

  // Bootstrap lookup data on component mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        await bootstrapLookups();
        setCountries(getCountries());
        setSpecializations(getSpecializations());
        setLanguages(getLanguages());
      } catch (err) {
        console.error("Failed to load lookup data:", err);
      } finally {
        setIsLoadingLookups(false);
      }
    };

    loadLookups();
  }, []);

  const validate = () => {
    const result = nutritionistRegistrationSchema.safeParse({
      ...formData,
      country_id: Number(formData.country_id),
      specialization_id: Number(formData.specialization_id),
      years_experience: Number(formData.years_experience),
      consultation_price: Number(formData.consultation_price),
      cert_image: formData.cert_image,
      language_ids: formData.language_ids,
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
      <p className="mt-1 text-sm text-destructive">{errors[name]}</p>
    ) : null;

  const inputClasses =
    "mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-brand/50 focus:border-brand";

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <Logo />
            Back to home
          </Link>

          <ThemeToggle />
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Nutritionist registration
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete this form to create your nutritionist account. New accounts
            remain pending approval before access is granted.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <label className="block">
              <span className="text-sm font-medium text-foreground">Username</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                className={inputClasses}
              />
              <FieldError name="username" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className={inputClasses}
              />
              <FieldError name="email" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Password</span>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className={inputClasses}
              />
              <FieldError name="password" />
            </label>

            {/* Country dropdown — matches input sizing */}
            <div className="block">
              <FormDropdown
                label="Country"
                value={formData.country_id}
                options={countries.map((c) => ({
                  label: c.name || "",
                  value: String(c.id),
                }))}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, country_id: val }))
                }
                placeholder="Select a country"
                isOpen={openDropdown === "country"}
                onToggle={() =>
                  setOpenDropdown((p) => (p === "country" ? null : "country"))
                }
                onClose={() =>
                  setOpenDropdown((p) => (p === "country" ? null : p))
                }
              />
              <FieldError name="country_id" />
            </div>

            {/* Specialization dropdown — matches input sizing */}
            <div className="block">
              <FormDropdown
                label="Specialization"
                value={formData.specialization_id}
                options={specializations.map((s) => ({
                  label: s.name || "",
                  value: String(s.id),
                }))}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, specialization_id: val }))
                }
                placeholder="Select a specialization"
                isOpen={openDropdown === "specialization"}
                onToggle={() =>
                  setOpenDropdown((p) =>
                    p === "specialization" ? null : "specialization",
                  )
                }
                onClose={() =>
                  setOpenDropdown((p) => (p === "specialization" ? null : p))
                }
              />
              <FieldError name="specialization_id" />
            </div>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Years of experience
              </span>
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
                className={inputClasses}
              />
              <FieldError name="years_experience" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
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
                className={inputClasses}
              />
              <FieldError name="consultation_price" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
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
                className={inputClasses}
              />
              <FieldError name="certification_ref" />
            </label>

            {/* Languages multi-select dropdown */}
            <div className="block">
              <MultiSelectDropdown
                label="Languages"
                selectedIds={formData.language_ids}
                options={
                  Array.isArray(languages)
                    ? languages.map((l) => ({
                        label: l.name || "",
                        value: l.id,
                      }))
                    : []
                }
                onChange={(ids) =>
                  setFormData((prev) => ({ ...prev, language_ids: ids }))
                }
                placeholder="Select languages"
                isOpen={openDropdown === "languages"}
                onToggle={() =>
                  setOpenDropdown((p) =>
                    p === "languages" ? null : "languages",
                  )
                }
                onClose={() =>
                  setOpenDropdown((p) => (p === "languages" ? null : p))
                }
              />
              <FieldError name="language_ids" />
            </div>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-foreground">
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
                className="mt-1 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-brand/50 focus:border-brand file:mr-4 file:rounded-md file:border-0 file:bg-button-primary file:px-3 file:py-1 file:text-sm file:text-button-primary-foreground"
              />
              <FieldError name="cert_image" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Professional bio (optional)
              </span>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className={inputClasses}
              />
            </label>

            {serverError ? (
              <p className="md:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            ) : null}

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <Link
                href="/register"
                className="text-sm font-medium text-primary underline underline-offset-4 hover:text-accent-foreground"
              >
                Back to regular registration
              </Link>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-button-primary px-5 py-2.5 text-sm font-semibold text-button-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Submitting..." : "Submit for approval"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-foreground">
              Registration submitted
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your account is under review. Please expect a response email
              within 1-7 working days.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                Close
              </button>
              <Link
                href="/"
                className="rounded-lg bg-button-primary px-4 py-2 text-sm font-semibold text-button-primary-foreground transition hover:opacity-90"
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
