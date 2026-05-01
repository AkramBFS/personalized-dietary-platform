"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createNutritionistPlan,
  deleteNutritionistPlan,
  getNutritionistPlans,
  NutritionistPlan,
  PlanCategory,
  updateNutritionistPlan,
} from "@/lib/nutritionist";

export default function MarketplacePlansPage() {
  const [plans, setPlans] = useState<NutritionistPlan[]>([]);
  const [isDesigning, setIsDesigning] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const payload = await getNutritionistPlans();
        setPlans(payload.filter((plan) => plan.plan_type === "public-predefined"));
      } catch {
        toast.error("Could not load public plans.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPlans();
  }, []);

  const freshDay = () => ({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
    instructions: "",
  });

  const [planData, setPlanData] = useState({
    title: "",
    description: "",
    duration: 7,
    price: 0,
    category: "predefined" as PlanCategory,
    days: [freshDay()],
  });

  const resetForm = () => {
    setPlanData({
      title: "",
      description: "",
      duration: 7,
      price: 0,
      category: "predefined",
      days: [freshDay()],
    });
    setEditingPlanId(null);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planData.title || !planData.days[0].breakfast) {
      toast.error("Provide a title and at least day 1 breakfast details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: planData.title,
        description: planData.description || "Public predefined plan",
        plan_type: "public-predefined" as const,
        price: planData.price,
        duration_days: planData.duration,
        category: planData.category,
        content_json: planData.days.map((day, index) => ({
          day_index: index,
          breakfast: day.breakfast,
          lunch: day.lunch,
          dinner: day.dinner,
          snacks: day.snacks,
          instructions: day.instructions,
        })),
      };
      if (editingPlanId) {
        await updateNutritionistPlan(editingPlanId, payload);
        setPlans((prev) =>
          prev.map((plan) =>
            plan.id === editingPlanId
              ? {
                  ...plan,
                  title: payload.title,
                  description: payload.description,
                  duration_days: payload.duration_days,
                  price: payload.price,
                  category: payload.category,
                  content_json: payload.content_json,
                }
              : plan,
          ),
        );
        toast.success("Plan updated.");
      } else {
        const created = await createNutritionistPlan(payload);
        setPlans((prev) => [created, ...prev]);
        toast.success("Public plan submitted for admin approval.");
      }
      setIsDesigning(false);
      resetForm();
    } catch {
      toast.error("Failed to submit the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (plan: NutritionistPlan) => {
    setEditingPlanId(plan.id);
    setPlanData({
      title: plan.title,
      description: plan.description,
      duration: plan.duration_days,
      price: plan.price,
      category: plan.category,
      days:
        plan.content_json.length > 0
          ? plan.content_json.map((day) => ({
              breakfast: day.breakfast,
              lunch: day.lunch,
              dinner: day.dinner,
              snacks: day.snacks,
              instructions: day.instructions,
            }))
          : [freshDay()],
    });
    setIsDesigning(true);
  };

  const removePlan = async (planId: number) => {
    try {
      await deleteNutritionistPlan(planId);
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      toast.success("Plan deleted.");
    } catch {
      toast.error("Could not delete plan.");
    }
  };

  const getStatusBadge = (status: NutritionistPlan["status"]) => {
    switch(status) {
      case "approved": return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0">Approved</Badge>;
      case "pending": return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-0">Pending Admin</Badge>;
      case "rejected": return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border-0">Rejected</Badge>;
      default: return <Badge variant="secondary">Deleted</Badge>;
    }
  };

  const renderListView = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace Plans</h2>
          <p className="text-muted-foreground mt-1">Create reusable nutrition plans for the marketplace or public library.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search plans..." className="pl-8 bg-background border-border" />
          </div>
          <Button onClick={() => setIsDesigning(true)} className="shadow-sm whitespace-nowrap">
            <FileText className="w-4 h-4 mr-2" />
            Create Public Plan
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading plans...</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Plan Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">You haven't created any marketplace plans yet.</TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-semibold text-foreground">{plan.title}</TableCell>
                  <TableCell className="capitalize">{plan.category}</TableCell>
                  <TableCell className="font-medium text-primary">${plan.price.toFixed(2)}</TableCell>
                  <TableCell>{plan.duration_days} Days</TableCell>
                  <TableCell className="text-muted-foreground">{plan.created_at}</TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(plan)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void removePlan(plan.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </Card>
    </div>
  );

  const renderDesigner = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIsDesigning(false)} className="pl-0 hover:bg-transparent flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
      </div>

      <Card className="border-border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70"></div>
        <form onSubmit={handleCreatePlan}>
          <CardHeader className="border-b border-border pb-6 mb-6">
            <CardTitle className="text-2xl">New Public Plan</CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground">
              Design a high-quality nutritional template to sell on the global marketplace.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Plan Title <span className="text-destructive">*</span></Label>
                  <Input 
                    id="title" 
                    value={planData.title}
                    onChange={(e) => setPlanData({...planData, title: e.target.value})}
                    placeholder="e.g. 30-Day Mediterranean Transformation" 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={planData.description}
                    onChange={(e) => setPlanData({...planData, description: e.target.value})}
                    placeholder="Short plan overview for reviewers"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min={1}
                    value={planData.duration}
                    onChange={(e) => setPlanData({...planData, duration: parseInt(e.target.value) || 7})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="price">Price (USD) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground select-none">$</span>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01"
                      min={0}
                      value={planData.price}
                      onChange={(e) => setPlanData({...planData, price: parseFloat(e.target.value) || 0})}
                      className="pl-7 h-11 border-primary/30 focus-visible:ring-ring"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Set to 0 for a free plan.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Plan Category</Label>
                  <Select value={planData.category} onValueChange={(value) => setPlanData({ ...planData, category: value as PlanCategory })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="predefined">Predefined</SelectItem>
                      <SelectItem value="personalized">Personalized</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Content Template</h3>
                <div className="space-y-4">
                  {planData.days.map((day, index) => (
                    <div key={`day-${index}`} className="rounded-md border border-border p-4 space-y-2">
                      <p className="text-sm font-semibold">Day {index + 1}</p>
                      <textarea
                        className="flex min-h-[70px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Breakfast"
                        value={day.breakfast}
                        onChange={(event) =>
                          setPlanData((prev) => ({
                            ...prev,
                            days: prev.days.map((item, dayIndex) =>
                              dayIndex === index ? { ...item, breakfast: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <textarea
                        className="flex min-h-[70px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Lunch"
                        value={day.lunch}
                        onChange={(event) =>
                          setPlanData((prev) => ({
                            ...prev,
                            days: prev.days.map((item, dayIndex) =>
                              dayIndex === index ? { ...item, lunch: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <textarea
                        className="flex min-h-[70px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Dinner"
                        value={day.dinner}
                        onChange={(event) =>
                          setPlanData((prev) => ({
                            ...prev,
                            days: prev.days.map((item, dayIndex) =>
                              dayIndex === index ? { ...item, dinner: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <textarea
                        className="flex min-h-[50px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Snacks"
                        value={day.snacks}
                        onChange={(event) =>
                          setPlanData((prev) => ({
                            ...prev,
                            days: prev.days.map((item, dayIndex) =>
                              dayIndex === index ? { ...item, snacks: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                      <textarea
                        className="flex min-h-[90px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Instructions"
                        value={day.instructions}
                        onChange={(event) =>
                          setPlanData((prev) => ({
                            ...prev,
                            days: prev.days.map((item, dayIndex) =>
                              dayIndex === index ? { ...item, instructions: event.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPlanData((prev) => ({ ...prev, days: [...prev.days, freshDay()] }))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Day
                  </Button>
                </div>
              </div>

          </CardContent>
          <CardFooter className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between bg-muted/50 rounded-b-xl gap-4">
            <p className="text-xs text-muted-foreground max-w-md">Public plans require administrative approval before appearing natively on the platform marketplace.</p>
            <div className="flex w-full sm:w-auto gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsDesigning(false); resetForm(); }} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[160px] w-full sm:w-auto shadow-sm">
                {isSubmitting ? "Submitting..." : <span>{editingPlanId ? "Save Changes" : "Submit for Review"}</span>}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );

  return (
    <div className="w-full h-full pb-10">
      {isDesigning ? renderDesigner() : renderListView()}
    </div>
  );
}
