import logging
import os
import signal
import socket
import sys
import time
import uuid

from django.conf import settings
from django.core.management.base import BaseCommand

from client import job_queue, ai_processor

logger = logging.getLogger('nutriplatform.worker')


class Command(BaseCommand):
    help = "Runs the background AI Calorie Estimation worker process."

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.should_stop = False
        self.worker_id = ""
        self.jobs_processed = 0

    def add_arguments(self, parser):
        parser.add_argument(
            '--worker-id',
            type=str,
            default=None,
            help="Unique identifier for this worker instance (default: worker-{hostname}-{pid}-{uuid})"
        )
        parser.add_argument(
            '--poll-interval',
            type=float,
            default=1.0,
            help="Polling interval in seconds when the queue is idle (default: 1.0s)"
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help="Claim and process at most one job, then exit immediately (useful for testing/cron)"
        )
        parser.add_argument(
            '--max-jobs',
            type=int,
            default=None,
            help="Exit after processing this number of jobs"
        )

    def _setup_signal_handlers(self):
        def _signal_handler(signum, frame):
            sig_name = signal.Signals(signum).name if hasattr(signal, 'Signals') else str(signum)
            self.stdout.write(
                self.style.WARNING(f"\n[{self.worker_id}] Received {sig_name}. Requesting graceful shutdown...")
            )
            self.should_stop = True

        # Register cross-platform signals
        signal.signal(signal.SIGINT, _signal_handler)
        if hasattr(signal, 'SIGTERM'):
            try:
                signal.signal(signal.SIGTERM, _signal_handler)
            except (ValueError, OSError):
                pass
        if hasattr(signal, 'SIGBREAK'):
            try:
                signal.signal(signal.SIGBREAK, _signal_handler)
            except (ValueError, OSError):
                pass

    def _sleep_interruptible(self, duration: float):
        """Sleeps in 100ms slices to allow prompt responsiveness to shutdown signals."""
        end_time = time.time() + duration
        while time.time() < end_time and not self.should_stop:
            time.sleep(min(0.1, end_time - time.time()))

    def handle(self, *args, **options):
        raw_worker_id = options.get('worker_id')
        poll_interval = options.get('poll_interval', 1.0)
        run_once = options.get('once', False)
        max_jobs = options.get('max_jobs')

        hostname = socket.gethostname()
        pid = os.getpid()
        short_id = uuid.uuid4().hex[:6]
        self.worker_id = raw_worker_id or f"worker-{hostname}-{pid}-{short_id}"

        self._setup_signal_handlers()

        self.stdout.write(
            self.style.SUCCESS(
                f"[{self.worker_id}] AI Calorie Worker started. "
                f"Poll interval: {poll_interval}s, Run once: {run_once}, Max jobs: {max_jobs or 'unlimited'}"
            )
        )

        try:
            while not self.should_stop:
                job = job_queue.claim_next_job(worker_id=self.worker_id)

                if job is not None:
                    self.stdout.write(
                        f"[{self.worker_id}] Processing job #{job.id} (client #{job.client_id}, attempt {job.retry_count})..."
                    )
                    success = ai_processor.process_calorie_job(job)
                    self.jobs_processed += 1

                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(f"[{self.worker_id}] Job #{job.id} processed successfully.")
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(f"[{self.worker_id}] Job #{job.id} execution failed / retried.")
                        )

                    if max_jobs and self.jobs_processed >= max_jobs:
                        self.stdout.write(
                            self.style.SUCCESS(f"[{self.worker_id}] Reached max jobs limit ({max_jobs}). Exiting.")
                        )
                        break

                    if run_once:
                        break
                else:
                    if run_once:
                        self.stdout.write(f"[{self.worker_id}] No jobs queued. Exiting (--once).")
                        break
                    self._sleep_interruptible(poll_interval)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[{self.worker_id}] Fatal worker exception: {e}"))
            logger.exception(f"Fatal worker exception in {self.worker_id}: {e}")
            raise
        finally:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[{self.worker_id}] Worker stopped gracefully. Total jobs processed: {self.jobs_processed}"
                )
            )
