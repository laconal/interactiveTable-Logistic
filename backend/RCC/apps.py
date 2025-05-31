from django.apps import AppConfig


class RccConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'RCC'

    def ready(self):
        import RCC.signals