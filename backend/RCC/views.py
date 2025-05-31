import json
from django.db.models import IntegerField, CharField
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from .models import Order, ContractInvoiceID
from .serializers import ItemSerializer
from collections import defaultdict
from io import BytesIO
from datetime import datetime
import pandas as pd
from django.db import models
from pathlib import Path
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.db.models.functions import ExtractYear
import os

User = get_user_model()
baseDir = Path(__file__).resolve().parent

class Table(APIView):
    def get(self, request, id = None):
        if id:
            try:
                item = Order.objects.get(id = id, toDelete = False)
                result = ItemSerializer(item)
                return Response(result.data, status = status.HTTP_200_OK)
            except Order.DoesNotExist:
                return Response(f"Not found order with ID {id}", status = status.HTTP_404_NOT_FOUND)
        else:
            year = request.query_params.get('year')
            if year:
                items = Order.objects.filter(loadDate__year=year).exclude(toDelete = True).order_by('loadDate')
            else:
                # Get the latest year with data
                latest_year = Order.objects.filter(toDelete = False).annotate(year=ExtractYear('loadDate')).values_list('year', flat=True).distinct().order_by('-year').first()
                if latest_year:
                    items = Order.objects.filter(loadDate__year=latest_year).exclude(toDelete = True).order_by('loadDate')
                else:
                    return Response({})  # Or some other appropriate response if no data exists

            grouped_data = defaultdict(list)

            for item in items:
                if item.loadDate:
                    month_year = item.loadDate.strftime("%m-%Y")
                    grouped_data[month_year].append(item)

            result = {date: ItemSerializer(orders, many=True).data for date, orders in grouped_data.items()}
            return Response(result)
            

    def post(self, request):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)  
        if request.user.role == "Viewer": return Response({"error": "You are not allowed to use this function"},
                                                          status = status.HTTP_403_FORBIDDEN)
        serializer = ItemSerializer(data=request.data, many = True)
        if serializer.is_valid():
            serializer.save(createdByUser = request.user)
            user = request.user
            user.createdObjects += 1
            user.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, id):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)  
        if request.user.role == "Viewer": return Response({"error": "You are not allowed to use this function"},
                                                          status = status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(id=id)
            if order.toDelete and request.user.role != "Admin": return Response(status=status.HTTP_403_FORBIDDEN)
            serializer = ItemSerializer(order, data=request.data, partial=True)
            if serializer.is_valid():
                prevOrderStatus = order.orderID
                newOrderID = serializer.validated_data.get("orderID", prevOrderStatus)
                if (not prevOrderStatus) and newOrderID: serializer.save(orderStatus = "created")
                elif prevOrderStatus and (not newOrderID): serializer.save(orderStatus = "empty")
                # elif "toDetele" in request.data and request.data["toDelete"]: serializer.save(toDeleteRequest = request.user)
                elif serializer.validated_data.get("toDelete") and not order.toDelete: serializer.save(toDeleteRequest = request.user)
                else: serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            raise NotFound(detail="Order not found", code=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, id):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)
        if request.user.role == "Viewer": return Response({"error": "You are not allowed to use this function"},
                                                          status = status.HTTP_403_FORBIDDEN)
        if request.user.role == "Admin":
            try:
                order = Order.objects.get(id=id)
                order.delete()
                return Response(status=status.HTTP_200_OK)
            except Order.DoesNotExist:
                raise NotFound(detail="Order not found", code=status.HTTP_404_NOT_FOUND)
        else: return Response({"error": "Restricted"}, status = status.HTTP_403_FORBIDDEN)

class Orders(viewsets.ModelViewSet):
    @action(detail = False, methods=["get"])
    def years(self, request):
        years = (
            Order.objects
                 .filter(toDelete = False)
                 .annotate(year=ExtractYear("loadDate", output_field=IntegerField()))
                 .values_list("year", flat=True)
                 .distinct()
                 .order_by("-year")
        )
        return Response(list(years))

    @action(detail = False, methods=["get"])
    def all(self, request):
        orders = Order.objects.all()
        serializer = ItemSerializer(orders, many = True)
        return Response(data = serializer.data, status = 200)

class Clients(APIView):
    def get(self, request):
        clients = Order.objects.values_list('client', flat=True).distinct()
        return Response(list(clients))
    
