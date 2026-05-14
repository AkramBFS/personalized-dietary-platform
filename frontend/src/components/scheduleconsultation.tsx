"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  CheckCircle2,
  CalendarX,
  MailCheck,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getNutritionistAvailability,
  getNutritionistProfile,
  MarketplaceNutritionistProfile,
} from "@/lib/api";
import { buildPaymentUrl } from "@/lib/payment";
import NutritionistProfileModal from "./NutritionistProfileModal";

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface NutritionistProfile {
  id: string | number;
  name: string;
  specialization: string;
  tags: string[];
  bio: string;
  consultation_price: number;
  profile_image: string;
}

interface AvailabilityResponse {
  is_holiday: boolean;
  available_slots: TimeSlot[];
}

type AvailabilityPayload = TimeSlot[] | AvailabilityResponse | {
  results?: TimeSlot[];
};

interface ScheduleProps {
  nutritionistId: string;
}

function mapNutritionistProfile(
  profile: MarketplaceNutritionistProfile,
  fallbackId: string,
): NutritionistProfile {
  return {
    id: profile.nutritionist_id ?? fallbackId,
    name: profile.username ?? "Unknown",
    specialization: profile.specialization_name ?? "",
    tags: [
      profile.specialization_name,
      ...(Array.isArray(profile.languages) ? profile.languages : []),
    ].filter(Boolean) as string[],
    bio: profile.bio ?? "",
    consultation_price: Number(profile.consultation_price ?? 0),
    profile_image: profile.profile_photo_url
      ? profile.profile_photo_url.startsWith("http")
        ? profile.profile_photo_url
        : `http://127.0.0.1:8000/${profile.profile_photo_url}`
      : "/placeholder-avatar.png",
  };
}

