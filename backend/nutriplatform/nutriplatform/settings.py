from pathlib import Path
import sys
from decouple import config
from datetime import timedelta

# ─── Base ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ['*']   # tighten this before production

# ─── Applications ────────────────────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',  
    'django_extensions',
    'drf_spectacular',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'axes',
]

LOCAL_APPS = [
    'users',
    'client',
    'nutritionist',
    'admin_panel',
    'marketplace',
    'community',
    'notifications',
    'chatbot',
]

FILTER  = [
    'django_filters',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + FILTER

AUTH_USER_MODEL = 'users.User'

# ─── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
     'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'nutriplatform.middleware.rls.RLSMiddleware',
    'axes.middleware.AxesMiddleware',
]

# ─── Authentication Backends ──────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# ─── Django Axes (Brute Force Protection) ──────────────────────────────────────
AXES_ENABLED            = not ('test' in sys.argv)
AXES_FAILURE_LIMIT      = 5
AXES_COOLOFF_TIME       = 0.5  # 30 minutes
AXES_LOCKOUT_CALLABLE   = 'users.throttles.axes_lockout_response'
AXES_RESET_ON_SUCCESS   = True
AXES_CLIENT_IP_CALLABLE = 'users.throttles.get_client_ip'

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',      # Nextjs dev server
    'http://localhost:8001',     # AI service
]
CORS_ALLOW_CREDENTIALS = True

# ── Security Headers & Proxy Topology ───────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER   = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS             = 'DENY'
SECURE_PROXY_SSL_HEADER     = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST        = True
SESSION_COOKIE_SECURE       = config('SESSION_COOKIE_SECURE', default=not DEBUG, cast=bool)
CSRF_COOKIE_SECURE          = config('CSRF_COOKIE_SECURE', default=not DEBUG, cast=bool)
SECURE_SSL_REDIRECT         = config('SECURE_SSL_REDIRECT', default=False, cast=bool)


ROOT_URLCONF = 'nutriplatform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nutriplatform.wsgi.application'

# ─── Database (PostgreSQL) ───────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME':     config('DB_NAME'),
        'USER':     config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST', default='localhost'),
        'PORT':     config('DB_PORT', default='5432'),
    }
}

# ─── Password Hashers & Validation ───────────────────────────────────────────
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

import sys
if 'test' in sys.argv or any('pytest' in arg for arg in sys.argv):
    # Accelerate automated unit tests by using fast hasher while preserving Argon2 in hasher list
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
        'django.contrib.auth.hashers.Argon2PasswordHasher',
    ]


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Internationalisation ─────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

# ─── Static & Media Files ────────────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Django REST Framework ───────────────────────────────────────────────────
REST_FRAMEWORK = {

    'DEFAULT_AUTHENTICATION_CLASSES': (
        'nutriplatform.middleware.rls.RLSJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Custom exception handler
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',

    #  Global pagination
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,

    
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '120/minute',
        'login_composite': '5/minute',
        'login_ip': '20/hour',
    },
}

# ─── SimpleJWT ───────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}


CALORIE_NINJAS_KEY = config('CALORIE_NINJAS_KEY')


USE_TZ = True   
AI_SERVICE_URL = config('AI_SERVICE_URL', default='http://127.0.0.1:8001')
AI_SERVICE_SECRET_KEY = config('AI_SERVICE_SECRET_KEY')
ENCRYPTION_PRIMARY_KEY = config('ENCRYPTION_PRIMARY_KEY', default='')
ENCRYPTION_FALLBACK_KEYS = config('ENCRYPTION_FALLBACK_KEYS', default='')
ALLOWED_TURNSTILE_HOSTNAMES = [
    h.strip() for h in config('ALLOWED_TURNSTILE_HOSTNAMES', default='localhost,127.0.0.1,nutriplatform.com').split(',') if h.strip()
]
TURNSTILE_SITE_KEY = config('TURNSTILE_SITE_KEY', default='1x00000000000000000000AA')
TURNSTILE_SECRET_KEY = config('TURNSTILE_SECRET_KEY', default='1x0000000000000000000000000000000AA')

STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')

SPECTACULAR_SETTINGS = {
    'TITLE':       'NutriPlatform API',
    'DESCRIPTION': 'REST API for NutriPlatform — Django REST Framework + PostgreSQL',
    'VERSION':     '1.1.0',
    'SERVE_INCLUDE_SCHEMA': False,
}




GROQ_API_KEY = config('GROQ_API_KEY')

