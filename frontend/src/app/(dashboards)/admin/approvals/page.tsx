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
  type PendingNutritionist,
} from "@/lib/admin";

const mockPendingNutritionists: PendingNutritionist[] = [
  {
    id: 101,
    username: "dr_nour",
    email: "nour@example.com",
    bio: "Sports nutrition specialist with client-centered meal planning.",
    nutritionist: {
      specialization: { name: "Sports Nutrition" },
      years_experience: 6,
      certification_ref: "SN-44820",
      cert_image_url: "https://example.com/certs/sn-44820.jpg",
    },
  },
  {
    id: 102,
    username: "dr_lina",
    email: "lina@example.com",
    bio: "Clinical dietitian focused on diabetes and metabolic health.",
    nutritionist: {
      specialization: { name: "Clinical Nutrition" },
      years_experience: 8,
      certification_ref: "CL-99011",
      cert_image_url: "https://example.com/certs/cl-99011.jpg",
    },
  },
];

export default function AdminApprovalsPage() {
  const [records, setRecords] = useState<PendingNutritionist[]>(
    mockPendingNutritionists,
  );
  const [selected, setSelected] = useState<PendingNutritionist | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await getPendingNutritionists();
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const refreshAfterAction = (id: number) =>
    setRecords((prev) => prev.filter((item) => item.id !== id));

  const handleApprove = async (id: number) => {
    setSubmitting(true);
    try {
      await approveNutritionist(id);
      refreshAfterAction(id);
      setSelected(null);
      setIsModalOpen(false);
      toast.success("Nutritionist approved successfully.");
    } catch {
      toast.error("Approval failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setSubmitting(true);
    try {
      await rejectNutritionist(id, rejectionReason.trim());
      refreshAfterAction(id);
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

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                      <TableCell>
                        {item.nutritionist?.specialization?.name ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        {item.nutritionist?.years_experience ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        {item.nutritionist?.certification_ref ?? "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelected(item);
                            setIsModalOpen(true);
                          }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">Applicant Review</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Username:</span>{" "}
                  {selected.username}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {selected.email}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Bio:</span>{" "}
                  {selected.bio ?? "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Specialization:</span>{" "}
                  {selected.nutritionist?.specialization?.name ?? "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Experience:</span>{" "}
                  {selected.nutritionist?.years_experience ?? "N/A"} years
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Certification Ref:</span>{" "}
                  {selected.nutritionist?.certification_ref ?? "N/A"}
                </p>
                {selected.nutritionist?.cert_image_url ? (
                  <a
                    href={selected.nutritionist.cert_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-emerald-600 underline"
                  >
                    View Certificate
                  </a>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason for Rejection
                </label>
                <Input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Required when rejecting."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  disabled={submitting}
                  variant="outline"
                  onClick={() => handleReject(selected.id)}
                >
                  Reject
                </Button>
                <Button
                  disabled={submitting}
                  onClick={() => handleApprove(selected.id)}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
