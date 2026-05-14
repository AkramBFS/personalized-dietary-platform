"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
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
import { getModerationPlans, getPlanDetail, approvePlan, rejectPlan, archivePlan, type ModerationPlan } from "@/lib/admin";

export default function AdminPlansPage() {
  const [pendingPlans, setPendingPlans] = useState<ModerationPlan[]>([]);
  const [livePlans, setLivePlans] = useState<ModerationPlan[]>([]);
  const [seasonalPlans, setSeasonalPlans] = useState<ModerationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ModerationPlan | null>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredPending = useMemo(() => 
    pendingPlans.filter(p => p.title.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [pendingPlans, debouncedSearch]
  );
  
  const filteredLive = useMemo(() => 
    livePlans.filter(p => p.title.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [livePlans, debouncedSearch]
  );
  
  const filteredSeasonal = useMemo(() => 
    seasonalPlans.filter(p => p.title.toLowerCase().includes(debouncedSearch.toLowerCase())),
    [seasonalPlans, debouncedSearch]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const plans = await getModerationPlans();
        setPendingPlans(plans.filter((p) => p.status === "pending"));
        setLivePlans(plans.filter((p) => p.status === "approved" && p.category !== "seasonal"));
        setSeasonalPlans(plans.filter((p) => p.status === "approved" && p.category === "seasonal"));
      } catch (error) {
        toast.error("Failed to fetch plans");
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
      const data = await getPlanDetail(plan.id);
      setPlanDetails(data);
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
      await approvePlan(planId);
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
      await rejectPlan(planId, reason);
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
      await archivePlan(planId);
      setLivePlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success("Plan archived successfully.");
    } catch (error) {
      console.error("Failed to archive plan", error);
      toast.error("Failed to archive plan.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
          <p className="text-muted-foreground mt-1">
            Review pending plans, manage live marketplace plans, and oversee
            seasonal offerings.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search plans..."
            className="pl-8 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-3 w-[480px]">
          <TabsTrigger value="pending">Pending Plans</TabsTrigger>
          <TabsTrigger value="live">Live Marketplace</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card className="border-border shadow-sm overflow-hidden">
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
                    : filteredPending.map((plan) => (
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
          <Card className="border-border shadow-sm overflow-hidden">
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
                  {filteredLive.map((plan) => (
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
                          className="text-destructive hover:text-destructive"
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
          <Card className="border-border shadow-sm overflow-hidden">
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
                  {filteredSeasonal.map((plan) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                Plan Review - {selectedPlan?.title}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
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
                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
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
