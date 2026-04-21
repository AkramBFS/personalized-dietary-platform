from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {"status": "error"}
        data = response.data

        if isinstance(data, dict):
            if 'message' in data:
                error_data['message'] = data['message']
            elif 'detail' in data:
                error_data['message'] = str(data['detail'])
            else:
                error_data['message'] = 'Validation failed'
                error_data['errors']  = data

            if 'code' in data:
                error_data['code'] = data['code']

        elif isinstance(data, list):
            error_data['message'] = str(data[0]) if data else 'An error occurred'
        else:
            error_data['message'] = str(data)

        if response.status_code == 401:
            error_data.setdefault('message', 'Authentication credentials were not provided.')
            error_data.setdefault('code',    'UNAUTHORIZED')
        elif response.status_code == 403:
            error_data.setdefault('message', 'You do not have permission to perform this action.')
            error_data.setdefault('code',    'PERMISSION_DENIED')
        elif response.status_code == 404:
            error_data.setdefault('message', 'Not found.')
            error_data.setdefault('code',    'NOT_FOUND')
        elif response.status_code == 405:
            error_data.setdefault('message', 'Method not allowed.')
            error_data.setdefault('code',    'METHOD_NOT_ALLOWED')
        elif response.status_code == 429:
            error_data.setdefault('message', 'Too many requests. Please slow down.')
            error_data.setdefault('code',    'RATE_LIMITED')

        response.data = error_data

    return response