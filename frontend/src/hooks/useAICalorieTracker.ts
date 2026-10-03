"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { isAxiosError } from "axios";
import {
  AICalorieConfirmPayload,
  AICalorieConfirmResult,
  AICalorieJobResponse,
  MealType,
  cancelAICalorieJob,
  confirmAICalorieLog,
  discardAICalorieJob,
  getAICalorieActiveJob,
  getAICalorieJobStatus,
  getAICalorieOverlayUrl,
  submitAICaloriePhoto,
} from "@/lib/client/service";
import { getAiErrorMessage, shouldSuggestManualLogging } from "@/lib/client/aiErrors";

export type AIJobUIStatus =
  | "idle"
  | "compressing"
  | "uploading"
  | "queued"
  | "processing"
  | "review"
  | "failed"
  | "timed_out";

export interface UseAICalorieTrackerOptions {
  maxAgeMs?: number; // default 200,000 ms (200s - server expires at 180s, client backstop at 200s)
  defaultPollIntervalMs?: number; // default 1,500 ms
  onSuccess?: (result: AICalorieConfirmResult) => void;
  onError?: (errorMsg: string, code?: string) => void;
}

export interface UseAICalorieTrackerState {
  status: AIJobUIStatus;
  job: AICalorieJobResponse | null;
  logId: number | null;
  mealType: MealType;
  queuePosition: number;
  etaSeconds: number;
  pollAfterMs: number;
  elapsedSeconds: number;
  queueDelayWarning: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  suggestManual: boolean;
  isSubmitting: boolean;
  previewUrl: string | null;
  overlayUrl: string | null;
}

