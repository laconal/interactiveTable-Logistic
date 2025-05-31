from django.db import models
from django.contrib.auth.models import AbstractUser
from simple_history.models import HistoricalRecords
# Create your models here.

class User(AbstractUser):
    department = models.CharField(max_length=100, blank = True,
                                  choices=(
                                      ("Route Complete Cargo", "RCC"),
                                      ("Air-Sea Cargo", "ASR"),
                                      ("Admin", "Admin")
                                  ))
    role = models.CharField(max_length=100, blank = True, null = True,
                            choices=(
                                ("Head", "Head"),
                                ("Subordinate", "Subordinate"),
                                ("Viewer", "Viewer"),
                                ("Admin", "Admin")
                            ))
    createdObjects = models.IntegerField(default = 0, verbose_name = "Количество созданных сделок")