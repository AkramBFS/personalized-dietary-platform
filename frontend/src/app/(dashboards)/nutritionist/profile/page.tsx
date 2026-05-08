"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Activity, Plus, Stethoscope, User, X } from "lucide-react";
import { toast } from "sonner";
import { NutritionistProfile, getNutritionistProfile, patchNutritionistProfile } from "@/lib/nutritionist";
import { bootstrapLookups, getLanguages, LookupItem } from "@/lib/lookups";
import { resolveApiUrl } from "@/lib/api";
import GenericDropdown from "@/components/ui/GenericDropdown";

function lookupName(item: LookupItem): string {
  return item.name ?? item.label ?? item.value ?? String(item.id);
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [profileMeta, setProfileMeta] = useState<NutritionistProfile | null>(null);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [pendingLanguageId, setPendingLanguageId] = useState("");
  const [form, setForm] = useState({
    bio: "",
    years_experience: 0,
    consultation_price: 0,
    language_ids: [] as number[],
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await bootstrapLookups();
        setLanguages(getLanguages());
        const profile = await getNutritionistProfile();
        setProfileMeta(profile);
        setForm({
          bio: profile.bio ?? "",
          years_experience: profile.years_experience ?? 0,
          consultation_price: profile.consultation_price ?? 0,
          language_ids: profile.language_ids ?? [],
        });
        if (profile.profile_photo_url) {
          setProfilePhotoUrl(resolveApiUrl(profile.profile_photo_url) ?? "");
        }
      } catch {
        toast.error("Could not load your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const selectedLanguages = useMemo(
    () => languages.filter((language) => form.language_ids.includes(language.id)),
    [form.language_ids, languages],
  );

  const handleAddLanguage = () => {
    const languageId = Number(pendingLanguageId);
    if (!languageId || form.language_ids.includes(languageId)) return;
    setForm((prev) => ({ ...prev, language_ids: [...prev.language_ids, languageId] }));
    setPendingLanguageId("");
  };

  const handleRemoveLanguage = (languageId: number) => {
    setForm((prev) => ({
      ...prev,
      language_ids: prev.language_ids.filter((selectedId) => selectedId !== languageId),
    }));
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
      const freshProfile = await getNutritionistProfile();
      setProfileMeta(freshProfile);
      setForm({
        bio: freshProfile.bio ?? "",
        years_experience: freshProfile.years_experience ?? 0,
        consultation_price: freshProfile.consultation_price ?? 0,
        language_ids: freshProfile.language_ids ?? [],
      });
      setSelectedPhoto(null);
      if (freshProfile.profile_photo_url || updated.profile_photo_url) {
        setProfilePhotoUrl(resolveApiUrl(freshProfile.profile_photo_url ?? updated.profile_photo_url) ?? "");
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
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-muted text-muted-foreground shadow-sm">
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
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-primary">
                  <Activity className="h-4 w-4" /> Professional Snapshot
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">Specialization</span>
                  <span className="font-bold text-foreground">
                    {profileMeta?.specialization_name || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">Experience</span>
                  <span className="font-bold text-foreground">{form.years_experience} yrs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="border-border shadow-sm">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Edit Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">Update your professional details and public consultation settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="bio" className="font-bold ml-1">Bio</Label>
                  <textarea
                    id="bio"
                    value={form.bio}
                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                    className="flex min-h-[120px] w-full rounded-2xl border border-border bg-card/40 backdrop-blur-md p-4 px-6 text-sm transition-all duration-300 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    placeholder="Share your expertise and focus areas."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="years" className="font-bold ml-1">Years of Experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      value={form.years_experience}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, years_experience: Number(event.target.value) || 0 }))
                      }
                      className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="price" className="font-bold ml-1">Consultation Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.consultation_price}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, consultation_price: Number(event.target.value) || 0 }))
                      }
                      className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Languages</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <GenericDropdown
                        label="Add Language"
                        value={pendingLanguageId}
                        onChange={(val) => setPendingLanguageId(val)}
                        options={languages
                          .filter((language) => !form.language_ids.includes(language.id))
                          .map((language) => ({
                            label: lookupName(language),
                            value: String(language.id),
                          }))}
                        placeholder="Select language"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddLanguage}
                      disabled={!pendingLanguageId}
                      className="h-auto py-4 px-6 rounded-2xl border-border shadow-sm hover:bg-accent transition-all duration-300"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2">
                    {selectedLanguages.length > 0 ? (
                      selectedLanguages.map((language) => (
                        <button
                          key={language.id}
                          type="button"
                          onClick={() => handleRemoveLanguage(language.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/15"
                        >
                          {lookupName(language)}
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ))
                    ) : (
                      <span className="px-1 py-1 text-sm text-muted-foreground">No languages selected</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="photo" className="font-bold ml-1">Profile Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedPhoto(event.target.files?.[0] ?? null)}
                    className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                  />
                  {profilePhotoUrl ? <p className="text-xs text-muted-foreground ml-1">Current photo is already set.</p> : null}
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
