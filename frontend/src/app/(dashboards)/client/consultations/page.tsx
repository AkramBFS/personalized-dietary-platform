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
} from "lucide-react";

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking states (as per your current logic)
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [selectedNutri, setSelectedNutri] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consRes, nutriRes] = await Promise.all([
          api.get("/client/consultations/").catch(() => null),
          api.get("/marketplace/nutritionists/").catch(() => null),
        ]);

        if (consRes?.data)
          setConsultations(consRes.data.results || consRes.data);
        else throw new Error("Mock cons");

        if (nutriRes?.data)
          setNutritionists(nutriRes.data.results || nutriRes.data);
      } catch (e) {
        // Populated Mock Data based on API Doc fields
        setConsultations([
          {
            id: 1042,
            status: "scheduled",
            appointment_date: "2026-05-12",
            start_time: "10:00",
            end_time: "11:00",
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
            user: { username: "Dr. Sarah Smith" },
            specialization: { name: "Weight Loss" },
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
      <div className="space-y-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Consultations
        </h1>
        <p className="text-muted-foreground">
          Manage your upcoming sessions and professional guidance.
        </p>
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
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-medium">
                No past or upcoming consultations found.
              </p>
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
                            `$${c.price_paid.toFixed(2)}`
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
                          <div className="text-[13px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-start gap-2 border border-amber-100 dark:border-amber-900/30">
                            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              Zoom link will be added by the nutritionist 5–10
                              minutes before the call.{" "}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
