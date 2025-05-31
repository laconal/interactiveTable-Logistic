from django.db import models
from simple_history.models import HistoricalRecords
from django.contrib.auth import get_user_model
# Create your models here.

User = get_user_model()

class Order(models.Model):
    client = models.CharField(max_length = 100, verbose_name="Заказчик")
    foreignOrder = models.BooleanField(default = False)
    clientManager = models.CharField(max_length = 50, verbose_name="Клиент менеджер", blank=True)
    client_sLegalEntity = models.CharField(max_length = 25, verbose_name="ЮЛ Клиента", null = True, blank=True)
    routeStart = models.CharField(max_length = 200, verbose_name="Пункт отправки", null = True, blank=True)
    routeEnd = models.CharField(max_length= 200, verbose_name = "Пункт назначения", null = True, blank=True)
    transshipmentPoint = models.CharField(max_length = 300, verbose_name = "Пункт перегруза", null = True, blank = True)
    cargo = models.CharField(max_length = 100, verbose_name = "Груз", null = True, blank=True)
    tnved = models.CharField(max_length = 100, null = True, verbose_name = "ТНВЭД", blank=True)
    loadDate = models.DateField(verbose_name = "Дата загрузки")
    cooperativeOrder = models.CharField(max_length = 50, verbose_name = "Совместная сделка", null = True, blank=True)
    sumOnClient = models.CharField(verbose_name = "Сумма на Клиента", null = True, max_length = 100, blank=True)
    brutto = models.CharField(max_length = 1000, verbose_name = "Брутто $", null = True, blank=True)
    netto = models.CharField(max_length = 1000, verbose_name = "Нетто $", null = True, blank=True)
    kn = models.IntegerField(default = None, null = True, verbose_name = "КН", blank=True)
    profit = models.CharField(null = True, max_length = 100, verbose_name = "Профит", blank=True)
    deliverDateByCMR = models.DateField(verbose_name = "Дата погр/выгр по CMR", null = True, blank=True)
    vehicle = models.CharField(max_length = 100, verbose_name = "Номер ТС", null = True, blank=True)
    orderID = models.CharField(max_length = 100, verbose_name = "Номер сделки", null = True, blank=True)
    applicationID = models.CharField(max_length = 100, verbose_name = "Заявка", null = True, blank=True)
    actsAndInvoices = models.CharField(max_length = 100, verbose_name = "АКТЫ и СЧЕТА", null = True, blank=True)
    expeditor = models.CharField(max_length = 100, verbose_name = "Экспедитор", null = True, blank=True)
    contractorInvoice = models.CharField(max_length = 100, verbose_name = "Счет подрядчика", null = True, blank=True)
    contractor = models.CharField(max_length = 1000, verbose_name = "Подрядчика", null = True, blank=True)
    contractorLegalEntity = models.CharField(max_length = 100, verbose_name = "ЮЛ Подрядчика", null = True, blank=True)
    additionalExpenses = models.TextField(verbose_name = "Доп. расходы", null = True, blank=True)
    notes = models.TextField(max_length = 1000, null = True, verbose_name="Заметки", blank=True)
    orderStatus = models.CharField(max_length = 100, choices = [
        ("empty", "Empty"),
        ("created", "Created"),
        ("confirmed", "Confirmed"),
        ("finished", "Finished")
    ], verbose_name = "Статус сделки", null = True, default = "empty")
    client_sInsuranceID = models.CharField(blank = True, null = True, max_length = 100, verbose_name = "Номер инвойса страховки клиента")
    applicationAttached = models.BooleanField(default = False, verbose_name="Заявка прикреплена", blank=True)
    contractorInvoiceSent = models.BooleanField(default = False, verbose_name="Счет подрядчика отправлен", blank=True)
    cancelled = models.BooleanField(default = False, verbose_name="Сделка отменена", blank=True)
    needToChangeVehicle = models.BooleanField(default = False)
    needToChangeBrutto = models.BooleanField(default = False)
    needToChangeNetto = models.BooleanField(default = False)
    cargoType = models.CharField(max_length = 100, choices = [
        ("Комплектный", "Комплектный"),
        ("Сборный", "Сборный")
    ], verbose_name = "Тип груза", null = True, default = "Комплектный")
    createdByUser = models.ForeignKey(User, blank = True, null = True, on_delete=models.PROTECT, 
                                      editable=False, verbose_name = "Создан", related_name = "createdOrders")
    addedToDB_time = models.DateTimeField(auto_now_add=True, verbose_name="Время добавления записи")
    toDelete = models.BooleanField(default = False, verbose_name = "Требуется удалить")
    toDeleteRequest = models.ForeignKey(User, blank = True, null = True, on_delete=models.PROTECT, 
                                      editable=False, verbose_name = "Запрос на удаление")

    changes = HistoricalRecords()

    def __str__(self):
        if self.orderID == None:
            if self.cancelled:
                return f"{str(self.id)} (Отменена)"
            return str(self.id)
        if self.cancelled:
            return f"{str(self.orderID)} (Отменена) {self.id}"
        return f"{self.orderID} ({self.id})"
    
class ContractInvoiceID(models.Model):
    contractorName = models.CharField(max_length = 250, verbose_name = "Receiver")
    contractor = models.CharField(max_length = 250, unique = True, verbose_name = "Payer")
    contractorLE = models.CharField(max_length = 250, verbose_name = "Юридическое лицо")
    invoiceID = models.IntegerField(default = 0, verbose_name = "ID счета")
    
    def __str__(self):
        return f"{self.contractor} -> {self.contractorName} ({self.invoiceID})"
    


    