# ─── Redis Cache & Rate Limiting Architecture ────────────────────────────────
REDIS_BASE_URL = config('REDIS_URL', default='redis://127.0.0.1:6379')
if REDIS_BASE_URL.endswith(('/1', '/2')):
    REDIS_BASE_URL = REDIS_BASE_URL.rsplit('/', 1)[0]

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.DefaultParser',
            'IGNORE_EXCEPTIONS': True,  # Fail-open: general app cache drops gracefully without crashing HTTP responses
        }
    },
    'ratelimit': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/2',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.DefaultParser',
            'IGNORE_EXCEPTIONS': False, # Fail-closed: security enforcement must NEVER silently bypass during Redis downtime
        }
    }
}
RATELIMIT_USE_CACHE = 'ratelimit'

import sys
TESTING = 'test' in sys.argv
RATELIMIT_ENABLE = not TESTING

# ─── AI Pipeline & Background Queue Configuration ────────────────────────────
AI_IMAGE_MAX_PIXELS = config('AI_IMAGE_MAX_PIXELS', default=40000000, cast=int)  # 40 Megapixels
AI_IMAGE_MAX_BYTES = config('AI_IMAGE_MAX_BYTES', default=10 * 1024 * 1024, cast=int)  # 10 MB
AI_IMAGE_NORMALIZED_MAX_SIDE = config('AI_IMAGE_NORMALIZED_MAX_SIDE', default=2048, cast=int)  # 2048 px
AI_IMAGE_NORMALIZED_QUALITY = config('AI_IMAGE_NORMALIZED_QUALITY', default=85, cast=int)
AI_IMAGE_ALLOWED_FORMATS = [
    fmt.strip().upper() for fmt in config('AI_IMAGE_ALLOWED_FORMATS', default='JPEG,PNG,WEBP').split(',') if fmt.strip()
]

# Settings-based abuse & queue limits
AI_ASYNC_PIPELINE = config('AI_ASYNC_PIPELINE', default=True, cast=bool)  # Async background queue vs inline sync fallback
# One outbound call per attempt: connect + read. The AI service performs the nutrition lookup itself
# (10s httpx timeout inside the service), so nutrition time is covered by the read timeout, not added on top.
AI_SERVICE_CONNECT_TIMEOUT = config('AI_SERVICE_CONNECT_TIMEOUT', default=10, cast=int)
AI_SERVICE_HTTP_TIMEOUT = config('AI_SERVICE_HTTP_TIMEOUT', default=60, cast=int)  # read timeout (seconds)
# Work the worker does after the AI call returns, within the same lease:
AI_JOB_OVERLAY_ALLOWANCE_SECONDS = config('AI_JOB_OVERLAY_ALLOWANCE_SECONDS', default=5, cast=int)  # decode + save overlay
AI_JOB_FINALIZE_ALLOWANCE_SECONDS = config('AI_JOB_FINALIZE_ALLOWANCE_SECONDS', default=5, cast=int)  # storage read + DB finalize
# Lease must exceed connect + read + overlay + finalize (default 10+60+5+5 = 80s); enforced by system check client.E001.
AI_JOB_LEASE_TIMEOUT_SECONDS = config('AI_JOB_LEASE_TIMEOUT_SECONDS', default=120, cast=int)
AI_JOB_MAX_ATTEMPTS = config('AI_JOB_MAX_ATTEMPTS', default=3, cast=int)  # 3 total attempts
AI_JOB_MAX_AGE_SECONDS = config('AI_JOB_MAX_AGE_SECONDS', default=180, cast=int)  # 180s absolute SLA job deadline
AI_JOB_BACKOFF_SCHEDULE = [5, 20, 60]  # Backoff in seconds between retry attempts (5s, 20s, 60s)
# Typical seconds of worker time per queued job; used for the ETA shown to users and for the queue-drain check.
AI_ETA_SECONDS_PER_JOB = config('AI_ETA_SECONDS_PER_JOB', default=10, cast=int)

AI_QUEUE_NAME = config('AI_QUEUE_NAME', default='nutriplatform:queue:calorie_estimates')
AI_MAX_DAILY_PER_USER = config('AI_MAX_DAILY_PER_USER', default=30, cast=int)
AI_MAX_IN_FLIGHT_PER_USER = config('AI_MAX_IN_FLIGHT_PER_USER', default=1, cast=int)
AI_BURST_PER_MINUTE_PER_USER = config('AI_BURST_PER_MINUTE_PER_USER', default=6, cast=int)
AI_GLOBAL_QUEUE_CAP = config('AI_GLOBAL_QUEUE_CAP', default=15, cast=int)