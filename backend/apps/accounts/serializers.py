from rest_framework import serializers

from apps.accounts.models import User
from apps.organisations.serializers import OrganisationSummarySerializer


class CurrentUserSerializer(serializers.ModelSerializer):
    organisation = OrganisationSummarySerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "organisation"]
