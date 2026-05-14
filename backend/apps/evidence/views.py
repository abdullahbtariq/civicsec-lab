from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.evidence.models import EvidenceItem
from apps.evidence.serializers import EvidenceItemSerializer


class EvidenceItemViewSet(OrganisationScopedModelViewSet):
    queryset = EvidenceItem.objects.select_related("organisation", "risk_event").all()
    serializer_class = EvidenceItemSerializer
