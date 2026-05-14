from apps.common.models import ProcessingJob
from apps.common.serializers import ProcessingJobSerializer
from apps.common.viewsets import OrganisationScopedModelViewSet


class ProcessingJobViewSet(OrganisationScopedModelViewSet):
    queryset = ProcessingJob.objects.select_related("organisation").all()
    serializer_class = ProcessingJobSerializer