class OrderHistory(APIView):
    def get(self, request, id):
        try:
            order = Order.objects.get(id=id)
            history = order.changes.all().order_by("-history_date")
            history_data = []

            for i, record in enumerate(history):
                # Default values
                changed_fields = []
                snapshot = {}

                if record.history_type == '+':
                    # On creation, include full snapshot
                    for field in record._meta.fields:
                        if field.name == 'id':
                            continue
                        value = getattr(record, field.name)
                        snapshot[field.name] = str(value) if isinstance(value, models.Model) else value

                else:
                    # For updates/deletes, show only changed fields
                    if i + 1 < len(history):
                        diff = record.diff_against(history[i + 1])
                        changed_fields = diff.changed_fields
                        for change in diff.changes:
                            field_name = change.field
                            snapshot[field_name] = {
                                "from": change.old,
                                "to": change.new
                            }

                history_data.append({
                    "history_id": record.history_id,
                    "history_date": record.history_date,
                    "history_user": str(record.history_user) if record.history_user else None,
                    "history_type": record.history_type,
                    "changed_fields": changed_fields,
                    "snapshot": snapshot
                })

            return Response(history_data, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return NotFound(detail="Order not found", code=status.HTTP_404_NOT_FOUND)
    
class excelReport(APIView):
    def get(self, request):
        orders = Order.objects.all()
        grouped = defaultdict(list)
        for order in orders:
            if order.loadDate:
                month_key = order.loadDate.strftime("%Y-%m")
                grouped[month_key].append({
                    "ID": order.id,
                    "Клиент": order.client,
                    "Клиент менеджер": order.clientManager,
                    "ЮЛ Клиента": order.client_sLegalEntity,
                    "Пункт отправки": order.routeStart,
                    "Пункт назначения": order.routeEnd,
                    "Груз": order.cargo,
                    "Код ТНВЭД": order.tnved,
                    "Дата загрузки": order.loadDate,
                    "Совместная сделка": order.cooperativeOrder,
                    "Сумма на Клиента": order.sumOnClient,
                    "Брутто": order.brutto,
                    "Нетто": order.netto,
                    "КН": order.kn,
                    "Профит": order.profit,
                    "Дата погр/выгр по CMR": order.deliverDateByCMR,
                    "Номер ТС": order.vehicle,
                    "Номер сделки": order.orderID,
                    "Номер заявки": order.applicationID,
                    "Акты и счета": order.actsAndInvoices,
                    "Экспедитор": order.expeditor,
                    "Счет подрядчика": order.contractorInvoice,
                    "Подрядчик": order.contractor,
                    "ЮЛ подрядчика": order.contractorLegalEntity,
                    "Дополнительные расходы": order.additionalExpenses,
                    "Сделка отменена": "Да" if order.cancelled else "Нет",
                    "Номер инвойса страховки клиента": order.client_sInsuranceID,
                    "Статус сделки": order.orderStatus,
                    "Тип груза": order.cargoType,
                    "Заметки": order.notes
                })

        # Create Excel in memory
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            for month, records in grouped.items():
                df = pd.DataFrame(records)
                df.to_excel(writer, sheet_name=month, index=False)

        buffer.seek(0)

        response = HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        filename = f"orders_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response
    
class contractorInvoiceID(APIView):
    def get(self, request):
        result = ContractInvoiceID.objects.values('contractorName', 'contractor', "contractorLE")
        return Response(result)

    def put(self, request):
        if request.user.role == "Viewer": return Response({"error": "You are not allowed to use this function"},
                                                          status = status.HTTP_403_FORBIDDEN)
        data = request.data
        if not data["contractor"]:
            return Response({"error": "Missing contractor key"}, status = status.HTTP_400_BAD_REQUEST)
        try:
            entity = ContractInvoiceID.objects.get(contractor = data["contractor"])
            entity.invoiceID += 1
            entity.save()
            return Response({"ID": f"{entity.contractor}-{entity.invoiceID}"}, status = status.HTTP_200_OK)
        except ContractInvoiceID.DoesNotExist:
            return Response({"Error": "Contractor not found"}, status = status.HTTP_404_NOT_FOUND)
        
class staticValues(APIView):
    def get(self, request):
        jsonFile = baseDir / "ru_en.json"
        try:
            with open(jsonFile, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return Response(data, status = 200)
        except FileNotFoundError:
            print("not found")
            return Response({"error": "Server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        jsonFile = baseDir / "ru_en.json"
        try:
            with open(jsonFile, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            print("not found")
            return Response({"error": "Server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        section: str = request.data.get("section")
        ruValue: str = request.data.get("ruValue")
        enValue: str = request.data.get("enValue")

        if not section or not ruValue:
            return Response({"error": "Section has not provided"}, status = status.HTTP_400_BAD_REQUEST)
        if section not in data:
            return Response({"error": "Error section provided"}, status = status.HTTP_400_BAD_REQUEST)
        if ruValue in data[section]:
            return Response({"error": f"Such value {ruValue} already exists"}, status = status.HTTP_304_NOT_MODIFIED)
        if section == "city": data[section][ruValue.capitalize().title()] = enValue.capitalize().title()
        else: data[section][ruValue.capitalize()] = enValue.capitalize()

        with open(jsonFile, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        return Response(status = 200)

class toDeleteRequests(APIView):
    def get(request, self):
        items = Order.objects.filter(toDelete = True)
        serializer = ItemSerializer(items, many = True)
        return Response(serializer.data)