export default function ScheduleConsultation({
  nutritionistId,
}: ScheduleProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [consultationType, setConsultationType] = useState<"advice_only" | "plan_included">("advice_only");
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(null);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setIsPageLoading(true);
        const profile = await getNutritionistProfile(nutritionistId);
        if (!isMounted) return;
        setNutritionist(mapNutritionistProfile(profile, nutritionistId));
        setError(null);
      } catch (err) {
        console.error("Failed to load profile", err);
        if (isMounted) {
          setError("Failed to load nutritionist profile");
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [nutritionistId]);

  useEffect(() => {
    if (!nutritionist) return;
    let isMounted = true;

    const fetchSlots = async () => {
      setIsSlotsLoading(true);
      setIsHoliday(false);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const raw = await getNutritionistAvailability(nutritionistId, formattedDate);
        if (!isMounted) return;

        const payload = raw as AvailabilityPayload;
        let rawSlots: TimeSlot[] = [];
        
        if (Array.isArray(payload)) {
          rawSlots = payload;
        } else if ("available_slots" in payload && Array.isArray(payload.available_slots)) {
          rawSlots = payload.available_slots;
          if ("is_holiday" in payload) {
            setIsHoliday(!!payload.is_holiday);
          }
        } else if ("results" in payload && Array.isArray(payload.results)) {
          rawSlots = payload.results;
        }
        
        // Split ranges into 1-hour slots
        const generatedSlots: TimeSlot[] = [];
        rawSlots.forEach(range => {
          const [startH, startM] = range.start_time.split(":").map(Number);
          const [endH, endM] = range.end_time.split(":").map(Number);
          
          let currentH = startH;
          let currentM = startM;
          
          // Total minutes from start of day
          const totalEndMinutes = endH * 60 + endM;
          
          while (currentH * 60 + currentM + 60 <= totalEndMinutes) {
            const nextTotalMinutes = currentH * 60 + currentM + 60;
            const nextH = Math.floor(nextTotalMinutes / 60);
            const nextM = nextTotalMinutes % 60;
            
            generatedSlots.push({
              start_time: `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`,
              end_time: `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`,
              is_available: range.is_available ?? true
            });
            
            currentH = nextH;
            currentM = nextM;
          }
        });
        
        setAvailability(generatedSlots);
      } catch (err) {
        console.error("Failed to load slots", err);
        if (isMounted) {
          setAvailability([]);
        }
      } finally {
        if (isMounted) {
          setIsSlotsLoading(false);
        }
      }
    };

    void fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [nutritionist, nutritionistId, selectedDate]);

  const days = useMemo(() => {
    const start = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
  }, []);

  const morningSlots = availability.filter(
    (slot) => parseInt(slot.start_time.split(":")[0], 10) < 12,
  );
  const afternoonSlots = availability.filter(
    (slot) => parseInt(slot.start_time.split(":")[0], 10) >= 12,
  );

  if (isPageLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading practitioner details...
        </p>
      </div>
    );
  }

  if (error && !nutritionist) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const currentNutritionist = nutritionist ?? {
    id: nutritionistId,
    name: "Loading...",
    specialization: "",
    tags: [],
    bio: "",
    consultation_price: 0,
    profile_image: "/placeholder-avatar.png",
  };

  const handleContinueToPayment = () => {
    if (!selectedSlot || !nutritionist) return;

    setIsRedirectingToPayment(true);
    const paymentHref = buildPaymentUrl({
      type: "consultation",
      nutritionistId: Number(nutritionist.id),
      appointmentDate: format(selectedDate, "yyyy-MM-dd"),
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      consultationType,
    });
    router.push(paymentHref);
  };

  return (
    <main className="flex-grow pt-12 pb-24 px-6 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Schedule Your Consultation
            </h1>
            <p className="text-lg text-muted-foreground">
              Book a private session for personalized nutritional guidance.
            </p>
          </div>

          <section className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row gap-6 items-start shadow-brand">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <img
                alt={currentNutritionist.name}
                className="w-full h-full object-cover"
                src={currentNutritionist.profile_image}
              />
            </div>
            <div className="flex flex-col w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    {currentNutritionist.name}
                  </h2>
                  <p className="text-accent-foreground font-medium mt-1">
                    {currentNutritionist.specialization}
                  </p>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-sm font-semibold text-button-primary bg-accent hover:bg-primary hover:text-primary-foreground rounded-lg px-4 py-2 transition-all w-full sm:w-auto"
                >
                  View Full Profile
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentNutritionist.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentNutritionist.bio}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4 mt-2">
            <h3 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> Choose a Time Slot
            </h3>

            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="border-b border-border p-4 flex items-center justify-between bg-muted/30">
                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar px-4 w-full justify-start sm:justify-center">
                  {days.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-14 h-14 rounded-full transition-all shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-brand scale-110"
                            : "hover:bg-accent text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground",
                          )}
                        >
                          {format(date, "eee")}
                        </span>
                        <span className="text-lg font-bold">
                          {format(date, "d")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-8 min-h-[300px]">
                {isSlotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Loading available slots...
                    </span>
                  </div>
                ) : isHoliday ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarX className="w-12 h-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-bold text-foreground">Practitioner is on Holiday</h4>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      {currentNutritionist.name} is not available on {format(selectedDate, "MMMM do")}. Please select another date.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Sun className="w-5 h-5 text-amber-500" /> Morning
                        Sessions
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {morningSlots.length > 0 ? (
                          morningSlots.map((slot) => (
                            <button
                              key={slot.start_time}
                              disabled={!slot.is_available}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "py-3 px-4 rounded-lg border text-sm font-semibold transition-all text-center",
                                !slot.is_available &&
                                  "opacity-40 cursor-not-allowed bg-muted line-through",
                                selectedSlot?.start_time === slot.start_time
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "border-border text-foreground hover:border-primary hover:text-primary",
                              )}
                            >
                              {slot.start_time} AM
                            </button>
                          ))
                        ) : (
                          <p className="col-span-full text-muted-foreground text-sm text-center py-4">
                            No morning slots available for this date
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Sunset className="w-5 h-5 text-orange-500" /> Afternoon
                        Sessions
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {afternoonSlots.length > 0 ? (
                          afternoonSlots.map((slot) => (
                            <button
                              key={slot.start_time}
                              disabled={!slot.is_available}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "py-3 px-4 rounded-lg border text-sm font-semibold transition-all text-center",
                                !slot.is_available &&
                                  "opacity-40 cursor-not-allowed bg-muted line-through",
                                selectedSlot?.start_time === slot.start_time
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "border-border text-foreground hover:border-primary hover:text-primary",
                              )}
                            >
                              {slot.start_time} PM
                            </button>
                          ))
                        ) : (
                          <p className="col-span-full text-muted-foreground text-sm text-center py-4">
                            No afternoon slots available for this date
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-8 flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4">
              Booking Summary
            </h3>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setConsultationType("advice_only")}
                  className={cn(
                    "text-xs py-2 rounded-lg font-bold transition-all",
                    consultationType === "advice_only"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Advice Only
                </button>
                <button
                  onClick={() => setConsultationType("plan_included")}
                  className={cn(
                    "text-xs py-2 rounded-lg font-bold transition-all",
                    consultationType === "plan_included"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  With Plan
                </button>
              </div>
            </div>

            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  {selectedSlot
                    ? `Scheduled for ${format(selectedDate, "MMM do")} at ${selectedSlot.start_time}`
                    : "No time slot selected"}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  1-on-1 with {currentNutritionist.name}
                </span>
              </li>
            </ul>

            <div className="bg-accent p-5 rounded-xl border border-primary/10 mt-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-secondary-foreground">
                  Total Due Today
                </span>
                <span className="font-serif text-3xl text-foreground font-bold">
                  ${currentNutritionist.consultation_price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                Final payment happens on the next secure checkout step.
              </p>
            </div>

            <button
              disabled={!selectedSlot || isRedirectingToPayment}
              onClick={handleContinueToPayment}
              className="bg-button-primary bg-btn-primary text-button-primary-foreground font-bold text-base py-4 px-6 rounded-xl w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-brand flex items-center justify-center gap-2"
            >
              {isRedirectingToPayment ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Confirm & Proceed to Payment"
              )}
            </button>

            <div className="border-t border-border pt-6 mt-2 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <CalendarX className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flexible rescheduling up to <strong>24 hours</strong> before
                  the call.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <MailCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Booking confirmation sent instantly via email with Zoom link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NutritionistProfileModal
        id={nutritionistId}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  );
}
