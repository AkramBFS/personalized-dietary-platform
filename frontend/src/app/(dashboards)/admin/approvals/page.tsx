"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import {
  approveNutritionist,
  getPendingNutritionists,
  rejectNutritionist,
  getNutritionistDetail,
  type PendingNutritionist,
} from "@/lib/admin";

export default function AdminApprovalsPage() {
  const [records, setRecords] = useState<PendingNutritionist[]>([]);
  const [selected, setSelected] = useState<PendingNutritionist | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleReview = async (item: PendingNutritionist) => {
    setSelected(item);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const data = await getNutritionistDetail(item.nutritionist_id);
      setSelected(data);
    } catch (error) {
      console.error("Failed to fetch nutritionist details", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPendingNutritionists();
        setRecords(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const refreshAfterAction = (nutritionist_id: number) =>
    setRecords((prev) => prev.filter((item) => item.nutritionist_id !== nutritionist_id));

  const handleApprove = async (nutritionist_id: number) => {
    setSubmitting(true);
    try {
      await approveNutritionist(nutritionist_id);
      refreshAfterAction(nutritionist_id);
      setSelected(null);
      setIsModalOpen(false);
      toast.success("Nutritionist approved successfully.");
    } catch {
      toast.error("Approval failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (nutritionist_id: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setSubmitting(true);
    try {
      await rejectNutritionist(nutritionist_id, rejectionReason.trim());
      refreshAfterAction(nutritionist_id);
      setSelected(null);
      setRejectionReason("");
      setIsModalOpen(false);
      toast.success("Nutritionist rejected.");
    } catch {
      toast.error("Rejection failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Nutritionist Approvals
        </h1>
        <p className="text-muted-foreground mt-1">
          Review submitted credentials and process approvals.
        </p>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Years Exp</TableHead>
                <TableHead>Certification Ref</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : records.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.username}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.specialization_name ?? "N/A"}</TableCell>
                      <TableCell>{item.years_experience ?? "N/A"}</TableCell>
                      <TableCell>{item.certification_ref ?? "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(item)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Applicant Review</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Username:</span>{" "}
                        <span className="block mt-1 font-medium">{selected.username}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Email:</span>{" "}
                        <span className="block mt-1 font-medium">{selected.email}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Country:</span>{" "}
                        <span className="block mt-1 font-medium">{selected.country_name ?? "N/A"}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Languages:</span>{" "}
                        <span className="block mt-1 font-medium">
                          {selected.languages?.length ? selected.languages.join(", ") : "N/A"}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Specialization:</span>{" "}
                        <span className="block mt-1 font-medium">{selected.specialization_name ?? "N/A"}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Experience:</span>{" "}
                        <span className="block mt-1 font-medium">{selected.years_experience ?? "N/A"} years</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Consultation Price:</span>{" "}
                        <span className="block mt-1 font-medium">
                          {selected.consultation_price !== undefined ? `$${selected.consultation_price}` : "N/A"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Status:</span>{" "}
                        <span className="block mt-1 font-medium capitalize">{selected.approval_status}</span>
                      </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2 mt-2 pt-4 border-t">
                      <p className="text-sm">
                        <span className="font-semibold text-muted-foreground">Bio:</span>{" "}
                        <span className="block mt-1 whitespace-pre-wrap">{selected.bio ?? "N/A"}</span>
                      </p>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2 mt-2 pt-4 border-t">
                      <p className="text-sm flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">Certification Reference:</span>
                        <span className="font-medium bg-muted px-2 py-1 rounded">{selected.certification_ref ?? "N/A"}</span>
                      </p>
                      
                      {selected.cert_image_url && (
                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-sm font-semibold text-muted-foreground">Certification Document:</span>
                          <a
                            href={selected.cert_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline block truncate hover:text-primary/80 transition-colors"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 space-y-2 mt-2 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Registered: {new Date(selected.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium">
                      Reason for Rejection
                    </label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Required when rejecting."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      disabled={submitting}
                      variant="outline"
                      onClick={() => handleReject(selected.nutritionist_id)}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      Reject
                    </Button>
                    <Button
                      disabled={submitting}
                      onClick={() => handleApprove(selected.nutritionist_id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Approve
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
