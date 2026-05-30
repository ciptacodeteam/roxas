from django.db import migrations, models


def migrate_mailgun_to_resend(apps, schema_editor):
    ApiLog = apps.get_model('main', 'ApiLog')
    ApiLog.objects.filter(provider='MAILGUN').update(provider='RESEND')


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0002_alter_product_customer_no_template'),
    ]

    operations = [
        migrations.RunPython(migrate_mailgun_to_resend, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='apilog',
            name='provider',
            field=models.CharField(
                choices=[
                    ('DIGIFLAZZ', 'Digiflazz'),
                    ('MIDTRANS', 'Midtrans'),
                    ('RESEND', 'Resend'),
                ],
                max_length=15,
                verbose_name='Provider',
            ),
        ),
    ]
