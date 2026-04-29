"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Send, Search, Clock, CheckCircle, Activity, Eye, FileText, LineChart, Utensils } from "lucide-react";
import {
  NutritionistPatientAssignedPlan,
  NutritionistPatientProgressResponse,
  getNutritionistPatientPlans,
  getNutritionistPatientProgress,
} from "@/lib/nutritionist";
import ProgressChart from "@/components/dashboard/client/ProgressChart";
import CalorieStats from "@/components/dashboard/client/CalorieStats";

interface PatientRecord {
  client_id: number;
  name: string;
  avatarUrl: string;
  age: number;
  weight: number;
  height: number;
  bmi: number;
  goals: string;
  healthHistory: string;
  consultationDate: string;
  status: "pending_plan" | "completed";
}

const mockPatients: PatientRecord[] = [
  {
    client_id: 101,
    name: "Alex Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=101",
    age: 29,
    weight: 85,
    height: 180,
    bmi: 26.2,
    goals: "Weight Loss & Muscle Gain",
    healthHistory: "No major issues, mildly lactose intolerant.",
    consultationDate: "2026-04-12 10:00 AM",
    status: "pending_plan",
  },
  {
    client_id: 102,
    name: "Sarah Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=102",
    age: 34,
    weight: 65,
    height: 165,
    bmi: 23.9,
    goals: "Maintain Weight & Manage PCOS",
    healthHistory: "PCOS diagnosed 3 years ago.",
    consultationDate: "2026-04-11 02:00 PM",
    status: "pending_plan",
  },
  {
    client_id: 103,
    name: "Marcus Cole",
    avatarUrl: "https://i.pravatar.cc/150?u=103",
    age: 42,
    weight: 92,
    height: 175,
    bmi: 30.0,
    goals: "Lower Blood Pressure",
    healthHistory: "Hypertension, family history of heart disease.",
    consultationDate: "2026-04-10 09:30 AM",
    status: "completed",
  },
];

type ViewState = "list" | "profile" | "designer" | "progress";

