"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  Settings2,
  Video,
  Link as LinkIcon,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  getNutritionistSchedule,
  getNutritionistConsultations,
  putNutritionistAvailability,
  addNutritionistHoliday,
  deleteNutritionistHoliday,
  patchConsultationZoomLink,
  patchConsultationStatus,
  AvailabilitySlotPayload,
} from "@/lib/nutritionist";

interface Consultation {
  id: number;
  patientName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: "scheduled" | "notified" | "finished";
  zoomLink: string | null;
}

interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sun, 1=Mon... 6=Sat
  startTime: string;
  endTime: string;
}

interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
}

// Generate a date for this week based on day index
const getDayDate = (dayOffset: number) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + dayOffset;
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Data Fetching ──────────────────────────────────────────────────
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        const [scheduleData, consultationsData] = await Promise.all([
          getNutritionistSchedule(),
          getNutritionistConsultations(),
        ]);

        // Map API availability (snake_case) to frontend AvailabilitySlot (camelCase)
        setAvailability(
          Array.isArray(scheduleData.availability)
            ? scheduleData.availability.map((slot) => ({
                dayOfWeek: slot.day_of_week,
                startTime: slot.start_time,
                endTime: slot.end_time,
              }))
            : [],
        );

        // Map API holidays to frontend Holiday
        setHolidays(
          Array.isArray(scheduleData.holidays)
            ? scheduleData.holidays.map((h) => ({
                id: h.id,
                date: h.holiday_date,
              }))
            : [],
        );

        // Map API consultations to frontend Consultation
        setConsultations(
          Array.isArray(consultationsData)
            ? consultationsData.map((c) => ({
                id: c.id,
                patientName: c.client_name,
                date: c.appointment_date,
                startTime: c.start_time,
                endTime: c.end_time,
                status: c.status === "cancelled" ? "finished" : c.status,
                zoomLink: c.zoom_link,
              }))
            : [],
        );
      } catch {
        toast.error("Failed to load schedule data.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadScheduleData();
  }, []);

  // Modal states
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [zoomLinkInput, setZoomLinkInput] = useState("");
  const [holidayDateInput, setHolidayDateInput] = useState("");

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const workHours = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

  // Calculate grid positioning
  const getTopPosition = (time: string) => {
    const [hours, mins] = time.split(":").map(Number);
    const relativeHour = hours + mins / 60 - 8; // Offset by 8:00 start
    return Math.max(0, relativeHour * 64); // 64px per hour
  };

  const getHeight = (start: string, end: string) => {
    return Math.max(0, getTopPosition(end) - getTopPosition(start));
  };

  const handleUpdateZoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) return;

    try {
      await patchConsultationZoomLink(selectedConsultation.id, zoomLinkInput);
      // Also update status to "notified" if currently "scheduled"
      if (selectedConsultation.status === "scheduled") {
        await patchConsultationStatus(selectedConsultation.id, "notified");
      }

      setConsultations((prev) =>
        prev.map((c) =>
          c.id === selectedConsultation.id
            ? {
                ...c,
                zoomLink: zoomLinkInput,
                status: c.status === "scheduled" ? "notified" : c.status,
              }
            : c,
        ),
      );
      toast.success("Zoom link updated. Client has been notified.");
    } catch {
      toast.error("Failed to update zoom link.");
    }
    setSelectedConsultation(null);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDateInput) return;

    try {
      const created = await addNutritionistHoliday(holidayDateInput);
      setHolidays([...holidays, { id: created.id, date: created.holiday_date }]);
      toast.success("Holiday successfully added and blocked in your calendar.");
      setHolidayDateInput("");
    } catch {
      toast.error("Failed to add holiday.");
    }
  };

  const handleRemoveHoliday = async (id: number) => {
    try {
      await deleteNutritionistHoliday(id);
      setHolidays(holidays.filter((h) => h.id !== id));
      toast.success("Holiday removed successfully.");
    } catch {
      toast.error("Failed to remove holiday.");
    }
  };

  // Handlers for modifying availability
  const toggleDayAvailability = (dayIdx: number) => {
    setAvailability((prev) => {
      if (prev.find((a) => a.dayOfWeek === dayIdx)) {
        return prev.filter((a) => a.dayOfWeek !== dayIdx);
      } else {
        return [
          ...prev,
          { dayOfWeek: dayIdx, startTime: "09:00", endTime: "17:00" },
        ];
      }
    });
  };

  const handleAvailabilityChange = (
    dayIdx: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setAvailability((prev) => {
      const existing = prev.find((a) => a.dayOfWeek === dayIdx);
      if (existing) {
        return prev.map((a) =>
          a.dayOfWeek === dayIdx ? { ...a, [field]: value } : a,
        );
      }
      return prev;
    });
  };

  const handleSaveAvailability = async () => {
    try {
      // Transform camelCase frontend state → snake_case API payload
      const payload: AvailabilitySlotPayload[] = availability.map((slot) => ({
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
      }));
      await putNutritionistAvailability(payload);
      toast.success("Availability preferences saved.");
    } catch {
      toast.error("Failed to save availability.");
    }
  };

  const getStatusColor = (status: Consultation["status"]) => {
    if (status === "scheduled")
      return "bg-primary/10 border-primary/20 text-primary";
    if (status === "notified")
      return "bg-amber-500/10 border-amber-500/20 text-amber-600";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 max-w-[1400px]">
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {!isLoading && (<><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Schedule Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your availability, block holidays, and orchestrate
            consultations.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted border border-border mb-6">
          <TabsTrigger value="calendar">
            <CalendarIcon className="w-4 h-4 mr-2" /> Weekly Time-Grid
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Settings2 className="w-4 h-4 mr-2" /> Configuration & Holidays
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <Card className="border-border shadow-sm overflow-hidden bg-background">
            <div className="flex bg-muted/50 border-b border-border text-sm font-semibold text-muted-foreground">
              <div className="w-20 shrink-0 border-r border-border py-3 text-center">
                GMT
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-7">
                {daysOfWeek.map((day, idx) => (
                  <div
                    key={day}
                    className={`hidden md:block text-center py-3 border-r relative border-border ${idx === 5 || idx === 6 ? "bg-muted/30 text-muted-foreground/60" : ""}`}
                  >
                    {day}
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">
                      {getDayDate(idx).slice(5)}
                    </div>
                  </div>
                ))}
                {/* Mobile view day header */}
                <div className="block md:hidden text-center py-3 w-full">
                  Current Day Overview
                </div>
              </div>
            </div>

            <div
              className="flex relative bg-background"
              style={{ height: `${workHours.length * 64}px` }}
            >
              {/* Time axis */}
              <div className="w-20 shrink-0 border-r border-border bg-background z-10">
                {workHours.map((hour) => (
                  <div
                    key={hour}
                    className="h-[64px] border-b border-border/50 text-xs text-muted-foreground text-center pr-2 relative"
                  >
                    <span className="absolute -top-2.5 right-2">{hour}:00</span>
                  </div>
                ))}
              </div>

              {/* Grid Area */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-7 relative overflow-x-auto">
                {/* Grid Lines */}
                {workHours.map((hour) => (
                  <div
                    key={`line-${hour}`}
                    className="absolute w-full border-b border-border/50 pointer-events-none"
                    style={{ top: `${(hour - 8) * 64}px` }}
                  />
                ))}

                {/* Day Columns */}
                {daysOfWeek.map((_, dayIdx) => {
                  const dateStr = getDayDate(dayIdx);
                  const isHoliday = holidays.some((h) => h.date === dateStr);
                  const dayAvailability = availability.find(
                    (a) => a.dayOfWeek === dayIdx,
                  );

                  // Compute unavailable temporal blocks for the visual representation
                  const unavailableBlocks: { start: string; end: string }[] =
                    [];
                  if (!dayAvailability) {
                    unavailableBlocks.push({ start: "08:00", end: "18:00" });
                  } else {
                    if (getTopPosition(dayAvailability.startTime) > 0) {
                      unavailableBlocks.push({
                        start: "08:00",
                        end: dayAvailability.startTime,
                      });
                    }
                    if (
                      getTopPosition(dayAvailability.endTime) <
                      getTopPosition("18:00")
                    ) {
                      unavailableBlocks.push({
                        start: dayAvailability.endTime,
                        end: "18:00",
                      });
                    }
                  }

                  return (
                    <div
                      key={`col-${dayIdx}`}
                      className="h-full border-r border-border/50 relative hidden md:block"
                    >
                      {/* Out of Office / Off Schedule Visual Blocks */}
                      {!isHoliday &&
  unavailableBlocks.map((block, i) => (
    <div
      key={`unavail-${dayIdx}-${i}`}
      className="absolute w-full z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDQwbDQwLTQwSDB6TTQwIDB2NDBMMCAwem0tMTAgMEwwIDUwdjUwbDUwLTUwVjBIMzB6TTAgMTAwVjUwbDUwIDUwSDB6TTAgOTBWMzBsNzAgNzBIMHoiIGZpbGw9IiNlN2U1ZTRhYyIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDQwbDQwLTQwSDB6TTQwIDB2NDBMMCAwem0tMTAgMEwwIDUwdjUwbDUwLTUwVjBIMzB6TTAgMTAwVjUwbDUwIDUwSDB6TTAgOTBWMzBsNzAgNzBIMHoiIGZpbGw9IiMxZTI5M2I4MCIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-40 shadow-inner"
      style={{
        top: `${getTopPosition(block.start)}px`,
        height: `${getHeight(block.start, block.end)}px`,
      }}
    />
  ))}

                      {/* Full Day Holiday Override Overlay */}
                      {isHoliday && (
                        <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none z-10">
                          <span className="bg-destructive/20 text-destructive text-xs px-2 py-1 rounded font-semibold border border-destructive/30 rotate-90 whitespace-nowrap tracking-widest shadow-sm">
                            HOLIDAY
                          </span>
                        </div>
                      )}

                      {/* Active Consultations */}
                      {consultations
                        .filter((c) => c.date === dateStr)
                        .map((consultation) => (
                          <div
                            key={consultation.id}
                            onClick={() =>
                              setSelectedConsultation(consultation)
                            }
                            className={`absolute w-[92%] ml-[4%] rounded-xl border p-2 shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden z-20 group ${getStatusColor(consultation.status)}`}
                            style={{
                              top: `${getTopPosition(consultation.startTime)}px`,
                              height: `${getHeight(consultation.startTime, consultation.endTime)}px`,
                            }}
                          >
                            <div className="flex flex-col h-full justify-between">
                              <div>
                                <p className="text-xs font-bold truncate leading-tight group-hover:text-foreground transition-colors">
                                  {consultation.patientName}
                                </p>
                                <p className="text-[10px] font-medium opacity-80">
                                  {consultation.startTime} -{" "}
                                  {consultation.endTime}
                                </p>
                              </div>
                              <div className="flex justify-between items-end">
                                {consultation.zoomLink ? (
                                  <a
                                    href={consultation.zoomLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 bg-background/60 hover:bg-background rounded shadow-sm text-primary transition-colors"
                                    title="Join Meeting"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span
                                    className="opacity-50"
                                    title="No zoom link provided"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {consultation.status === "finished" && (
                                  <CheckCircle className="w-3.5 h-3.5 opacity-60" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Weekly Availability Rules
                </CardTitle>
                <CardDescription>
                  Manage your recurring temporal arrays for booking slots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {daysOfWeek.map((day, idx) => {
                  const slot = availability.find((a) => a.dayOfWeek === idx);
                  return (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <label className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!slot}
                          onChange={() => toggleDayAvailability(idx)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-ring bg-background"
                        />
                        <span className="font-semibold text-sm w-24">
                          {day}
                        </span>
                      </label>
                      {slot ? (
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 ml-7 sm:ml-0">
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                idx,
                                "startTime",
                                e.target.value,
                              )
                            }
                            className="w-28 h-8 text-xs bg-background"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                idx,
                                "endTime",
                                e.target.value,
                              )
                            }
                            className="w-28 h-8 text-xs bg-background"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic bg-muted px-3 py-1 rounded-md mt-2 sm:mt-0 ml-7 sm:ml-0">
                          Off Schedule
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="bg-muted border-t border-border rounded-b-xl py-4 flex justify-end">
                <Button
                  onClick={handleSaveAvailability}
                  className="shadow-sm"
                >
                  Save Restrictions
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border shadow-sm h-fit">
              <form onSubmit={handleAddHoliday}>
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">
                    Holiday & Time-Off Picker
                  </CardTitle>
                  <CardDescription>
                    Block off specific dates to prevent consultation bookings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Date to Block</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="date"
                        required
                        value={holidayDateInput}
                        onChange={(e) => setHolidayDateInput(e.target.value)}
                        className="w-full h-11 border-border focus-visible:ring-destructive"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-11 border-destructive/20 text-destructive hover:bg-destructive/10 px-8"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Block
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-3 text-foreground">
                      Upcoming Blocked Dates
                    </h4>
                    <div className="space-y-2">
                      {holidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-md"
                        >
                          <div className="flex items-center text-destructive font-medium text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />{" "}
                            {holiday.date}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveHoliday(holiday.id)}
                            className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {holidays.length === 0 && (
                        <p className="text-sm text-muted-foreground italic px-2">
                          No holidays scheduled.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </>)}

    {!isLoading && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50 rounded-t-xl">
              <h3 className="font-bold">Consultation Details</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedConsultation(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Patient Identity
                  </p>
                  <p className="text-xl font-bold">
                    {selectedConsultation.patientName}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                      Date
                    </p>
                    <p className="font-medium text-sm flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1.5 text-muted-foreground" />{" "}
                      {selectedConsultation.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                      Time Frame
                    </p>
                    <p className="font-medium text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-muted-foreground" />{" "}
                      {selectedConsultation.startTime} -{" "}
                      {selectedConsultation.endTime}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleUpdateZoom}
                  className="pt-4 mt-4 border-t border-border"
                >
                  <div className="space-y-3">
                    <Label
                      htmlFor="zoom"
                      className="font-bold text-foreground"
                    >
                      Assign Zoom/Meeting Link
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Updating the meeting link will transition the status to
                      'notified' and automatically email the client.
                    </p>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="zoom"
                        defaultValue={selectedConsultation.zoomLink || ""}
                        onChange={(e) => setZoomLinkInput(e.target.value)}
                        className="pl-9 border-primary/20 focus-visible:ring-primary bg-primary/5"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-2"
                    >
                      Update & Notify Client
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
