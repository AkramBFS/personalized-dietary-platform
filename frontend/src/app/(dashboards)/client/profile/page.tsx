"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, User, Save, Activity } from "lucide-react";

const COUNTRY_OPTIONS = [
  "United States", "Canada", "United Kingdom", "Germany", "France",
  "Australia", "Qatar", "Saudi Arabia", "UAE", "Algeria",
];

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "German", "Arabic", "Mandarin", "Hindi",
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Very Active" },
];

const DIET_OPTIONS = ["None", "Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/client/profile/");
        setProfile(response.data);
      } catch (error) {
        // Mock fallback
        setProfile({
          client_id: 1, age: 28, weight: 75.5, height: 175, bmi: 24.6, bmr: 1750,
          health_history: "PCOS, mild lactose intolerance", goal_id: 2,
          language: "English", country: "Algeria", activity_level: "moderate", diet: "Omnivore",
          user: { username: "Souki", email: "souki@example.com" }
        });
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Patching profile triggers BMI recalculation on the backend
      const response = await api.patch("/client/profile/", {
        age: Number(profile.age), weight: Number(profile.weight), height: Number(profile.height),
        health_history: profile.health_history, country: profile.country, language: profile.language,
        activity_level: profile.activity_level, diet: profile.diet,
      });
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Profile Mock Updated!");
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Profile</h1>
        <p className="text-muted-foreground">Manage your personal metrics and health details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Health Metrics Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="mx-auto bg-background w-24 h-24 rounded-full flex items-center justify-center text-muted-foreground mb-2 border-4 border-card shadow-sm">
                <User className="w-12 h-12" />
              </div>
              <CardTitle className="text-center text-card-foreground">{profile.user?.username}</CardTitle>
              <CardDescription className="text-center">{profile.user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-accent p-4 rounded-xl border border-accent space-y-3">
                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                  <Activity className="w-4 h-4" /> Health Stats
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/80">BMI</span>
                  <span className="font-bold text-foreground">{profile.bmi}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/80">Est. BMR</span>
                  <span className="font-bold text-foreground">{profile.bmr} <span className="text-xs font-normal">kcal</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Edit Information</CardTitle>
              <CardDescription>Update your metrics to ensure accurate AI calculations.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Age</label>
                    <Input type="number" name="age" value={profile.age || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Height (cm)</label>
                    <Input type="number" name="height" value={profile.height || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Weight (kg)</label>
                    <Input type="number" step="0.1" name="weight" value={profile.weight || ''} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Country</label>
                    <select name="country" value={profile.country || ""} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select country</option>
                      {COUNTRY_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Language</label>
                    <select name="language" value={profile.language || ""} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select language</option>
                      {LANGUAGE_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Activity Level</label>
                    <select name="activity_level" value={profile.activity_level || ""} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select activity level</option>
                      {ACTIVITY_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Diet</label>
                    <select name="diet" value={profile.diet || ""} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option value="">Select diet</option>
                      {DIET_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Health History</label>
                  <textarea 
                    name="health_history" value={profile.health_history || ''} onChange={handleChange} 
                    className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter any medical conditions or dietary restrictions..."
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