export default function ConsultationsAndPlansPage() {
  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>(mockPatients);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<NutritionistPatientProgressResponse | null>(null);
  const [patientPlans, setPatientPlans] = useState<NutritionistPatientAssignedPlan[]>([]);
  const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);

  // Form state for plan
  const [planData, setPlanData] = useState({
    title: "",
    duration: 7,
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
    instructions: "",
  });

  const enterProfile = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setViewState("profile");
  };

  const showPatientProgress = async () => {
    if (!selectedPatient) return;
    setViewState("progress");
    setIsProgressLoading(true);
    setProgressError(null);
    setIsPlanDetailsOpen(false);

    try {
      const [progressResponse, plansResponse] = await Promise.all([
        getNutritionistPatientProgress(selectedPatient.client_id),
        getNutritionistPatientPlans(selectedPatient.client_id),
      ]);
      setProgressData(progressResponse);
      setPatientPlans(plansResponse);
    } catch (error: any) {
      const statusCode = error?.response?.status;
      if (statusCode === 403) {
        setProgressError("You are not authorized to view this patient’s progress data.");
      } else {
        setProgressError("Failed to load patient progress. Please try again.");
      }
    } finally {
      setIsProgressLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!planData.title || !planData.breakfast) {
      toast.error("Please provide at least a title and breakfast details.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPatients(prev => prev.map(p => 
        p.client_id === selectedPatient.client_id ? { ...p, status: "completed" } : p
      ));
      toast.success("Nutritional plan published successfully!");
      setViewState("profile");
      setPlanData({ title: "", duration: 7, breakfast: "", lunch: "", dinner: "", snacks: "", instructions: "" });
    } catch (err) {
      toast.error("Failed to submit the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderListView = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Consultations</h2>
          <p className="text-muted-foreground mt-1">Review your consultation history and manage incoming client action-items.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="pl-8 bg-background border-border"
            />
          </div>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Patient Identity</TableHead>
              <TableHead>Health Goals</TableHead>
              <TableHead>Consultation Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.client_id} className="group hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer p-1 -m-1 rounded-md hover:bg-accent"
                    onClick={() => enterProfile(patient)}
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                      <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">{patient.name}</span>
                      <span className="text-xs text-muted-foreground font-mono mt-0.5">ID: {patient.client_id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm truncate max-w-[200px] block" title={patient.goals}>{patient.goals}</span>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-2 h-3.5 w-3.5" />
                    {patient.consultationDate}
                  </div>
                </TableCell>
                <TableCell>
                  {patient.status === "completed" ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                      Pending Plan
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => enterProfile(patient)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Patient Info
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderProfile = () => {
    if (!selectedPatient) return null;
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setViewState("list")} className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Consultations
          </Button>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">Client Record: {selectedPatient.client_id}</Badge>
        </div>

        <Card className="border-border shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-primary/70 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          </div>
          <CardContent className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
              <Avatar className="h-32 w-32 border-4 border-card shadow-md bg-muted">
                <AvatarImage src={selectedPatient.avatarUrl} alt={selectedPatient.name} />
                <AvatarFallback className="text-4xl text-primary">{selectedPatient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{selectedPatient.name}</h2>
                <p className="text-muted-foreground font-medium">Last Consultation: {selectedPatient.consultationDate}</p>
              </div>
              <div className="pb-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={showPatientProgress}
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    Show Patient Progress
                  </Button>
                  <Button
                    onClick={() => setViewState("designer")}
                    className="shadow-md rounded-full px-6"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {selectedPatient.status === "completed" ? "Review Designed Plan" : "Draft Custom Plan"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Biometrics Matrix</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Age</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPatient.age}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">BMI</p>
                      <p className="text-2xl font-bold text-primary">{selectedPatient.bmi}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Weight</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPatient.weight} <span className="text-sm text-muted-foreground font-normal">kg</span></p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Height</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPatient.height} <span className="text-sm text-muted-foreground font-normal">cm</span></p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Clinical Profile</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/10">
                        <div className="flex bg-primary/20 w-8 h-8 rounded-full items-center justify-center mb-3">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">Primary Goals</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedPatient.goals}</p>
                      </div>
                      
                      <div className="p-4 rounded-xl border border-border bg-background">
                        <h4 className="font-semibold text-foreground mb-2">Medical History & Allergies</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                          {selectedPatient.healthHistory}
                        </p>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDesigner = () => {
    if (!selectedPatient) return null;
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setViewState("profile")} className="pl-0 hover:bg-transparent flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Patient Profile
          </Button>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs shadow-sm">
            Drafting for: {selectedPatient.name}
          </Badge>
        </div>

        <Card className="border-primary/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70"></div>
          <form onSubmit={handleCreatePlan}>
            <CardHeader className="border-b border-border pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Plan Blueprint Matrix</CardTitle>
                  <CardDescription className="text-sm mt-1 text-muted-foreground">Formulating a targeted dietary strategy based on clinical profile.</CardDescription>
                </div>
                {selectedPatient.status === "completed" && (
                   <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-1.5 px-3">
                     <CheckCircle className="w-4 h-4 mr-2" /> Plan Deployed
                   </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="title" className="font-semibold">Plan Title <span className="text-red-500">*</span></Label>
                   <Input id="title" value={planData.title} onChange={(e) => setPlanData({...planData, title: e.target.value})} placeholder="e.g. Hypertension Reduction Protocol" disabled={selectedPatient.status === "completed"} className="h-11 bg-background focus-visible:ring-ring" />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="duration" className="font-semibold">Protocol Duration (Days)</Label>
                   <Input id="duration" type="number" min={1} value={planData.duration} onChange={(e) => setPlanData({...planData, duration: parseInt(e.target.value) || 7})} disabled={selectedPatient.status === "completed"} className="h-11 bg-background focus-visible:ring-ring" />
                 </div>
               </div>

               <div className="mt-8 border border-border rounded-xl overflow-hidden shadow-sm">
                 <Tabs defaultValue="meals" className="w-full">
                  <TabsList className="flex w-full min-h-12 border-b border-border bg-muted rounded-none p-0 overflow-x-auto">
                    <TabsTrigger value="meals" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background font-medium py-3">
                      Meal Matrix Breakdown
                    </TabsTrigger>
                    <TabsTrigger value="instructions" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background font-medium py-3">
                      Therapeutic Guidelines
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="meals" className="p-6 space-y-6 bg-background m-0">
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2 font-bold mb-2"><div className="w-3 h-3 rounded bg-primary/40 shadow-sm" /> BREAKFAST PROTOCOL</Label>
                       <textarea className="w-full min-h-[90px] rounded-lg border-border bg-background p-4 text-sm focus:border-primary focus:ring-1 focus:ring-ring transition-colors" placeholder="Define macronutrient thresholds and ingredient constraints..." value={planData.breakfast} onChange={(e) => setPlanData({...planData, breakfast: e.target.value})} disabled={selectedPatient.status === "completed"} />
                    </div>
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2 font-bold mb-2"><div className="w-3 h-3 rounded bg-primary/60 shadow-sm" /> LUNCH PROTOCOL</Label>
                       <textarea className="w-full min-h-[90px] rounded-lg border-border bg-background p-4 text-sm focus:border-primary focus:ring-1 focus:ring-ring transition-colors" value={planData.lunch} onChange={(e) => setPlanData({...planData, lunch: e.target.value})} disabled={selectedPatient.status === "completed"} />
                    </div>
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2 font-bold mb-2"><div className="w-3 h-3 rounded bg-primary/80 shadow-sm" /> DINNER PROTOCOL</Label>
                       <textarea className="w-full min-h-[90px] rounded-lg border-border bg-background p-4 text-sm focus:border-primary focus:ring-1 focus:ring-ring transition-colors" value={planData.dinner} onChange={(e) => setPlanData({...planData, dinner: e.target.value})} disabled={selectedPatient.status === "completed"} />
                    </div>
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2 font-bold mb-2"><div className="w-3 h-3 rounded bg-primary shadow-sm" /> SUPPLEMENTS & SNACKS</Label>
                       <textarea className="w-full min-h-[90px] rounded-lg border-border bg-background p-4 text-sm focus:border-primary focus:ring-1 focus:ring-ring transition-colors" value={planData.snacks} onChange={(e) => setPlanData({...planData, snacks: e.target.value})} disabled={selectedPatient.status === "completed"} />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="instructions" className="p-6 m-0 bg-background">
                     <div className="space-y-2">
                       <Label className="font-bold mb-2 block">Physiological Guidelines</Label>
                       <textarea className="w-full min-h-[300px] rounded-lg border-border bg-background p-4 text-sm focus:border-primary focus:ring-1 focus:ring-ring transition-colors leading-relaxed" placeholder="Hydration, exercise contraindications..." value={planData.instructions} onChange={(e) => setPlanData({...planData, instructions: e.target.value})} disabled={selectedPatient.status === "completed"} />
                    </div>
                  </TabsContent>
                </Tabs>
               </div>

            </CardContent>
            <CardFooter className="pt-6 pb-6 px-6 flex items-center justify-end bg-muted border-t border-border gap-3">
              <Button type="button" variant="outline" onClick={() => setViewState("profile")}>
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedPatient.status === "completed"} className="shadow-xl hover:shadow-primary/20 px-8">
                {isSubmitting ? "Deploying..." : <span>Deploy Protocol <Send className="ml-2 w-4 h-4 inline" /></span>}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  };

  const renderProgressView = () => {
    if (!selectedPatient) return null;

    const progressSeries =
      progressData?.intake_vs_target.map((point) => ({
        name: point.day_label,
        intake: point.intake_calories,
        target: point.target_calories,
      })) ?? [];
    const latestPoint = progressData?.intake_vs_target[progressData.intake_vs_target.length - 1];
    const activePlan = patientPlans.find((plan) => plan.status === "active") ?? patientPlans[0];
    const currentPlanDay = activePlan ? activePlan.current_day_index + 1 : 0;
    const currentDayContent = activePlan?.content_json?.find((day) => day.day_index === activePlan.current_day_index);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setViewState("profile")}
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
          </Button>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            Progress Scope: Client {selectedPatient.client_id}
          </Badge>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Progress Overview</h2>
          <p className="text-muted-foreground">Intake trends and meal-plan progression for {selectedPatient.name}.</p>
        </div>

        {isProgressLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[110px] w-full" />
            <Skeleton className="h-[420px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : progressError ? (
          <Card className="border-destructive/20 bg-destructive/10">
            <CardContent className="p-6 text-destructive">{progressError}</CardContent>
          </Card>
        ) : (
          <>
            <CalorieStats intakeCalories={latestPoint?.intake_calories ?? 0} targetCalories={latestPoint?.target_calories ?? 0} />
            <ProgressChart data={progressSeries} />

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Meal Plan Progression
                </CardTitle>
                <CardDescription>Active plan adherence and current day status for this patient.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activePlan ? (
                  <p className="text-sm text-muted-foreground">No assigned meal plan found for this patient yet.</p>
                ) : (
                  <>
                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold">{activePlan.title}</p>
                        <Badge variant="outline" className="capitalize">{activePlan.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Day {currentPlanDay} of {activePlan.duration_days}
                      </p>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-primary" style={{ width: `${activePlan.progress_percent}%` }} />
                      </div>
                      <p className="mt-2 text-right text-sm font-medium">{Math.round(activePlan.progress_percent)}%</p>
                    </div>

                    <Button variant="outline" onClick={() => setIsPlanDetailsOpen((prev) => !prev)}>
                      {isPlanDetailsOpen ? "Hide Plan Details" : "View Plan Details"}
                    </Button>

                    {isPlanDetailsOpen && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="border-border">
                          <CardHeader>
                            <CardTitle className="text-base">Day {currentPlanDay} Meals</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <p><span className="font-semibold">Breakfast:</span> {currentDayContent?.breakfast || "N/A"}</p>
                            <p><span className="font-semibold">Lunch:</span> {currentDayContent?.lunch || "N/A"}</p>
                            <p><span className="font-semibold">Dinner:</span> {currentDayContent?.dinner || "N/A"}</p>
                            <p><span className="font-semibold">Snacks:</span> {currentDayContent?.snacks || "N/A"}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-border">
                          <CardHeader>
                            <CardTitle className="text-base">Nutritionist Instructions</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {currentDayContent?.instructions || "No specific instructions recorded for this day."}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full pb-10">
      {viewState === "designer"
        ? renderDesigner()
        : viewState === "profile"
          ? renderProfile()
          : viewState === "progress"
            ? renderProgressView()
            : renderListView()}
    </div>
  );
}
