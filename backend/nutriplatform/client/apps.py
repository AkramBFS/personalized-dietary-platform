from django.apps import AppConfig
from django.core.checks import Error, Warning, register, Tags


def worst_case_attempt_seconds(settings) -> int:
    """
    Worst-case wall time of ONE processing attempt, derived from settings:
    connect + read (the AI service does nutrition inside this single call)
    + overlay decode/save + storage read/DB finalize.
    """
    return (
        getattr(settings, 'AI_SERVICE_CONNECT_TIMEOUT', 10)
        + getattr(settings, 'AI_SERVICE_HTTP_TIMEOUT', 60)
        + getattr(settings, 'AI_JOB_OVERLAY_ALLOWANCE_SECONDS', 5)
        + getattr(settings, 'AI_JOB_FINALIZE_ALLOWANCE_SECONDS', 5)
    )


@register(Tags.compatibility)
def check_ai_pipeline_settings(app_configs, **kwargs):
    import os
    from django.conf import settings
    errors = []

    lease_timeout = getattr(settings, 'AI_JOB_LEASE_TIMEOUT_SECONDS', 120)
    connect_timeout = getattr(settings, 'AI_SERVICE_CONNECT_TIMEOUT', 10)
    http_timeout = getattr(settings, 'AI_SERVICE_HTTP_TIMEOUT', 60)
    overlay_allowance = getattr(settings, 'AI_JOB_OVERLAY_ALLOWANCE_SECONDS', 5)
    finalize_allowance = getattr(settings, 'AI_JOB_FINALIZE_ALLOWANCE_SECONDS', 5)
    worst_case_attempt = worst_case_attempt_seconds(settings)

    # 1. Lease timeout must provably exceed worst-case single attempt
    if lease_timeout < worst_case_attempt:
        errors.append(
            Error(
                f"AI_JOB_LEASE_TIMEOUT_SECONDS ({lease_timeout}s) must be at least {worst_case_attempt}s "
                f"(connect={connect_timeout}s + read={http_timeout}s + overlay={overlay_allowance}s "
                f"+ finalize={finalize_allowance}s) to prevent premature lease expiration while inference is in flight.",
                id="client.E001",
            )
        )

    # 2. Total attempts must be at least 1
    max_attempts = getattr(settings, 'AI_JOB_MAX_ATTEMPTS', 3)
    if max_attempts < 1:
        errors.append(
            Error(
                f"AI_JOB_MAX_ATTEMPTS ({max_attempts}) must be at least 1.",
                id="client.E002",
            )
        )

    # 3. Deadline must strictly exceed single lease timeout
    max_age = getattr(settings, 'AI_JOB_MAX_AGE_SECONDS', 180)
    if max_age <= lease_timeout:
        errors.append(
            Error(
                f"AI_JOB_MAX_AGE_SECONDS ({max_age}s) must be strictly greater than "
                f"AI_JOB_LEASE_TIMEOUT_SECONDS ({lease_timeout}s).",
                id="client.E003",
            )
        )

    # 4. Backoff schedule length check
    backoff_schedule = getattr(settings, 'AI_JOB_BACKOFF_SCHEDULE', [5, 20, 60])
    if len(backoff_schedule) < (max_attempts - 1):
        errors.append(
            Error(
                f"AI_JOB_BACKOFF_SCHEDULE ({backoff_schedule}) must have at least {max_attempts - 1} entries.",
                id="client.E004",
            )
        )

    # 5. A full queue must be able to drain (serialized worker) before the deadline, otherwise the
    #    last admitted job is guaranteed to time out.
    queue_cap = getattr(settings, 'AI_GLOBAL_QUEUE_CAP', 30)
    eta_per_job = getattr(settings, 'AI_ETA_SECONDS_PER_JOB', 3)
    if queue_cap * eta_per_job > max_age:
        errors.append(
            Error(
                f"AI_GLOBAL_QUEUE_CAP ({queue_cap}) x AI_ETA_SECONDS_PER_JOB ({eta_per_job}s) = "
                f"{queue_cap * eta_per_job}s exceeds AI_JOB_MAX_AGE_SECONDS ({max_age}s): "
                f"the last admitted job could never be served before its deadline.",
                id="client.E005",
            )
        )

    # 6. Inline rollback mode runs the AI call inside the web request: the WSGI server timeout must cover it.
    if not getattr(settings, 'AI_ASYNC_PIPELINE', True):
        raw_gunicorn_timeout = os.environ.get('GUNICORN_TIMEOUT')
        try:
            gunicorn_timeout = int(raw_gunicorn_timeout) if raw_gunicorn_timeout else None
        except ValueError:
            gunicorn_timeout = None
        if gunicorn_timeout is None or gunicorn_timeout <= worst_case_attempt:
            errors.append(
                Warning(
                    f"AI_ASYNC_PIPELINE is disabled (inline mode): the AI call runs inside the web request and can take "
                    f"up to {worst_case_attempt}s. GUNICORN_TIMEOUT ({gunicorn_timeout if gunicorn_timeout else 'unset'}) "
                    f"must be greater than {worst_case_attempt}s or workers will be killed mid-request.",
                    id="client.W002",
                )
            )

    return errors


class ClientConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'client'
