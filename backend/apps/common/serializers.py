from rest_framework import serializers

from apps.common.models import ProcessingJob
from apps.organisations.models import Organisation
from apps.organisations.serializers import OrganisationSummarySerializer


class OrganisationScopedSerializer(serializers.ModelSerializer):
    organisation = OrganisationSummarySerializer(read_only=True)
    organisation_id = serializers.PrimaryKeyRelatedField(
        source="organisation",
        queryset=Organisation.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        organisation = attrs.get("organisation")

        if user and user.is_authenticated and not user.is_superuser:
            if organisation and organisation.id != user.organisation_id:
                raise serializers.ValidationError(
                    {"organisation_id": "Object must belong to your organisation."}
                )

        return attrs


class ProcessingJobSerializer(OrganisationScopedSerializer):
    class Meta:
        model = ProcessingJob
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "job_type",
            "status",
            "started_at",
            "finished_at",
            "error_message",
            "progress",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
