# Generated by Django 5.1.6 on 2025-04-16 09:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_historicaluser_department_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicaluser',
            name='createdObjects',
            field=models.IntegerField(default=0, verbose_name='Количество созданных сделок'),
        ),
        migrations.AddField(
            model_name='user',
            name='createdObjects',
            field=models.IntegerField(default=0, verbose_name='Количество созданных сделок'),
        ),
    ]
