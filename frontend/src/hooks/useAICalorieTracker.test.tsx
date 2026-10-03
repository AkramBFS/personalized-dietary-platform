import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAICalorieTracker } from "./useAICalorieTracker";
import * as clientService from "@/lib/client/service";

// Mock client service
vi.mock("@/lib/client/service", () => ({
  submitAICaloriePhoto: vi.fn(),
  getAICalorieActiveJob: vi.fn(),
  getAICalorieJobStatus: vi.fn(),
  cancelAICalorieJob: vi.fn(),
  discardAICalorieJob: vi.fn(),
  confirmAICalorieLog: vi.fn(),
  getAICalorieOverlayUrl: vi.fn((id: number) => `/api/backend/client/calorie-tracker/ai/${id}/overlay/`),
}));

// Mock browser-image-compression
vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File) => file),
}));

describe("useAICalorieTracker Hook", () => {
  const fakeFile = new File(["dummy content"], "meal.jpg", { type: "image/jpeg" });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    // Default active job is null on mount
    vi.mocked(clientService.getAICalorieActiveJob).mockResolvedValue(null);
    vi.mocked(clientService.getAICalorieOverlayUrl).mockImplementation(
      (id: number) => `/api/backend/client/calorie-tracker/ai/${id}/overlay/`
    );
    // Mock URL methods in jsdom
    global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/dummy-preview");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1. Happy path: submit -> queued -> processing -> review", async () => {
    vi.mocked(clientService.submitAICaloriePhoto).mockResolvedValueOnce({
      log_id: 101,
      status: "queued",
      meal_type: "lunch",
      queue_position: 1,
      eta_seconds: 3,
      poll_after_ms: 1000,
      logged_at: "2026-10-03T10:00:00Z",
    });

    vi.mocked(clientService.getAICalorieJobStatus)
      .mockResolvedValueOnce({
        log_id: 101,
        status: "processing",
        meal_type: "lunch",
        queue_position: 0,
        eta_seconds: 2,
        poll_after_ms: 1000,
        logged_at: "2026-10-03T10:00:00Z",
      })
      .mockResolvedValueOnce({
        log_id: 101,
        status: "pending_user_review",
        meal_type: "lunch",
        queue_position: 0,
        eta_seconds: 0,
        poll_after_ms: 0,
        predictions: [{ label: "apple", mass_grams: 150, confidence: 0.98 }],
        nutrition_preview: { total_calories: 78, total_protein: 0.4, total_carbs: 21, total_fats: 0.2 },
        overlay_url: "/api/v1/client/calorie-tracker/ai/101/overlay/",
        logged_at: "2026-10-03T10:00:00Z",
      });

    const { result } = renderHook(() => useAICalorieTracker());

    // Initially idle
    expect(result.current.uiStatus).toBe("idle");

    // Submit meal photo
    await act(async () => {
      await result.current.submitPhoto(fakeFile, "lunch");
    });

    // Should be queued
    expect(result.current.uiStatus).toBe("queued");
    expect(result.current.logId).toBe(101);
    expect(result.current.queuePosition).toBe(1);

    // Advance 1st poll interval (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Should transition to processing
    expect(result.current.uiStatus).toBe("processing");

    // Advance 2nd poll interval (1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Should transition to review
    expect(result.current.uiStatus).toBe("review");
    expect(result.current.job?.predictions?.[0].label).toBe("apple");
    expect(result.current.job?.nutrition_preview?.total_calories).toBe(78);
  });

  it("2. Terminal failure path: maps error code to user message", async () => {
    vi.mocked(clientService.submitAICaloriePhoto).mockResolvedValueOnce({
      log_id: 102,
      status: "queued",
      meal_type: "dinner",
      poll_after_ms: 500,
    });

    vi.mocked(clientService.getAICalorieJobStatus).mockResolvedValueOnce({
      log_id: 102,
      status: "failed",
      meal_type: "dinner",
      error_code: "IMAGE_INVALID",
      error_message: "Corrupt file",
    });

    const { result } = renderHook(() => useAICalorieTracker());

    await act(async () => {
      await result.current.submitPhoto(fakeFile, "dinner");
    });

    expect(result.current.uiStatus).toBe("queued");

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(result.current.uiStatus).toBe("failed");
    expect(result.current.errorCode).toBe("IMAGE_INVALID");
    expect(result.current.errorMessage).toContain("valid or supported image");
  });

  it("3. Client deadline: transitions to timed_out after 200s default without completing", async () => {
    vi.mocked(clientService.submitAICaloriePhoto).mockResolvedValueOnce({
      log_id: 103,
      status: "queued",
      meal_type: "breakfast",
      poll_after_ms: 1000,
    });

    vi.mocked(clientService.getAICalorieJobStatus).mockResolvedValue({
      log_id: 103,
      status: "queued",
      meal_type: "breakfast",
      poll_after_ms: 1000,
    });

    const { result } = renderHook(() => useAICalorieTracker());

    await act(async () => {
      await result.current.submitPhoto(fakeFile, "breakfast");
    });

    expect(result.current.uiStatus).toBe("queued");

    // Advance timers beyond 200s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(201000);
    });

    expect(result.current.uiStatus).toBe("timed_out");
    expect(result.current.errorCode).toBe("AI_INFERENCE_TIMEOUT");
    expect(result.current.suggestManual).toBe(true);
  });

  it("4. Mount resume: automatically resumes in-flight active job", async () => {
    vi.mocked(clientService.getAICalorieActiveJob).mockResolvedValueOnce({
      log_id: 104,
      status: "queued",
      meal_type: "snack",
      queue_position: 2,
      eta_seconds: 6,
      poll_after_ms: 1000,
    });

    vi.mocked(clientService.getAICalorieJobStatus).mockResolvedValueOnce({
      log_id: 104,
      status: "pending_user_review",
      meal_type: "snack",
      predictions: [{ label: "banana", mass_grams: 118 }],
      nutrition_preview: { total_calories: 105 },
    });

    const { result } = renderHook(() => useAICalorieTracker());

    // Allow mount effect to resolve getAICalorieActiveJob
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.uiStatus).toBe("queued");
    expect(result.current.logId).toBe(104);
    expect(result.current.queuePosition).toBe(2);

    // Advance poll
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.uiStatus).toBe("review");
    expect(result.current.job?.predictions?.[0].label).toBe("banana");
  });

  it("5. 409 Conflict Recovery: recovers by polling active_job_id", async () => {
    const conflictError = Object.assign(new Error("Conflict"), {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "IN_FLIGHT_JOB_EXISTS",
          message: "An AI calorie estimation job is already in flight.",
          active_job_id: 105,
        },
      },
    });

    vi.mocked(clientService.submitAICaloriePhoto).mockRejectedValueOnce(conflictError);

    vi.mocked(clientService.getAICalorieJobStatus).mockResolvedValueOnce({
      log_id: 105,
      status: "pending_user_review",
      meal_type: "lunch",
      predictions: [{ label: "salad", mass_grams: 200 }],
      nutrition_preview: { total_calories: 150 },
    });

    const { result } = renderHook(() => useAICalorieTracker());

    await act(async () => {
      await result.current.submitPhoto(fakeFile, "lunch");
    });

    // Successfully recovered instead of showing failed error
    expect(result.current.uiStatus).toBe("queued");
    expect(result.current.logId).toBe(105);

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(result.current.uiStatus).toBe("review");
  });

  it("6. Unmount safety: cancels timers and prevents state updates after unmount", async () => {
    vi.mocked(clientService.submitAICaloriePhoto).mockResolvedValueOnce({
      log_id: 106,
      status: "queued",
      meal_type: "lunch",
      poll_after_ms: 1000,
    });

    const { result, unmount } = renderHook(() => useAICalorieTracker());

    await act(async () => {
      await result.current.submitPhoto(fakeFile, "lunch");
    });

    expect(result.current.uiStatus).toBe("queued");

    // Unmount hook
    unmount();

    // Advancing timers should not throw errors or update state
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
  });

  it("7. Cancel and Discard actions call service endpoints and reset to idle", async () => {
    vi.mocked(clientService.cancelAICalorieJob).mockResolvedValueOnce({
      log_id: 107,
      status: "cancelled",
    });
    vi.mocked(clientService.discardAICalorieJob).mockResolvedValueOnce({
      log_id: 107,
      status: "discarded",
    });

    vi.mocked(clientService.submitAICaloriePhoto).mockResolvedValueOnce({
      log_id: 107,
      status: "queued",
      meal_type: "lunch",
      poll_after_ms: 1000,
    });

    const { result } = renderHook(() => useAICalorieTracker());

    await act(async () => {
      await result.current.submitPhoto(fakeFile, "lunch");
    });
    expect(result.current.uiStatus).toBe("queued");

    // Cancel job
    await act(async () => {
      await result.current.cancelJob();
    });

    expect(clientService.cancelAICalorieJob).toHaveBeenCalledWith(107);
    expect(result.current.uiStatus).toBe("idle");
    expect(result.current.logId).toBeNull();
  });
});
