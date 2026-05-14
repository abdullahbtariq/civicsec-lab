from apps.assets.models import Asset
from apps.assets.serializers import AssetSerializer
from apps.common.viewsets import OrganisationScopedModelViewSet


class AssetViewSet(OrganisationScopedModelViewSet):
    queryset = Asset.objects.select_related("organisation", "created_by").all()
    serializer_class = AssetSerializer
