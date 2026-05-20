"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  Activity,
  Eye,
  FileText,
  LineChart,
  Utensils,
  Plus,
  Trash2,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";
import {
  NutritionistPatientAssignedPlan,
  NutritionistPatientProgressResponse,
  getNutritionistPatientPlans,
  getNutritionistPatientProgress,
  getNutritionistPatients,
  getNutritionistPatientProfile,
  createNutritionistPlan,
  updateNutritionistPlan,
  deleteNutritionistPlan,
  getNutritionistPlans,
  NutritionistPlan,
  PlanCategory,
  MealContent,
  MealIngredient,
  createEmptyMeal,
} from "@/lib/nutritionist";
import { resolveApiUrl } from "@/lib/api";
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

type ViewState = "list" | "profile" | "designer" | "progress";

export default function ConsultationsAndPlansPage() {
  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressData, setProgressData] =
    useState<NutritionistPatientProgressResponse | null>(null);
  const [patientPlans, setPatientPlans] = useState<
    NutritionistPatientAssignedPlan[]
  >([]);
  const [isPlanDetailsOpen, setIsPlanDetailsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // New state to hold the specific client's custom plan
  const [assignedPlan, setAssignedPlan] = useState<NutritionistPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  // Fetch patients from API on mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const apiPatients = await getNutritionistPatients();
        setPatients(
          (Array.isArray(apiPatients) ? apiPatients : []).map((p) => ({
            client_id: p.client_id,
            name: p.username,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username)}&background=4f46e5&color=fff`,
            age: 0,
            weight: 0,
            height: 0,
            bmi: 0,
            goals: "",
            healthHistory: "",
            consultationDate: p.first_consultation_date
              ? new Date(p.first_consultation_date).toLocaleString()
              : "N/A",
            status: "pending_plan" as const,
          })),
        );
      } catch {
        toast.error("Failed to load patients.");
      } finally {
        setIsListLoading(false);
      }
    };
    void loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        patient.client_id.toString().includes(debouncedSearch.toLowerCase()) ||
        patient.goals.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [patients, debouncedSearch]);

  const freshIngredient = (): MealIngredient => ({ name: "", amount: "", unit: "" });

  const freshDay = () => ({
    breakfast: createEmptyMeal(),
    lunch: createEmptyMeal(),
    dinner: createEmptyMeal(),
    snacks: createEmptyMeal(),
    instructions: "",
  });

  const [planData, setPlanData] = useState({
    title: "",
    description: "",
    duration: 7,
    price: 0,
    category: "personalized" as PlanCategory,
    coverImageFile: null as File | null,
    coverImagePreviewUrl: "",
    days: [freshDay()],
  });

  const revokePreviewUrl = (url?: string) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      revokePreviewUrl(planData.coverImagePreviewUrl);
    };
  }, [planData.coverImagePreviewUrl]);

  const resetForm = () => {
    revokePreviewUrl(planData.coverImagePreviewUrl);
    setPlanData({
      title: "",
      description: "",
      duration: 7,
      price: 0,
      category: "personalized",
      coverImageFile: null,
      coverImagePreviewUrl: "",
      days: [freshDay()],
    });
    setEditingPlanId(null);
  };

  const enterProfile = async (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setViewState("profile");
    setAssignedPlan(null);
    setIsPlanLoading(true);

    let updatedPatient = patient;

    // Hydrate the patient profile from the API if data is missing
    if (patient.age === 0) {
      try {
        const profile = await getNutritionistPatientProfile(patient.client_id);
        updatedPatient = {
          ...patient,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          bmi: profile.bmi,
          goals: profile.goal_name || patient.goals,
          healthHistory: profile.health_history || patient.healthHistory,
        };
        setSelectedPatient(updatedPatient);
        setPatients((prev) =>
          prev.map((p) => (p.client_id === patient.client_id ? updatedPatient : p)),
        );
      } catch {
        toast.error("Could not load full patient profile.");
      }
    }

    // Now let's fetch nutritionist plans to see if this patient has an active private-custom plan!
    try {
      const allPlans = await getNutritionistPlans();
      const customPlan = allPlans.find(
        (plan) =>
          plan.target_client_id === patient.client_id &&
          plan.plan_type === "private-custom"
      );
      if (customPlan) {
        setAssignedPlan(customPlan);
        const completedPatient = { ...updatedPatient, status: "completed" as const };
        setSelectedPatient(completedPatient);
        setPatients((prev) =>
          prev.map((p) =>
            p.client_id === patient.client_id ? completedPatient : p
          )
        );
      } else {
        setAssignedPlan(null);
        const pendingPatient = { ...updatedPatient, status: "pending_plan" as const };
        setSelectedPatient(pendingPatient);
        setPatients((prev) =>
          prev.map((p) =>
            p.client_id === patient.client_id ? pendingPatient : p
          )
        );
      }
    } catch {
      console.error("Could not load plans for patient.");
    } finally {
      setIsPlanLoading(false);
    }
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
        setProgressError(
          "You are not authorized to view this patient’s progress data.",
        );
      } else {
        setProgressError("Failed to load patient progress. Please try again.");
      }
    } finally {
      setIsProgressLoading(false);
    }
  };

  const startPlanDesigner = () => {
    if (assignedPlan) {
      revokePreviewUrl(planData.coverImagePreviewUrl);
      setEditingPlanId(assignedPlan.id);
      setPlanData({
        title: assignedPlan.title,
        description: assignedPlan.description || "",
        duration: assignedPlan.duration_days,
        price: assignedPlan.price,
        category: "personalized",
        coverImageFile: null,
        coverImagePreviewUrl: resolveApiUrl(assignedPlan.cover_image_url) || "",
        days:
          assignedPlan.content_json.length > 0
            ? assignedPlan.content_json.map((day) => ({
                breakfast: typeof day.breakfast === "object" ? day.breakfast : createEmptyMeal(),
                lunch: typeof day.lunch === "object" ? day.lunch : createEmptyMeal(),
                dinner: typeof day.dinner === "object" ? day.dinner : createEmptyMeal(),
                snacks: typeof day.snacks === "object" ? day.snacks : createEmptyMeal(),
                instructions: day.instructions || "",
              }))
            : [freshDay()],
      });
    } else {
      resetForm();
    }
    setViewState("designer");
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!planData.title || !planData.days[0].breakfast.name) {
      toast.error("Please provide at least a title and day 1 breakfast name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: planData.title,
        description: planData.description || `Custom plan for ${selectedPatient.name}`,
        plan_type: "private-custom" as const,
        price: planData.price,
        duration_days: planData.duration,
        category: "personalized" as const,
        target_client_id: selectedPatient.client_id,
        cover_image: planData.coverImageFile || undefined,
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
        toast.success("Personalized plan updated successfully!");
      } else {
        await createNutritionistPlan(payload);
        toast.success("Personalized plan deployed successfully!");
      }
      
      // Reload profile
      await enterProfile(selectedPatient);
      setViewState("profile");
    } catch {
      toast.error("Failed to save the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlanId || !selectedPatient) return;
    if (!confirm("Are you sure you want to delete this custom plan?")) return;

    setIsSubmitting(true);
    try {
      await deleteNutritionistPlan(editingPlanId);
      toast.success("Personalized plan deleted successfully.");
      
      // Reload profile
      await enterProfile(selectedPatient);
      setViewState("profile");
    } catch {
      toast.error("Failed to delete the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderListView = () => (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {isListLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (<>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Active Consultations
          </h2>
          <p className="text-muted-foreground mt-1">
            Review your consultation history and manage incoming client
            action-items.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="pl-8 bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No patients found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow
                  key={patient.client_id}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div
                      className="flex items-center space-x-3 cursor-pointer p-1 -m-1 rounded-md hover:bg-accent"
                      onClick={() => enterProfile(patient)}
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage
                          src={patient.avatarUrl}
                          alt={patient.name}
                        />
                        <AvatarFallback>
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">
                          {patient.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {patient.client_id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-sm truncate max-w-[200px] block"
                      title={patient.goals}
                    >
                      {patient.goals}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      {patient.consultationDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.status === "completed" ? (
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        Completed
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 border-amber-500/20"
                      >
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      </>)}
    </div>
  );

  const renderProfile = () => {
    if (!selectedPatient) return null;
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setViewState("list")}
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Consultations
          </Button>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            Client Record: {selectedPatient.client_id}
          </Badge>
        </div>

        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="px-8 pt-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
              <Avatar className="h-32 w-32 border-2 border-border shadow-sm bg-muted animate-in fade-in duration-300">
                <AvatarImage
                  src={selectedPatient.avatarUrl}
                  alt={selectedPatient.name}
                />
                <AvatarFallback className="text-4xl text-primary">
                  {selectedPatient.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {selectedPatient.name}
                </h2>
                <p className="text-muted-foreground font-medium">
                  Last Consultation: {selectedPatient.consultationDate}
                </p>
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
                  
                  {isPlanLoading ? (
                    <Button disabled className="shadow-md rounded-full px-6">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Plans...
                    </Button>
                  ) : (
                    <Button
                      onClick={startPlanDesigner}
                      className="shadow-md rounded-full px-6"
                      disabled={selectedPatient.consultationDate === "N/A"}
                      title={selectedPatient.consultationDate === "N/A" ? "Patient must have a consultation before a custom plan can be drafted" : ""}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {assignedPlan ? "Manage Custom Plan" : "Draft Custom Plan"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Biometrics Matrix
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">
                        Age
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedPatient.age}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">
                        BMI
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {selectedPatient.bmi}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">
                        Weight
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedPatient.weight}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          kg
                        </span>
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">
                        Height
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedPatient.height}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          cm
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Clinical Profile
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/10">
                      <div className="flex bg-primary/20 w-8 h-8 rounded-full items-center justify-center mb-3">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Primary Goals
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedPatient.goals}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-background">
                      <h4 className="font-semibold text-foreground mb-2">
                        Medical History & Allergies
                      </h4>
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
          <Button
            variant="ghost"
            onClick={() => setViewState("profile")}
            className="pl-0 hover:bg-transparent flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          <Badge
            variant="outline"
            className="px-3 py-1 font-mono text-xs shadow-sm"
          >
            Client: {selectedPatient.name}
          </Badge>
        </div>

        <Card className="border-border shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70"></div>
          <form onSubmit={handleCreatePlan}>
            <CardHeader className="border-b border-border pb-6 mb-6">
              <CardTitle className="text-2xl">
                {editingPlanId ? "Edit Personalized Plan" : "New Personalized Plan"}
              </CardTitle>
              <CardDescription className="text-base mt-2 text-muted-foreground">
                Design a high-quality personalized nutritional plan for {selectedPatient.name}.
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
                    placeholder="e.g. 30-Day Hypertension Treatment Diet" 
                    className="h-11 bg-background border-border focus-visible:ring-ring transition-all duration-200"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={planData.description}
                    onChange={(e) => setPlanData({...planData, description: e.target.value})}
                    placeholder="Overview of the custom protocol for your patient"
                    className="h-11 bg-background border-border focus-visible:ring-ring transition-all duration-200"
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
                    className="h-11 bg-background border-border focus-visible:ring-ring transition-all duration-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="cover-image">Plan Cover Image</Label>
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border bg-background md:w-60">
                        {planData.coverImagePreviewUrl ? (
                          <img
                            src={planData.coverImagePreviewUrl}
                            alt="Plan cover preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                            <ImagePlus className="h-8 w-8" />
                            <span className="text-sm">No cover image selected</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <Input
                          id="cover-image"
                          type="file"
                          accept="image/*"
                          className="h-11 bg-background border-border cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground focus-visible:ring-ring transition-all duration-200"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file && file.size > 5 * 1024 * 1024) {
                              toast.error("Plan cover image must be under 5MB.");
                              e.target.value = "";
                              return;
                            }

                            const nextPreviewUrl = file ? URL.createObjectURL(file) : "";
                            revokePreviewUrl(planData.coverImagePreviewUrl);
                            setPlanData((prev) => ({
                              ...prev,
                              coverImageFile: file,
                              coverImagePreviewUrl: nextPreviewUrl,
                            }));
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional. This file will be sent as the backend `cover_image` multipart field.
                        </p>
                        {planData.coverImagePreviewUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-fit"
                            onClick={() => {
                              revokePreviewUrl(planData.coverImagePreviewUrl);
                              setPlanData((prev) => ({
                                ...prev,
                                coverImageFile: null,
                                coverImagePreviewUrl: "",
                              }));
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove image
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Content Template</h3>
                <div className="space-y-4">
                  {planData.days.map((day, index) => (
                    <div key={`day-${index}`} className="rounded-md border border-border p-4 space-y-4">
                      <p className="text-sm font-semibold">Day {index + 1}</p>

                      {(["breakfast", "lunch", "dinner", "snacks"] as const).map((mealKey) => {
                        const meal = day[mealKey] as MealContent;
                        return (
                          <div key={mealKey} className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground capitalize">{mealKey}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="md:col-span-2">
                                <Input
                                  placeholder={`${mealKey} name`}
                                  value={meal.name}
                                  onChange={(e) =>
                                    setPlanData((prev) => ({
                                      ...prev,
                                      days: prev.days.map((item, dayIndex) =>
                                        dayIndex === index
                                          ? { ...item, [mealKey]: { ...item[mealKey], name: e.target.value } }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className="h-8 text-sm bg-background border-border focus-visible:ring-ring transition-all duration-200"
                                />
                              </div>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Calories"
                                value={meal.calories || ""}
                                onChange={(e) =>
                                  setPlanData((prev) => ({
                                    ...prev,
                                    days: prev.days.map((item, dayIndex) =>
                                      dayIndex === index
                                        ? { ...item, [mealKey]: { ...item[mealKey], calories: parseInt(e.target.value) || 0 } }
                                        : item,
                                    ),
                                  }))
                                }
                                className="h-8 text-sm bg-background border-border focus-visible:ring-ring transition-all duration-200"
                              />
                            </div>
                            {/* Ingredients */}
                            {meal.ingredients.map((ing, ingIdx) => (
                              <div key={ingIdx} className="flex items-center gap-1.5">
                                <Input placeholder="Ingredient" value={ing.name} onChange={(e) => { const updated = [...meal.ingredients]; updated[ingIdx] = { ...updated[ingIdx], name: e.target.value }; setPlanData((prev) => ({ ...prev, days: prev.days.map((item, di) => di === index ? { ...item, [mealKey]: { ...item[mealKey], ingredients: updated } } : item) })); }} className="h-7 text-xs bg-background border-border focus-visible:ring-ring flex-1 transition-all duration-200" />
                                <Input placeholder="Amt" value={ing.amount} onChange={(e) => { const updated = [...meal.ingredients]; updated[ingIdx] = { ...updated[ingIdx], amount: e.target.value }; setPlanData((prev) => ({ ...prev, days: prev.days.map((item, di) => di === index ? { ...item, [mealKey]: { ...item[mealKey], ingredients: updated } } : item) })); }} className="h-7 text-xs bg-background border-border focus-visible:ring-ring w-16 transition-all duration-200" />
                                <Input placeholder="Unit" value={ing.unit} onChange={(e) => { const updated = [...meal.ingredients]; updated[ingIdx] = { ...updated[ingIdx], unit: e.target.value }; setPlanData((prev) => ({ ...prev, days: prev.days.map((item, di) => di === index ? { ...item, [mealKey]: { ...item[mealKey], ingredients: updated } } : item) })); }} className="h-7 text-xs bg-background border-border focus-visible:ring-ring w-16 transition-all duration-200" />
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60" onClick={() => { const updated = meal.ingredients.filter((_, i) => i !== ingIdx); setPlanData((prev) => ({ ...prev, days: prev.days.map((item, di) => di === index ? { ...item, [mealKey]: { ...item[mealKey], ingredients: updated } } : item) })); }}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="text-xs h-6" onClick={() => { setPlanData((prev) => ({ ...prev, days: prev.days.map((item, di) => di === index ? { ...item, [mealKey]: { ...item[mealKey], ingredients: [...(item[mealKey] as MealContent).ingredients, freshIngredient()] } } : item) })); }}>
                              <Plus className="w-3 h-3 mr-1" /> Ingredient
                            </Button>
                            <textarea
                              className="flex min-h-[40px] w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all duration-200"
                              placeholder="Notes"
                              value={meal.notes}
                              onChange={(e) =>
                                setPlanData((prev) => ({
                                  ...prev,
                                  days: prev.days.map((item, dayIndex) =>
                                    dayIndex === index
                                      ? { ...item, [mealKey]: { ...item[mealKey], notes: e.target.value } }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </div>
                        );
                      })}

                      <textarea
                        className="flex min-h-[60px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring outline-none transition-all duration-200"
                        placeholder="Day instructions"
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
              <p className="text-xs text-muted-foreground max-w-md">
                Personalized plans are active immediately for the assigned client.
              </p>
              <div className="flex w-full sm:w-auto gap-3">
                {editingPlanId && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeletePlan} 
                    disabled={isSubmitting} 
                    className="min-w-[120px] w-full sm:w-auto shadow-sm"
                  >
                    Delete Plan
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setViewState("profile"); }} 
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[160px] w-full sm:w-auto shadow-sm"
                >
                  {isSubmitting ? "Deploying..." : <span>{editingPlanId ? "Save Changes" : "Deploy Plan"}</span>}
                </Button>
              </div>
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
    const latestPoint =
      progressData?.intake_vs_target[progressData.intake_vs_target.length - 1];
    const activePlan =
      patientPlans.find((plan) => plan.status === "active") ?? patientPlans[0];
    const currentPlanDay = activePlan ? activePlan.current_day_index + 1 : 0;
    const currentDayContent = activePlan?.content_json?.find(
      (day) => day.day_index === activePlan.current_day_index,
    );

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
          <h2 className="text-2xl font-bold tracking-tight">
            Progress Overview
          </h2>
          <p className="text-muted-foreground">
            Intake trends and meal-plan progression for {selectedPatient.name}.
          </p>
        </div>

        {isProgressLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[110px] w-full" />
            <Skeleton className="h-[420px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : progressError ? (
          <Card className="border-destructive/20 bg-destructive/10">
            <CardContent className="p-6 text-destructive">
              {progressError}
            </CardContent>
          </Card>
        ) : (
          <>
            <CalorieStats
              intakeCalories={latestPoint?.intake_calories ?? 0}
              targetCalories={latestPoint?.target_calories ?? 0}
            />
            <ProgressChart data={progressSeries} />

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Meal Plan Progression
                </CardTitle>
                <CardDescription>
                  Active plan adherence and current day status for this patient.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activePlan ? (
                  <p className="text-sm text-muted-foreground">
                    No assigned meal plan found for this patient yet.
                  </p>
                ) : (
                  <>
                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold">{activePlan.title}</p>
                        <Badge variant="outline" className="capitalize">
                          {activePlan.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Day {currentPlanDay} of {activePlan.duration_days}
                      </p>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${activePlan.progress_percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-right text-sm font-medium">
                        {Math.round(activePlan.progress_percent)}%
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setIsPlanDetailsOpen((prev) => !prev)}
                    >
                      {isPlanDetailsOpen
                        ? "Hide Plan Details"
                        : "View Plan Details"}
                    </Button>

                    {isPlanDetailsOpen && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card className="border-border">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Day {currentPlanDay} Meals
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <p>
                              <span className="font-semibold">Breakfast:</span>{" "}
                              {(typeof currentDayContent?.breakfast === "object" ? currentDayContent?.breakfast?.name : currentDayContent?.breakfast) || "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Lunch:</span>{" "}
                              {(typeof currentDayContent?.lunch === "object" ? currentDayContent?.lunch?.name : currentDayContent?.lunch) || "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Dinner:</span>{" "}
                              {(typeof currentDayContent?.dinner === "object" ? currentDayContent?.dinner?.name : currentDayContent?.dinner) || "N/A"}
                            </p>
                            <p>
                              <span className="font-semibold">Snacks:</span>{" "}
                              {(typeof currentDayContent?.snacks === "object" ? currentDayContent?.snacks?.name : currentDayContent?.snacks) || "N/A"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-border">
                          <CardHeader>
                            <CardTitle className="text-base">
                              Nutritionist Instructions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {currentDayContent?.instructions ||
                              "No specific instructions recorded for this day."}
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
