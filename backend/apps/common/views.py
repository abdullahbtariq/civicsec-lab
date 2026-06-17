from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.graph import build_graph
from apps.common.models import ProcessingJob
from apps.common.permissions import IsOrganisationScopedRole
from apps.common.serializers import ProcessingJobSerializer
from apps.common.viewsets import OrganisationScopedModelViewSet


class ProcessingJobViewSet(OrganisationScopedModelViewSet):
    queryset = ProcessingJob.objects.select_related("organisation").all()
    serializer_class = ProcessingJobSerializer


class GraphDataView(APIView):
    """Return graph nodes and edges for the Civic Risk Graph."""

    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request) -> Response:
        data = build_graph(request.user.organisation)
        return Response(data)
