from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.risk.models import ActionRecommendation, RiskEvent
from apps.risk.serializers import ActionRecommendationSerializer, RiskEventSerializer


class RiskEventViewSet(OrganisationScopedModelViewSet):
    queryset = RiskEvent.objects.select_related(
        "organisation",
        "affected_asset",
        "affected_user",
    ).all()
    serializer_class = RiskEventSerializer


class ActionRecommendationViewSet(OrganisationScopedModelViewSet):
    queryset = ActionRecommendation.objects.select_related(
        "organisation",
        "risk_event",
        "owner",
    ).all()
    serializer_class = ActionRecommendationSerializer
