"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Save, Activity, Camera } from "lucide-react";
import { toast } from "sonner";
import { ClientProfile, getClientProfile, patchClientProfile } from "@/lib/client";
import { bootstrapLookups, getActivityLevels, getCountries, getDiets, getGoals, LookupItem } from "@/lib/lookups";
import { resolveApiUrl } from "@/lib/api";

const ACTIVITY_FALLBACK = [
  { value: "sedentary", label: "Sedentary" },
  { value: "moderate", label: "Moderate" },
  { value: "very active", label: "Very Active" },
];

const DIET_FALLBACK = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
];

function optionLabel(item: LookupItem): string {
  return item.label ?? item.name ?? item.value ?? String(item.id);
}

function optionValue(item: LookupItem): string {
  return item.value ?? item.name ?? item.label ?? String(item.id);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [goals, setGoals] = useState<LookupItem[]>([]);
  const [activityLevels, setActivityLevels] = useState<LookupItem[]>([]);
  const [diets, setDiets] = useState<LookupItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: "",
    height: "",
    weight: "",
    country_id: "",
    goal_id: "",
    activity_level: "",
    diet: "",
    health_history: "",
  });

  const loadProfile = async () => {
    const loadedProfile = await getClientProfile();
    setProfile(loadedProfile);
    setSelectedPhoto(null);
    setForm({
      age: loadedProfile.age?.toString() ?? "",
      height: loadedProfile.height?.toString() ?? "",
      weight: loadedProfile.weight?.toString() ?? "",
      country_id: loadedProfile.country_id?.toString() ?? "",
      goal_id: loadedProfile.goal_id?.toString() ?? "",
      activity_level: loadedProfile.activity_level ?? "",
      diet: loadedProfile.diet ?? "",
      health_history: loadedProfile.health_history ?? "",
    });
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        await bootstrapLookups();
        if (!isMounted) return;

        setCountries(getCountries());
        setGoals(getGoals());
        setActivityLevels(getActivityLevels());
        setDiets(getDiets());
        await loadProfile();
      } catch {
        toast.error("Could not load your profile.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const avatarUrl = useMemo(() => resolveApiUrl(profile?.profile_photo_url), [profile?.profile_photo_url]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await patchClientProfile({
        age: form.age ? Number(form.age) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        health_history: form.health_history,
        goal_id: form.goal_id ? Number(form.goal_id) : undefined,
        country_id: form.country_id ? Number(form.country_id) : undefined,
        activity_level: form.activity_level || undefined,
        diet: form.diet || undefined,
        profile_photo: selectedPhoto ?? undefined,
      });
      await loadProfile();
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Profile unavailable.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Profile</h1>
        <p className="text-muted-foreground">Manage your health metrics and profile details.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-background text-muted-foreground shadow-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              <CardTitle className="text-center text-card-foreground">{profile.username}</CardTitle>
              <CardDescription className="text-center">{profile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl border border-accent bg-accent p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-primary">
                  <Activity className="h-4 w-4" /> Health Stats
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">BMI</span>
                  <span className="font-bold text-foreground">{profile.bmi ?? "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">Est. BMR</span>
                  <span className="font-bold text-foreground">{profile.bmr ?? "N/A"} <span className="text-xs font-normal">kcal</span></span>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="text-right font-medium">{profile.goal_name ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Country</span>
                  <span className="text-right font-medium">{profile.country_name ?? "Not set"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="text-right font-medium">{profile.target_calories ?? "Not set"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Edit Information</CardTitle>
              <CardDescription>Updates to height or weight will refresh BMI and BMR from the server.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" min={0} name="age" value={form.age} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" min={0} name="height" value={form.height} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" min={0} step="0.1" name="weight" value={form.weight} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country_id">Country</Label>
                    <select id="country_id" name="country_id" value={form.country_id} onChange={handleChange} className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>{optionLabel(country)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal_id">Health Goal</Label>
                    <select id="goal_id" name="goal_id" value={form.goal_id} onChange={handleChange} className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select goal</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>{optionLabel(goal)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity_level">Activity Level</Label>
                    <select id="activity_level" name="activity_level" value={form.activity_level} onChange={handleChange} className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select activity level</option>
                      // Activity Levels
{activityLevels.length > 0
  ? activityLevels.map((option) => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)
  : ACTIVITY_FALLBACK.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diet">Diet</Label>
                    <select id="diet" name="diet" value={form.diet} onChange={handleChange} className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select diet</option>
                      // Diets
{diets.length > 0
  ? diets.map((option) => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)
  : DIET_FALLBACK.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health_history">Health History</Label>
                  <textarea
                    id="health_history"
                    name="health_history"
                    value={form.health_history}
                    onChange={handleChange}
                    className="min-h-[100px] w-full rounded-md border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter any medical conditions or dietary restrictions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_photo">Profile Photo</Label>
                  <Input
                    id="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedPhoto(event.target.files?.[0] ?? null)}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : selectedPhoto ? <Camera className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
