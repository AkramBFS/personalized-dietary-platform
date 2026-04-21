from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size             = 10
    page_size_query_param = 'page_size'
    max_page_size         = 50

    def get_paginated_response(self, data):
        return Response({
            "status": "success",
            "data": {
                "count":    self.page.paginator.count,
                "next":     self.get_next_link(),
                "previous": self.get_previous_link(),
                "results":  data,
            }
        })