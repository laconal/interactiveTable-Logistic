from django.contrib import admin, messages
from .models import Order, ContractInvoiceID
from simple_history.admin import SimpleHistoryAdmin

@admin.action(description = "Отменить сделку")
def cancelOrder(modeladmin, request, queryset):
    for obj in queryset:
        obj.cancelled = True
        obj.save()
        messages.success(request, f"Сделка {obj.orderID} отменена")

@admin.action(description = "Восстановить сделку")
def restoreOrder(modeladmin, request, queryset):
    for obj in queryset:
        obj.cancelled = False
        obj.save()
        messages.success(request, f"Сделка {obj.orderID} восстановлена")

@admin.action(description = "Скопировать сделку")
def copyOrder(modeladmin, request, queryset):
    for obj in queryset:
        newOrder = Order()
        newOrder.client = obj.client
        newOrder.clientManager = obj.clientManager
        newOrder.loadDate = obj.loadDate
        newOrder.brutto = obj.brutto
        newOrder.netto = obj.netto
        newOrder.expeditor = obj.expeditor
        newOrder.createdByUser = request.user
        newOrder.save()
        messages.success(request, f"Сделка {obj.id} скопирована, новая сделка: {newOrder.id}")


class orderAdmin(SimpleHistoryAdmin):
    readonly_fields = ["createdByUser", "toDeleteRequest"]

    list_filter = [
        "clientManager",
        "client",
        "contractor"
    ]
    search_fields = ["id", "orderID", "client"]
    ordering = ["id"]
    actions = [cancelOrder, restoreOrder, copyOrder]

        
admin.site.register(Order, orderAdmin)
admin.site.register(ContractInvoiceID)
# Register your models here.
