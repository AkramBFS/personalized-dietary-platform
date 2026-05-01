"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  addNutritionistPatientNote,
  getNutritionistConsultations,
  getNutritionistPatientProfile,
  NutritionistConsultation,
  NutritionistPatientProfile,
  patchConsultationZoomLink,
} from "@/lib/nutritionist";
import { X } from "lucide-react";

function statusBadge(status: NutritionistConsultation["status"]) {
  if (status === "scheduled") return <Badge variant="outline">Scheduled</Badge>;
  if (status === "notified") return <Badge variant="secondary" className="bg-primary/15 text-primary border-0">Notified</Badge>;
  if (status === "finished") return <Badge className="bg-primary text-primary-foreground">Finished</Badge>;
  return <Badge variant="destructive">Cancelled</Badge>;
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<NutritionistConsultation[]>([]);
  const [selected, setSelected] = useState<NutritionistConsultation | null>(null);
  const [patientProfile, setPatientProfile] = useState<NutritionistPatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLink, setZoomLink] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSavingZoom, setIsSavingZoom] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const payload = await getNutritionistConsultations();
        setConsultations(payload);
      } catch {
        toast.error("Failed to load consultations.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadConsultations();
  }, []);

  useEffect(() => {
    if (!selected) {
      setPatientProfile(null);
      setZoomLink("");
      return;
    }
    setZoomLink(selected.zoom_link ?? "");
    const loadPatient = async () => {
      try {
        const profile = await getNutritionistPatientProfile(selected.client_id);
        setPatientProfile(profile);
      } catch {
        toast.error("Failed to load patient profile.");
      }
    };
    void loadPatient();
  }, [selected]);

  const saveZoomLink = async () => {
    if (!selected || !zoomLink.trim()) return;
    setIsSavingZoom(true);
    try {
      await patchConsultationZoomLink(selected.id, zoomLink.trim());
      setConsultations((prev) =>
        prev.map((row) => (row.id === selected.id ? { ...row, zoom_link: zoomLink.trim(), status: "notified" } : row)),
      );
      setSelected((prev) => (prev ? { ...prev, zoom_link: zoomLink.trim(), status: "notified" } : prev));
      toast.success("Zoom link saved and client notified.");
    } catch {
      toast.error("Could not update zoom link.");
    } finally {
      setIsSavingZoom(false);
    }
  };

  const savePatientNote = async () => {
    if (!selected || !noteInput.trim()) return;
    setIsSavingNote(true);
    try {
      await addNutritionistPatientNote(selected.client_id, { note_content: noteInput.trim() });
      setPatientProfile((prev) => (prev ? { ...prev, notes: [noteInput.trim(), ...prev.notes] } : prev));
      setNoteInput("");
      toast.success("Patient note added.");
    } catch {
      toast.error("Could not save patient note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading consultations...</div>;

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Upcoming Consultations</CardTitle>
          <CardDescription>Select an appointment to open the consultation workspace modal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>
                    <div className="font-medium">{consultation.client_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {consultation.start_time} - {consultation.end_time}
                    </div>
                  </TableCell>
                  <TableCell>{consultation.appointment_date}</TableCell>
                  <TableCell>{statusBadge(consultation.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(consultation)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-border">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Consultation Workspace</CardTitle>
                <CardDescription>Managing {selected.client_name}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zoom_link">Meeting Link</Label>
                <Input
                  id="zoom_link"
                  placeholder="https://zoom.us/j/..."
                  value={zoomLink}
                  onChange={(event) => setZoomLink(event.target.value)}
                />
                <Button onClick={saveZoomLink} disabled={isSavingZoom || !zoomLink.trim()}>
                  {isSavingZoom ? "Saving..." : "Update & Notify"}
                </Button>
              </div>

              {patientProfile ? (
                <div className="space-y-3 rounded-md border p-3">
                  <h4 className="font-semibold">Patient profile history</h4>
                  <p className="text-sm">BMI: {patientProfile.bmi} | BMR: {patientProfile.bmr}</p>
                  <p className="text-sm">Goal: {patientProfile.goal_name}</p>
                  <p className="text-sm text-muted-foreground">{patientProfile.health_history}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-md border p-2 text-sm">Current: {patientProfile.progress.current_weight} kg</div>
                    <div className="rounded-md border p-2 text-sm">Goal: {patientProfile.progress.goal_weight} kg</div>
                    <div className="rounded-md border p-2 text-sm">
                      Progress adherence: {patientProfile.progress.adherence_score}%
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="note">Add note about patient</Label>
                <textarea
                  id="note"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                  placeholder="Clinical note for follow-up..."
                />
                <Button variant="outline" onClick={savePatientNote} disabled={isSavingNote || !noteInput.trim()}>
                  {isSavingNote ? "Saving note..." : "Save Note"}
                </Button>
              </div>

              {patientProfile?.notes.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent notes</p>
                  {patientProfile.notes.slice(0, 3).map((note, index) => (
                    <p key={`${note}-${index}`} className="rounded-md border p-2 text-sm text-muted-foreground">
                      {note}
                    </p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

