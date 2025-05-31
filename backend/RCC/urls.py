from django.urls import path
from . import views

urlpatterns = [
    path("", views.Table.as_view()),
    path("add", views.Table.as_view()),
    path("<int:id>", views.Table.as_view()),
    path("excel", views.excelReport.as_view()),
    path("clients", views.Clients.as_view()),
    path("history/<int:id>", views.OrderHistory.as_view()),
    path("contractorID", views.contractorInvoiceID.as_view()),
    path("contractors", views.contractorInvoiceID.as_view()),
    path("staticValues", views.staticValues.as_view()),
    path("deleteRequests", views.toDeleteRequests.as_view()),
    path("years", views.Orders.as_view({"get": "years"})),
    path("all", views.Orders.as_view({"get": "all"}))
]
