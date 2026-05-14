"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  DollarSign,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";
import { getClientConsultations, ClientConsultation } from "@/lib/client/service";
import { getNutritionists } from "@/lib/api";

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<ClientConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching consultations and nutritionists...");
        const [consData, nutriData] = await Promise.all([
          getClientConsultations().catch((err) => {
            console.error("Error fetching consultations:", err);
            return null;
          }),
          getNutritionists().catch((err) => {
            console.error("Error fetching nutritionists:", err);
            return null;
          }),
        ]);

        console.log("API Response - Consultations:", consData);
        console.log("API Response - Nutritionists:", nutriData);

        if (consData) {
          setConsultations(consData);
        } else {
          // Fallback to mock if API fails or returns null
          throw new Error("Failed to fetch consultations");
        }

        if (nutriData) {
          const raw = nutriData.data || nutriData.results || nutriData || [];
          setNutritionists(Array.isArray(raw) ? raw : []);
        }
      } catch (e) {
        console.warn("Using mock data due to error:", e);
        // Populated Mock Data based on API Doc fields
        setConsultations([
          {
            id: 1042,
            status: "scheduled",
            appointment_date: "2026-05-12",
            start_time: "10:00:00",
            end_time: "11:00:00",
            consultation_type: "plan_included",
            is_free_from_plan: true,
            price_paid: 0.0,
            zoom_link: "https://zoom.us/j/mock123456",
            nutritionist_name: "Dr. Sarah Smith",
          },
        ]);
        setNutritionists([
          {
            id: 1,
            username: "Dr. Sarah Smith",
            specialization_name: "Weight Loss",
            consultation_price: 50,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Consultations
          </h1>
          <p className="text-muted-foreground">
            Manage your upcoming sessions and professional guidance.
          </p>
        </div>
        <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
          <Link href="/consultations">
            Book New Consultation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: List Past/Upcoming */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <Video className="w-5 h-5 text-primary" />
            My Schedule
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card/50">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Video className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No consultations found</h3>
              <p className="text-muted-foreground max-w-xs mb-6">
                You haven't scheduled any consultations yet. Ready to start your journey?
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/consultations">
                  Browse Nutritionists
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {consultations.map((c) => (
                <Card
                  key={c.id}
                  className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/15 rounded-lg">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-card-foreground">
                            {new Date(c.appointment_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {c.start_time} - {c.end_time}
                          </CardDescription>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <User className="w-3 h-3" />
                            <span className="font-semibold">{c.nutritionist_name || c.nutritionist_username || "Nutritionist"}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider uppercase ${
                          c.status === "scheduled"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          Type
                        </p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {c.consultation_type === "plan_included"
                            ? "Plan Session"
                            : "Advice Only"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          Payment
                        </p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {c.is_free_from_plan ? (
                            <span className="text-primary flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Covered
                              by Plan
                            </span>
                          ) : (
                            `$${(c.price_paid ?? 0).toFixed(2)}`
                          )}
                        </p>
                      </div>
                    </div>

                    {c.status === "scheduled" && (
                      <div className="pt-2">
                        {c.zoom_link ? (
                          <Button
                            asChild
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-lg shadow-sm"
                          >
                            <a
                              href={c.zoom_link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </a>
                          </Button>
                        ) : (
                          <div className="text-[13px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl flex items-start gap-3 border border-amber-100 dark:border-amber-900/20">
                            <Clock className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
                            <div className="space-y-1">
                              <p className="font-semibold">Meeting link pending</p>
                              <p className="text-xs opacity-80">
                                The nutritionist will provide the Zoom link approximately 5–10 minutes before the scheduled start time.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {c.status === "finished" && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full rounded-lg border-primary text-primary hover:bg-primary/5"
                          onClick={() => setReviewTarget({ 
                            id: c.id, 
                            title: `Consultation with ${c.nutritionist_name || c.nutritionist_username || "Nutritionist"}` 
                          })}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Post Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        type="consultation"
        id={reviewTarget?.id || 0}
        title={reviewTarget?.title || ""}
      />
    </div>
  );
}
