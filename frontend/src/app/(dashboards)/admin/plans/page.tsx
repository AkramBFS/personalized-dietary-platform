"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Check, X, Archive, Edit, Trash2 } from "lucide-react";
import { getModerationPlans, type ModerationPlan } from "@/lib/admin";
import api from "@/lib/api";

const mockPendingPlans: ModerationPlan[] = [
  {
    id: 1,
    title: "PCOS Reset Plan",
    plan_type: "public-predefined",
    status: "pending",
    price: 29.99,
    created_at: "2026-03-10T00:00:00Z",
  },
  {
    id: 2,
    title: "Lean Bulk 12-Week",
    plan_type: "private-custom",
    status: "pending",
    price: 49.0,
    created_at: "2026-03-22T00:00:00Z",
  },
];

const mockLivePlans: ModerationPlan[] = [
  {
    id: 3,
    title: "Summer Detox Plan",
    plan_type: "public-predefined",
    status: "approved",
    price: 39.99,
    created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: 4,
    title: "Weight Loss Accelerator",
    plan_type: "public-predefined",
    status: "approved",
    price: 59.99,
    created_at: "2026-01-20T00:00:00Z",
  },
];

const mockSeasonalPlans: ModerationPlan[] = [
  {
    id: 5,
    title: "Holiday Wellness Plan",
    plan_type: "public-predefined",
    status: "approved",
    price: 34.99,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export default function AdminPlansPage() {
  const [pendingPlans, setPendingPlans] =
    useState<ModerationPlan[]>(mockPendingPlans);
  const [livePlans, setLivePlans] = useState<ModerationPlan[]>(mockLivePlans);
  const [seasonalPlans, setSeasonalPlans] =
    useState<ModerationPlan[]>(mockSeasonalPlans);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ModerationPlan | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // In a real implementation, you'd fetch different plan types
        await getModerationPlans();
      } catch {
        // Using mock data
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleViewPlan = async (plan: ModerationPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      // In a real implementation, fetch plan details
      // const response = await api.get(`/admin/plans/${plan.id}/`);
      // setPlanDetails(response.data);

      // Mock plan details
      setPlanDetails({
        id: plan.id,
        title: plan.title,
        description: `Detailed description for ${plan.title}. This plan includes comprehensive meal planning, nutritional guidance, and progress tracking.`,
        plan_type: plan.plan_type,
        price: plan.price,
        created_at: plan.created_at,
        creator: "Dr. Nutritionist",
        content: "Full plan content would be displayed here...",
      });
    } catch (error) {
      console.error("Failed to fetch plan details", error);
      setPlanDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprovePlan = async (planId: number) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/plans/${planId}/approve/`);
      setPendingPlans((prev) => prev.filter((p) => p.id !== planId));
      setIsModalOpen(false);
      setSelectedPlan(null);
      toast.success("Plan approved successfully.");
    } catch (error) {
      console.error("Failed to approve plan", error);
      toast.error("Failed to approve plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPlan = async (planId: number, reason: string) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/plans/${planId}/reject/`, {
        rejection_reason: reason,
      });
      setPendingPlans((prev) => prev.filter((p) => p.id !== planId));
      setIsModalOpen(false);
      setSelectedPlan(null);
      toast.success("Plan rejected.");
    } catch (error) {
      console.error("Failed to reject plan", error);
      toast.error("Failed to reject plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchivePlan = async (planId: number) => {
    try {
      await api.post(`/admin/plans/${planId}/archive/`);
      setLivePlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success("Plan archived successfully.");
    } catch (error) {
      console.error("Failed to archive plan", error);
      toast.error("Failed to archive plan.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
        <p className="text-muted-foreground mt-1">
          Review pending plans, manage live marketplace plans, and oversee
          seasonal offerings.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-3 w-[480px]">
          <TabsTrigger value="pending">Pending Plans</TabsTrigger>
          <TabsTrigger value="live">Live Marketplace</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Plans Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : pendingPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {plan.plan_type.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>${plan.price}</TableCell>
                          <TableCell>
                            {new Date(plan.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPlan(plan)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Live Marketplace Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livePlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plan.plan_type.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>${plan.price}</TableCell>
                      <TableCell>
                        {new Date(plan.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchivePlan(plan.id)}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Seasonal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasonalPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plan.plan_type.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>${plan.price}</TableCell>
                      <TableCell>
                        {new Date(plan.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchivePlan(plan.id)}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">
                Plan Review - {selectedPlan?.title}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : planDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <p className="text-sm text-muted-foreground">
                        {planDetails.title}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <p className="text-sm text-muted-foreground capitalize">
                        {planDetails.plan_type?.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <p className="text-sm text-muted-foreground">
                        ${planDetails.price}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Creator</label>
                      <p className="text-sm text-muted-foreground">
                        {planDetails.creator}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground">
                      {planDetails.description}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-4 rounded-md max-h-60 overflow-y-auto">
                      {planDetails.content}
                    </div>
                  </div>
                  {selectedPlan?.status === "pending" && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleRejectPlan(
                            selectedPlan.id,
                            "Plan does not meet marketplace standards.",
                          )
                        }
                        disabled={submitting}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApprovePlan(selectedPlan.id)}
                        disabled={submitting}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Failed to load plan details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
