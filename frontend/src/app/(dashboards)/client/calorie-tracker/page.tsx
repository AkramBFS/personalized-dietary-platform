"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Camera, Plus, Loader2, Salad, Image as ImageIcon, Send, Target, Clock, History, X, Crown, ArrowUpRight, Sparkles } from "lucide-react";

interface EditablePrediction {
  id: string;
  label: string;
  mass_grams: number | string;
  calories: number;
}

export default function CalorieTrackerPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("manual");
  const isPremium = false;
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableItems, setEditableItems] = useState<EditablePrediction[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcTimeout, setRecalcTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mealType, setMealType] = useState("lunch");
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientMass, setIngredientMass] = useState("");
  const [ingredients, setIngredients] = useState<{name: string, mass_grams: number}[]>([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const handleAiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAiFile(file);
      setAiPreview(URL.createObjectURL(file));
      setAiResult(null);
    }
  };

  const submitAiAnalysis = () => {
    if (!aiFile) return;
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      const prediction = [
          { id: "opt-1", label: "Chicken Breast", mass_grams: 150, calories: 247 },
          { id: "opt-2", label: "Broccoli", mass_grams: 80, calories: 44 },
          { id: "opt-3", label: "White Rice", mass_grams: 100, calories: 130 }
      ];
      setAiResult({ status: "pending_user_review", segmented_image_url: aiPreview, ai_raw_prediction: prediction });
      setEditableItems(prediction);
      setIsModalOpen(true);
    }, 3000);
  };

  const simulateBackendRecalculation = (newItems: EditablePrediction[]) => {
    setIsRecalculating(true);
    if (recalcTimeout) clearTimeout(recalcTimeout);
    const timeout = setTimeout(() => {
      const recalculated = newItems.map(item => {
        const mass = Number(item.mass_grams) || 0;
        let cals = 0;
        const name = item.label.toLowerCase();
        if (name.includes("chicken")) cals = mass * 1.65;
        else if (name.includes("broccoli")) cals = mass * 0.55;
        else if (name.includes("rice")) cals = mass * 1.30;
        else if (name.includes("egg")) cals = mass * 1.43;
        else if (name.includes("avocado")) cals = mass * 1.60;
        else if (name.includes("beef")) cals = mass * 2.50;
        else if (name.includes("salmon")) cals = mass * 2.08;
        else if (name.includes("potato")) cals = mass * 0.86;
        else cals = mass * 1.0;
        return { ...item, calories: Math.round(cals) };
      });
      setEditableItems(recalculated);
      setIsRecalculating(false);
    }, 800);
    setRecalcTimeout(timeout);
  };

  const handleItemChange = (id: string, field: keyof EditablePrediction, value: string) => {
    const newItems = editableItems.map(item => item.id === id ? { ...item, [field]: value } : item);
    setEditableItems(newItems);
    simulateBackendRecalculation(newItems);
  };

  const handleAddItem = () => {
    const newItem: EditablePrediction = { id: `opt-${Date.now()}`, label: "New Ingredient", mass_grams: 100, calories: 100 };
    const newItems = [...editableItems, newItem];
    setEditableItems(newItems);
    simulateBackendRecalculation(newItems);
  };

  const handleRemoveItem = (id: string) => {
    const newItems = editableItems.filter(item => item.id !== id);
    setEditableItems(newItems);
    simulateBackendRecalculation(newItems);
  };

  const handleSaveMeal = () => {
    setIsModalOpen(false);
    alert("Meal correctly saved to tracker!");
    setAiResult(null); setAiFile(null); setAiPreview(null);
  };

  const addManualIngredient = () => {
    if (!ingredientName || !ingredientMass) return;
    setIngredients([...ingredients, { name: ingredientName, mass_grams: Number(ingredientMass) }]);
    setIngredientName(""); setIngredientMass("");
  };

  const submitManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length === 0) { alert("Please add at least one ingredient"); return; }
    setManualSubmitting(true);
    try {
      await api.post("/client/calorie-tracker/manual/", { meal_type: mealType, ingredients });
      alert("Meal logged successfully!"); setIngredients([]);
    } catch (err) {
      console.error("Failed to log manual meal", err);
      alert("Meal manually logged (Mock)!"); setIngredients([]);
    } finally { setManualSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI Estimations Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Confirm Meal Details
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                 <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-background custom-scrollbar">
               <div className="space-y-4">
                 <div className="flex justify-between items-center px-1">
                   <p className="text-sm font-medium text-muted-foreground">Review AI Estimates. You can edit ingredients or portions below.</p>
                   {isRecalculating && <span className="text-xs text-primary flex items-center gap-1.5 font-semibold bg-primary/10 px-2 py-1 rounded-full"><Loader2 className="w-3 h-3 animate-spin"/> Recalculating...</span>}
                 </div>
                 {editableItems.map(item => (
                   <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-4 items-start md:items-center bg-card p-4 rounded-xl border border-border shadow-sm transition-all hover:border-primary/30">
                     <div className="flex-1 min-w-[200px]">
                       <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Food Type</label>
                       <Input value={item.label} onChange={(e) => handleItemChange(item.id, 'label', e.target.value)} className="bg-background border-border font-medium" />
                     </div>
                     <div className="w-28">
                       <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5 block">Mass (g)</label>
                       <Input type="number" min="0" value={item.mass_grams} onChange={(e) => handleItemChange(item.id, 'mass_grams', e.target.value)} className="bg-background border-border" />
                     </div>
                     <div className="w-24 text-right pt-6 shrink-0">
                       <span className={`font-bold text-lg text-foreground ${isRecalculating ? 'opacity-40' : 'opacity-100'} transition-opacity`}>{item.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
                     </div>
                     <button onClick={() => handleRemoveItem(item.id)} className="pt-6 shrink-0 text-destructive hover:text-destructive/80 p-2 transition-colors" title="Remove Ingredient">
                       <X className="w-5 h-5 mx-auto" />
                     </button>
                   </div>
                 ))}
                 <Button onClick={handleAddItem} variant="outline" className="w-full border-dashed border-2 py-6 transition-all">
                   <Plus className="w-4 h-4 mr-2" /> Add Extra Ingredient
                 </Button>
               </div>
            </div>
            <div className="p-6 border-t border-border bg-card flex items-center justify-between shrink-0">
               <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Estimation</p>
                  <p className={`text-3xl font-extrabold text-primary flex justify-start items-center gap-2 ${isRecalculating ? 'opacity-40 scale-95' : 'opacity-100 scale-100'} transition-all duration-300`}>
                    {editableItems.reduce((a, b) => a + b.calories, 0)} <span className="text-sm font-medium text-primary/70">kcal</span>
                  </p>
               </div>
               <div className="flex items-center gap-3">
                 <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button onClick={handleSaveMeal} disabled={isRecalculating} className="shadow-md px-6">
                   {isRecalculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                   Save Meal to Tracker
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Calorie Tracker</h1>
        <p className="text-muted-foreground">Log your meals manually or use premium AI tracking.</p>
      </div>

      <div className="flex bg-card p-1 rounded-xl w-fit border border-border">
        <button onClick={() => setActiveTab("manual")} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "manual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Salad className="w-4 h-4" /> Manual Entry
        </button>
        <button onClick={() => setActiveTab("ai")} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "ai" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Camera className="w-4 h-4" /> AI Tracking (Premium)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Log */}
        <div className="space-y-6 order-2 lg:order-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Today's Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div><h4 className="font-semibold text-sm text-foreground">Breakfast</h4><p className="text-xs text-muted-foreground mt-0.5">Avocado Toast, Egg</p></div>
                  <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded">450 kcal</span>
                </div>
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div><h4 className="font-semibold text-sm text-foreground">Lunch</h4><p className="text-xs text-muted-foreground mt-0.5">Grilled Chicken Salad</p></div>
                  <span className="text-sm font-bold text-primary bg-accent px-2 py-0.5 rounded">520 kcal</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">Total Today</span>
                  <span className="font-bold text-foreground">970 <span className="text-muted-foreground text-xs font-normal">/ 2000 kcal</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" asChild className="w-full flex items-center justify-center py-6 gap-2 shadow-sm">
            <Link href="/client/calorie-tracker/history"><History className="w-5 h-5" /> View Full History</Link>
          </Button>
        </div>

        {/* Tracker Forms */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
          {activeTab === "ai" ? (
            <>
              {!isPremium ? (
                <>
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> AI Vision Tracker</CardTitle>
                    <CardDescription>This feature requires a premium subscription.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                      <div className="relative">
                        <div className="bg-amber-500/10 w-20 h-20 rounded-2xl flex items-center justify-center"><Sparkles className="w-10 h-10 text-amber-500" /></div>
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium</div>
                      </div>
                      <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-bold text-foreground">Unlock AI-Powered Tracking</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">Simply snap a photo of your meal and our AI will automatically identify ingredients, estimate portions, and calculate calories for you.</p>
                      </div>
                      <Button asChild className="px-8 py-6 rounded-xl shadow-sm text-base">
                        <Link href="/client/subscription"><ArrowUpRight className="w-5 h-5 mr-2" /> Upgrade to Premium</Link>
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle className="text-card-foreground">AI Vision Tracker</CardTitle>
                    <CardDescription>Upload a photo of your meal and our AI will automatically segment and extract components.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-6">
                      <div className="flex-1 flex flex-col gap-4">
                        <label className={`border-2 border-dashed ${aiPreview ? 'border-primary/50' : 'border-border'} rounded-2xl flex flex-col items-center justify-center h-72 overflow-hidden relative cursor-pointer hover:bg-accent transition-colors`}>
                          {aiPreview ? (
                            <><img src={aiPreview} alt="Meal preview" className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg">Change Image</span></div></>
                          ) : (
                            <div className="text-center p-6 space-y-2">
                              <div className="bg-primary/10 text-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><ImageIcon className="w-6 h-6" /></div>
                              <p className="font-medium text-foreground">Click to upload a meal photo</p>
                              <p className="text-sm text-muted-foreground">JPG or PNG, max 10MB</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAiUpload} />
                        </label>
                        <Button onClick={submitAiAnalysis} disabled={!aiFile || aiLoading} className="w-full py-6 rounded-xl text-lg shadow-sm">
                          {aiLoading ? (<><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Analyzing meal with AI...</>) : (<><Camera className="w-5 h-5 mr-3" /> Analyze Image</>)}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-card-foreground">Manual Entry</CardTitle>
                <CardDescription>Search and log individual components of your meal.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitManualLog} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Meal Type</label>
                    <select value={mealType} onChange={e => setMealType(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground">
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div className="space-y-3 p-4 bg-background rounded-xl border border-border">
                    <label className="text-sm font-medium text-foreground">Add Ingredient</label>
                    <div className="flex gap-2">
                      <Input placeholder="e.g. Avocado" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="flex-1" />
                      <Input type="number" placeholder="Grams (g)" value={ingredientMass} onChange={e => setIngredientMass(e.target.value)} className="w-28" />
                      <Button type="button" variant="secondary" onClick={addManualIngredient}><Plus className="w-4 h-4" /></Button>
                    </div>
                    {ingredients.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {ingredients.map((ing, idx) => (
                          <li key={idx} className="flex justify-between text-sm py-2 px-3 bg-card rounded-lg border border-border">
                            <span className="font-medium text-foreground">{ing.name}</span>
                            <span className="text-muted-foreground">{ing.mass_grams}g</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button type="submit" disabled={manualSubmitting || ingredients.length === 0} className="w-full py-6 rounded-xl">
                    {manualSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Log {mealType}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
