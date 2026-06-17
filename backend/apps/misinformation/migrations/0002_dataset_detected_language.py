from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("misinformation", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="discoursedataset",
            name="detected_language",
            field=models.CharField(
                blank=True,
                default="",
                max_length=10,
                help_text="ISO 639-1 code of the dominant language detected in this dataset.",
            ),
        ),
    ]
