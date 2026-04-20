"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Activity, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import { NutritionistProfile, getNutritionistProfile, patchNutritionistProfile } from "@/lib/nutritionist";

const supportedLanguages = [
  { id: 1, name: "English" },
  { id: 2, name: "Arabic" },
  { id: 3, name: "French" },
  { id: 4, name: "Spanish" },
];

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [profileMeta, setProfileMeta] = useState<NutritionistProfile | null>(null);
  const [form, setForm] = useState({
    bio: "",
    years_experience: 0,
    consultation_price: 0,
    language_ids: [] as number[],
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getNutritionistProfile();
        setProfileMeta(profile);
        setForm({
          bio: profile.bio ?? "",
          years_experience: profile.years_experience ?? 0,
          consultation_price: profile.consultation_price ?? 0,
          language_ids: profile.language_ids ?? [],
        });
        if (profile.profile_photo_url) {
          setProfilePhotoUrl(profile.profile_photo_url);
        }
      } catch {
        toast.error("Could not load your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const languageLabel = useMemo(() => {
    if (form.language_ids.length === 0) return "No language selected";
    return supportedLanguages
      .filter((language) => form.language_ids.includes(language.id))
      .map((language) => language.name)
      .join(", ");
  }, [form.language_ids]);

  const handleLanguageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
    setForm((prev) => ({ ...prev, language_ids: selectedIds }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await patchNutritionistProfile({
        bio: form.bio,
        years_experience: form.years_experience,
        consultation_price: form.consultation_price,
        language_ids: form.language_ids,
        profile_photo: selectedPhoto ?? undefined,
      });
      if (updated.profile_photo_url) {
        setProfilePhotoUrl(updated.profile_photo_url);
      }
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12 text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nutritionist Profile</h1>
        <p className="text-muted-foreground">Manage your public details and consultation preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-[#1a2027]">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-gray-400 shadow-sm dark:border-[#1a2027] dark:bg-[#12161b] dark:text-gray-600">
                {profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoUrl}
                    alt="Nutritionist profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              <CardTitle className="text-center">{profileMeta?.user?.username || "Nutritionist"}</CardTitle>
              <CardDescription className="text-center">{profileMeta?.user?.email || "No email available"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="mb-1 flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-400">
                  <Activity className="h-4 w-4" /> Professional Snapshot
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600/80 dark:text-emerald-400/80">Specialization</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {profileMeta?.specialization_name || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600/80 dark:text-emerald-400/80">Experience</span>
                  <span className="font-bold text-gray-900 dark:text-white">{form.years_experience} yrs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-[#1a2027]">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-500" />
                  Edit Information
                </CardTitle>
                <CardDescription>Update your professional details and public consultation settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={form.bio}
                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                    className="flex min-h-[110px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    placeholder="Share your expertise and focus areas."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="years">Years of Experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      value={form.years_experience}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, years_experience: Number(event.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Consultation Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.consultation_price}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, consultation_price: Number(event.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Languages</Label>
                  <p className="text-xs text-muted-foreground">Selected: {languageLabel}</p>
                  <select
                    multiple
                    value={form.language_ids.map(String)}
                    onChange={handleLanguageSelect}
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    {supportedLanguages.map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Hold Ctrl (or Cmd on Mac) to select multiple languages.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Profile Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedPhoto(event.target.files?.[0] ?? null)}
                  />
                  {profilePhotoUrl ? <p className="text-xs text-muted-foreground">Current photo is already set.</p> : null}
                </div>
              </CardContent>
              <CardFooter className="justify-end pt-6">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
