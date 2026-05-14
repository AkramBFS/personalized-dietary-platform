"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Save, Activity, Camera } from "lucide-react";
import { toast } from "sonner";
import {
  ClientProfile,
  getClientProfile,
  patchClientProgressTargets,
  patchClientProfile,
} from "@/lib/client";
import {
  bootstrapLookups,
  getActivityLevels,
  getCountries,
  getDiets,
  getGoals,
  LookupItem,
} from "@/lib/lookups";
import { resolveApiUrl } from "@/lib/api";
import GenericDropdown from "@/components/ui/GenericDropdown";

const ACTIVITY_FALLBACK: LookupItem[] = [
  { id: -1, value: "sedentary", label: "Sedentary" },
  { id: -2, value: "moderate", label: "Moderate" },
  { id: -3, value: "very active", label: "Very Active" },
];

const DIET_FALLBACK: LookupItem[] = [
  { id: -1, value: "omnivore", label: "Omnivore" },
  { id: -2, value: "vegetarian", label: "Vegetarian" },
  { id: -3, value: "vegan", label: "Vegan" },
  { id: -4, value: "keto", label: "Keto" },
  { id: -5, value: "paleo", label: "Paleo" },
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
    target_calories: "",
    target_protein: "",
    target_carbs: "",
    target_fats: "",
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
      target_calories: loadedProfile.target_calories?.toString() ?? "",
      target_protein: loadedProfile.target_protein?.toString() ?? "",
      target_carbs: loadedProfile.target_carbs?.toString() ?? "",
      target_fats: loadedProfile.target_fats?.toString() ?? "",
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

  const avatarUrl = useMemo(
    () => resolveApiUrl(profile?.profile_photo_url),
    [profile?.profile_photo_url],
  );

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const targetFields = [
        form.target_calories,
        form.target_protein,
        form.target_carbs,
        form.target_fats,
      ];
      const hasAnyTargetValue = targetFields.some((value) => value.trim() !== "");
      const hasAllTargetValues = targetFields.every((value) => value.trim() !== "");

      if (hasAnyTargetValue && !hasAllTargetValues) {
        toast.error("Set calories, protein, carbs, and fat targets together.");
        return;
      }

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

      if (hasAllTargetValues) {
        await patchClientProgressTargets({
          target_calories: Number(form.target_calories),
          target_protein: Number(form.target_protein),
          target_carbs: Number(form.target_carbs),
          target_fats: Number(form.target_fats),
        });
      }

      await loadProfile();
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        Profile unavailable.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          User Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your health metrics and profile details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-background text-muted-foreground shadow-sm">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              <CardTitle className="text-center text-card-foreground">
                {profile.username}
              </CardTitle>
              <CardDescription className="text-center">
                {profile.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-xl border border-accent bg-accent p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-primary">
                  <Activity className="h-4 w-4" /> Health Stats
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">BMI</span>
                  <span className="font-bold text-foreground">
                    {profile.bmi ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary/80">Est. BMR</span>
                  <span className="font-bold text-foreground">
                    {profile.bmr ?? "N/A"}{" "}
                    <span className="text-xs font-normal">kcal</span>
                  </span>
                </div>
              </div>
                <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="text-right font-medium">
                    {profile.goal_name ?? "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Country</span>
                  <span className="text-right font-medium">
                    {profile.country_name ?? "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="text-right font-medium">
                    {profile.target_calories ?? "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Protein</span>
                  <span className="text-right font-medium">
                    {profile.target_protein ?? "Not set"}
                    {profile.target_protein ? " g" : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Carbs</span>
                  <span className="text-right font-medium">
                    {profile.target_carbs ?? "Not set"}
                    {profile.target_carbs ? " g" : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fat</span>
                  <span className="text-right font-medium">
                    {profile.target_fats ?? "Not set"}
                    {profile.target_fats ? " g" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Edit Information
              </CardTitle>
              <CardDescription>
                Updates to height or weight will refresh BMI and BMR from the
                server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="age" className="font-bold ml-1">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={0}
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="height" className="font-bold ml-1">
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      min={0}
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="weight" className="font-bold ml-1">
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min={0}
                      step="0.1"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <GenericDropdown
                      label="Country"
                      value={form.country_id}
                      options={countries.map((c) => ({
                        label: optionLabel(c),
                        value: String(c.id),
                      }))}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, country_id: val }))
                      }
                      placeholder="Select country"
                    />
                  </div>
                  <div className="space-y-1">
                    <GenericDropdown
                      label="Health Goal"
                      value={form.goal_id}
                      options={goals.map((g) => ({
                        label: optionLabel(g),
                        value: String(g.id),
                      }))}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, goal_id: val }))
                      }
                      placeholder="Select goal"
                    />
                  </div>
                  <div className="space-y-1">
                    <GenericDropdown
                      label="Activity Level"
                      value={form.activity_level}
                      options={(activityLevels.length > 0
                        ? activityLevels
                        : ACTIVITY_FALLBACK
                      ).map((a) => ({
                        label: optionLabel(a),
                        value: optionValue(a),
                      }))}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, activity_level: val }))
                      }
                      placeholder="Select activity level"
                    />
                  </div>
                  <div className="space-y-1">
                    <GenericDropdown
                      label="Diet"
                      value={form.diet}
                      options={(diets.length > 0 ? diets : DIET_FALLBACK).map(
                        (d) => ({
                          label: optionLabel(d),
                          value: optionValue(d),
                        }),
                      )}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, diet: val }))
                      }
                      placeholder="Select diet"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="health_history" className="font-bold ml-1">
                    Health History
                  </Label>
                  <textarea
                    id="health_history"
                    name="health_history"
                    value={form.health_history}
                    onChange={handleChange}
                    className="min-h-[120px] w-full rounded-2xl border border-border bg-input/40 backdrop-blur-md p-4 px-6 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 hover:bg-accent/50"
                    placeholder="Enter any medical conditions or dietary restrictions..."
                  />
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Daily Targets
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      These values power your calorie and macro tracking across
                      the dashboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="target_calories" className="font-bold ml-1">
                        Target Calories (kcal)
                      </Label>
                      <Input
                        id="target_calories"
                        type="number"
                        min={0}
                        step="0.1"
                        name="target_calories"
                        value={form.target_calories}
                        onChange={handleChange}
                        className="h-auto rounded-2xl border-border bg-card/40 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="target_protein" className="font-bold ml-1">
                        Target Protein (g)
                      </Label>
                      <Input
                        id="target_protein"
                        type="number"
                        min={0}
                        step="0.1"
                        name="target_protein"
                        value={form.target_protein}
                        onChange={handleChange}
                        className="h-auto rounded-2xl border-border bg-card/40 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="target_carbs" className="font-bold ml-1">
                        Target Carbs (g)
                      </Label>
                      <Input
                        id="target_carbs"
                        type="number"
                        min={0}
                        step="0.1"
                        name="target_carbs"
                        value={form.target_carbs}
                        onChange={handleChange}
                        className="h-auto rounded-2xl border-border bg-card/40 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="target_fats" className="font-bold ml-1">
                        Target Fat (g)
                      </Label>
                      <Input
                        id="target_fats"
                        type="number"
                        min={0}
                        step="0.1"
                        name="target_fats"
                        value={form.target_fats}
                        onChange={handleChange}
                        className="h-auto rounded-2xl border-border bg-card/40 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="profile_photo" className="font-bold ml-1">
                    Profile Photo
                  </Label>
                  <Input
                    id="profile_photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setSelectedPhoto(event.target.files?.[0] ?? null)
                    }
                    className="h-auto py-4 px-6 rounded-2xl bg-card/40 backdrop-blur-md border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : selectedPhoto ? (
                      <Camera className="mr-2 h-4 w-4" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
