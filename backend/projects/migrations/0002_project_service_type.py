from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="service_type",
            field=models.CharField(
                choices=[
                    ("website_development", "Website Development"),
                    ("social_media", "Social Media"),
                    ("branding", "Branding"),
                    ("seo", "SEO"),
                    ("advertising", "Advertising"),
                    ("software_development", "Software Development"),
                    ("mobile_app", "Mobile App"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=32,
            ),
        ),
    ]
