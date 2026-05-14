from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.incidents.models import Incident, IncidentTimelineEntry
from apps.incidents.serializers import IncidentSerializer, IncidentTimelineEntrySerializer


class IncidentViewSet(OrganisationScopedModelViewSet):
    queryset = Incident.objects.select_related("organisation", "owner").prefetch_related(
        "linked_risk_events"
    )
    serializer_class = IncidentSerializer


class IncidentTimelineEntryViewSet(OrganisationScopedModelViewSet):
    queryset = IncidentTimelineEntry.objects.select_related(
        "organisation",
        "incident",
        "actor",
    ).all()
    serializer_class = IncidentTimelineEntrySerializer