export function useAICalorieTracker(options: UseAICalorieTrackerOptions = {}) {
  const {
    maxAgeMs = 200000,
    defaultPollIntervalMs = 1500,
    onSuccess,
    onError,
  } = options;

  const [uiStatus, setUiStatus] = useState<AIJobUIStatus>("idle");
  const [job, setJob] = useState<AICalorieJobResponse | null>(null);
  const [logId, setLogId] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [etaSeconds, setEtaSeconds] = useState<number>(0);
  const [pollAfterMs, setPollAfterMs] = useState<number>(defaultPollIntervalMs);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [queueDelayWarning, setQueueDelayWarning] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestManual, setSuggestManual] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUiStatus("idle");
    setJob(null);
    setLogId(null);
    setQueuePosition(0);
    setEtaSeconds(0);
    setPollAfterMs(defaultPollIntervalMs);
    setElapsedSeconds(0);
    setQueueDelayWarning(false);
    setErrorCode(null);
    setErrorMessage(null);
    setSuggestManual(false);
    setPreviewUrl(null);
    setOverlayUrl(null);
    startTimeRef.current = null;
  }, [clearTimers, defaultPollIntervalMs, previewUrl]);

  const handleTerminalFailure = useCallback(
    (code?: string, rawMsg?: string) => {
      clearTimers();
      const mappedMsg = getAiErrorMessage(code, rawMsg);
      setUiStatus("failed");
      setErrorCode(code ?? "UNKNOWN_ERROR");
      setErrorMessage(mappedMsg);
      setSuggestManual(shouldSuggestManualLogging(code));
      onError?.(mappedMsg, code);
    },
    [clearTimers, onError],
  );

  const pollJobStatus = useCallback(
    async (targetLogId: number) => {
      if (!isMountedRef.current) return;

      // Check client deadline
      if (startTimeRef.current && Date.now() - startTimeRef.current > maxAgeMs) {
        clearTimers();
        setUiStatus("timed_out");
        const timeoutMsg = getAiErrorMessage("AI_INFERENCE_TIMEOUT");
        setErrorCode("AI_INFERENCE_TIMEOUT");
        setErrorMessage(timeoutMsg);
        setSuggestManual(true);
        onError?.(timeoutMsg, "AI_INFERENCE_TIMEOUT");
        return;
      }

      try {
        const statusRes = await getAICalorieJobStatus(targetLogId);
        if (!isMountedRef.current) return;

        setJob(statusRes);
        setLogId(statusRes.log_id);
        setMealType(statusRes.meal_type);

        if (statusRes.queue_position !== undefined) {
          setQueuePosition(statusRes.queue_position);
        }
        if (statusRes.eta_seconds !== undefined) {
          setEtaSeconds(statusRes.eta_seconds);
        }

        const nextInterval = Math.max(
          500,
          Math.min(5000, statusRes.poll_after_ms ?? defaultPollIntervalMs),
        );
        setPollAfterMs(nextInterval);

        if (statusRes.status === "queued") {
          setUiStatus("queued");
          pollTimerRef.current = setTimeout(() => {
            void pollJobStatus(targetLogId);
          }, nextInterval);
        } else if (statusRes.status === "processing") {
          setUiStatus("processing");
          pollTimerRef.current = setTimeout(() => {
            void pollJobStatus(targetLogId);
          }, nextInterval);
        } else if (statusRes.status === "pending_user_review") {
          clearTimers();
          setUiStatus("review");
          setOverlayUrl(
            statusRes.overlay_url
              ? statusRes.overlay_url
              : getAICalorieOverlayUrl(targetLogId),
          );
        } else if (statusRes.status === "failed") {
          handleTerminalFailure(statusRes.error_code, statusRes.error_message);
        } else if (statusRes.status === "cancelled") {
          clearTimers();
          setUiStatus("idle");
        } else if (statusRes.status === "discarded") {
          clearTimers();
          setUiStatus("idle");
        } else {
          // Unexpected terminal or intermediate state
          pollTimerRef.current = setTimeout(() => {
            void pollJobStatus(targetLogId);
          }, nextInterval);
        }
      } catch (pollErr: unknown) {
        if (!isMountedRef.current) return;
        // On transient network errors while polling, retry after interval unless aborted
        if (isAxiosError(pollErr) && pollErr.name === "CanceledError") {
          return;
        }
        console.warn("Polling status error, will retry:", pollErr);
        pollTimerRef.current = setTimeout(() => {
          void pollJobStatus(targetLogId);
        }, defaultPollIntervalMs);
      }
    },
    [clearTimers, defaultPollIntervalMs, handleTerminalFailure, maxAgeMs, onError],
  );

  const startPolling = useCallback(
    (targetLogId: number, initialEtaSeconds = 6, initialPollIntervalMs = defaultPollIntervalMs) => {
      clearTimers();
      setLogId(targetLogId);
      setEtaSeconds(initialEtaSeconds);
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      // Elapsed seconds counter
      setElapsedSeconds(0);
      setQueueDelayWarning(false);
      elapsedTimerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
          if (elapsed > 15) {
            setQueueDelayWarning(true);
          }
        }
      }, 1000);

      const delayMs = Math.max(500, Math.min(5000, initialPollIntervalMs));
      pollTimerRef.current = setTimeout(() => {
        void pollJobStatus(targetLogId);
      }, delayMs);
    },
    [clearTimers, defaultPollIntervalMs, pollJobStatus],
  );

  // Resume active job on mount
  useEffect(() => {
    isMountedRef.current = true;

    const resumeActiveJob = async () => {
      try {
        const active = await getAICalorieActiveJob();
        if (!isMountedRef.current || !active) return;

        if (active.status === "queued" || active.status === "processing") {
          setJob(active);
          setLogId(active.log_id);
          setMealType(active.meal_type);
          if (active.queue_position !== undefined) {
            setQueuePosition(active.queue_position);
          }
          if (active.eta_seconds !== undefined) {
            setEtaSeconds(active.eta_seconds);
          }
          if (active.poll_after_ms !== undefined) {
            setPollAfterMs(active.poll_after_ms);
          }
          setUiStatus(active.status as AIJobUIStatus);
          startPolling(active.log_id, active.eta_seconds ?? 6, active.poll_after_ms ?? defaultPollIntervalMs);
        } else if (active.status === "pending_user_review") {
          setJob(active);
          setLogId(active.log_id);
          setMealType(active.meal_type);
          setUiStatus("review");
          setOverlayUrl(
            active.overlay_url
              ? active.overlay_url
              : getAICalorieOverlayUrl(active.log_id),
          );
        }
      } catch (err) {
        console.warn("Could not check active AI job on mount:", err);
      }
    };

    void resumeActiveJob();

    return () => {
      isMountedRef.current = false;
      clearTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearTimers, defaultPollIntervalMs, startPolling]);

  const submitPhoto = useCallback(
    async (file: File, selectedMealType: MealType) => {
      // 1. Validation
      if (!file) {
        handleTerminalFailure("IMAGE_REQUIRED", "Please select a meal photo to analyze.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        handleTerminalFailure(
          "IMAGE_TOO_LARGE",
          "Image size exceeds 10 MB limit. Please select a smaller photo.",
        );
        return;
      }

      clearTimers();
      setErrorCode(null);
      setErrorMessage(null);
      setSuggestManual(false);
      setMealType(selectedMealType);

      // Create preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreview = URL.createObjectURL(file);
      setPreviewUrl(newPreview);

      // 2. Client-side compression
      setUiStatus("compressing");
      let uploadFile: File = file;
      try {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
      } catch (compErr) {
        console.warn("Client compression skipped/failed, using original file:", compErr);
      }

      if (!isMountedRef.current) return;

      // 3. HTTP Submit
      setUiStatus("uploading");
      abortControllerRef.current = new AbortController();

      try {
        const response = await submitAICaloriePhoto(
          {
            meal_type: selectedMealType,
            image: uploadFile,
          },
          abortControllerRef.current.signal,
        );

        if (!isMountedRef.current) return;

        setJob(response);
        setLogId(response.log_id);
        if (response.queue_position !== undefined) {
          setQueuePosition(response.queue_position);
        }
        if (response.eta_seconds !== undefined) {
          setEtaSeconds(response.eta_seconds);
        }
        if (response.poll_after_ms !== undefined) {
          setPollAfterMs(response.poll_after_ms);
        }

        if (response.status === "queued" || response.status === "processing") {
          setUiStatus(response.status as AIJobUIStatus);
          startPolling(response.log_id, response.eta_seconds ?? 6, response.poll_after_ms ?? defaultPollIntervalMs);
        } else if (response.status === "pending_user_review") {
          // Backward compatibility / rollback inline mode response
          setUiStatus("review");
          setOverlayUrl(
            response.overlay_url
              ? response.overlay_url
              : getAICalorieOverlayUrl(response.log_id),
          );
        } else if (response.status === "failed") {
          handleTerminalFailure(response.error_code, response.error_message);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;

        if (isAxiosError(err)) {
          // Handle 409 Conflict: In-flight job already exists -> recover by polling active_job_id
          if (err.response?.status === 409) {
            const errData = err.response.data as { active_job_id?: number; code?: string };
            if (errData?.active_job_id) {
              setUiStatus("queued");
              startPolling(errData.active_job_id, 6);
              return;
            }
          }

          const errCode = (err.response?.data as { code?: string })?.code;
          const errMsg = (err.response?.data as { message?: string })?.message;
          handleTerminalFailure(errCode, errMsg);
          return;
        }

        handleTerminalFailure(undefined, "Failed to submit photo for analysis.");
      }
    },
    [clearTimers, defaultPollIntervalMs, handleTerminalFailure, previewUrl, startPolling],
  );

  const cancelJob = useCallback(async () => {
    if (!logId) {
      reset();
      return;
    }
    try {
      await cancelAICalorieJob(logId);
    } catch (err) {
      console.warn("Cancel job request error:", err);
    } finally {
      reset();
    }
  }, [logId, reset]);

  const discardJob = useCallback(async () => {
    if (!logId) {
      reset();
      return;
    }
    try {
      await discardAICalorieJob(logId);
    } catch (err) {
      console.warn("Discard job request error:", err);
    } finally {
      reset();
    }
  }, [logId, reset]);

  const confirmJob = useCallback(
    async (
      finalIngredients: Array<{
        label?: string;
        name?: string;
        mass_grams: number;
      }>,
    ): Promise<AICalorieConfirmResult> => {
      if (!logId) {
        throw new Error("No active AI meal log to confirm.");
      }

      const payload: AICalorieConfirmPayload = {
        meal_type: mealType,
        user_final_log: finalIngredients,
      };

      const result = await confirmAICalorieLog(logId, payload);
      onSuccess?.(result);
      reset();
      return result;
    },
    [logId, mealType, onSuccess, reset],
  );

  return {
    uiStatus,
    job,
    logId,
    mealType,
    setMealType,
    queuePosition,
    etaSeconds,
    pollAfterMs,
    elapsedSeconds,
    queueDelayWarning,
    errorCode,
    errorMessage,
    suggestManual,
    previewUrl,
    overlayUrl,
    isSubmitting: uiStatus === "compressing" || uiStatus === "uploading",
    isPolling: uiStatus === "queued" || uiStatus === "processing",
    submitPhoto,
    cancelJob,
    discardJob,
    confirmJob,
    reset,
  };
}
