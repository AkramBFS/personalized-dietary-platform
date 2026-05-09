"use client";

import React, { useState } from "react";
import { Star, X, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { toast } from "sonner";
import { postMealPlanReview, postConsultationReview } from "@/lib/client";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "meal-plan" | "consultation";
  id: number;
  title: string;
}

export default function ReviewModal({ isOpen, onClose, type, id, title }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "meal-plan") {
        await postMealPlanReview(id, { rating, comment });
      } else {
        await postConsultationReview(id, { rating, comment });
      }
      toast.success("Thank you for your feedback!");
      onClose();
    } catch (error) {
      console.error("Review submission failed", error);
      toast.error("Failed to submit review. You may have already reviewed this.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <Card className="max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border-border/50">
        <CardHeader className="relative border-b bg-muted/30 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Submit Review</CardTitle>
              <CardDescription className="line-clamp-1">{title}</CardDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4 text-center">
              <Label className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground block">
                How was your experience?
              </Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        (hoveredRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Very Poor"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Additional Comments
              </Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on this service..."
                className="w-full min-h-[120px] rounded-xl border border-border bg-background p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 py-6 rounded-xl"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-[2] py-6 rounded-xl font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Post Review"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>{children}</label>;
}
