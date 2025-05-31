"use client"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table"
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
DialogFooter,
DialogClose
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogAddOrder } from "./addOrderDialog" 
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UpdateCardDialog } from "./orderUpdateDialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { DialogAdditionalInformation } from "./additionalInfoDialog"
import { ChangesHistoryDialog } from "./changesHistoryDialog"
import { CalendarIcon, XIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { parse, format, isValid } from "date-fns"
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"

import { Order, HideStatus, ColumnNames, UserInfo } from "../types"
import { useRouter, useParams, useSearchParams, useServerInsertedHTML } from "next/navigation"
import { CANCELLED } from "dns"

const ip = process.env.NEXT_PUBLIC_API

const ALLOWED = ["Route Complete Cargo", "Admin", "Viewer"]
const updateOrderDefault: Order = {
    id: 0,                             
    client: "Пусто",                         
    clientManager: "Пусто",
    client_sLegalEntity: '',    
    routeStart: '',             
    routeEnd: '',
    transshipmentPoint: '',               
    cargo: '',                  
    tnved: 0,                  
    loadDate: '',               
    cooperativeOrder: '',      
    sumOnClient: '',            
    brutto: '',                 
    netto: '',                  
    kn: 0,                     
    profit: '',                 
    deliverDateByCMR: '',       
    vehicle: '',                
    orderID: '',                
    applicationID: '',          
    actsAndInvoices: '',        
    expeditor: '',              
    contractorInvoice: '',      
    contractor: '',             
    contractorLegalEntity: '',  
    additionalExpenses: '',
    cancelled: false,
    notes: '',
    orderStatus: 'empty',
    applicationAttached: false,
    contractorInvoiceSent: false,
    needToChangeVehicle: false,
    needToChangeBrutto: false,
    needToChangeNetto: false,
    cargoType: "Комплектный",
    foreignOrder: false,
    client_sInsuranceID: '',
    toDelete: false
}

const monthNames = [
    "Январь",    
    "Февраль",   
    "Март",      
    "Апрель",    
    "Май",       
    "Июнь",      
    "Июль",      
    "Август",    
    "Сентябрь",  
    "Октябрь",   
    "Ноябрь",    
    "Декабрь"    
];
const convertMonthYear = (monthYear: string): string => {
    const [month, year] = monthYear.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]}`;
};

function getMM_YYYY(dateStr: string): string {
    const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());

    if (!isValid(parsedDate)) {
        console.warn("Invalid date:", dateStr);
        return "";
    }

    return format(parsedDate, "MM-yyyy");
}

export default function AllPosts() {
    const year = useSearchParams().get("year")
    const token = localStorage.getItem("access_token")
    const userInfoString = localStorage.getItem("userInfo")
    const router = useRouter()
    const [userInfo, setUserInfo] = useState<UserInfo>()
    const [orders, setOrderData] = useState<{[key: string]: Order[]}>({})
    const [allOrders, setAllOrders] = useState<Order[]>()
    const [contractors, setContractors] = useState<Array<{
        contractorName: string;
        contractor: string;
        contractorLE: string;
    }>>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>()
    const [RU_ENSection, setRU_ENSeciton] = useState<string>()
    const [demurrageInput, setDemurrageInput] = useState<boolean>(false)
    const [demurragePrice, setDemurragePrice] = useState<number | null>(null)
    const [updateOrder, setUpdateOrder] = useState<Order>(updateOrderDefault)
    const [rowMenuModals, setRowMenuModal] = useState({
        addNewOrder: false,
        additionalInformation: false,
        change: false,
        copy: false,
        history: false,
        deletion: false,
        calendar: false,
        demurrage: false,
        RU_EN: false
    })

    type Checked = DropdownMenuCheckboxItemProps["checked"]
    const [orderTypes, setOrderTypes] = useState<Record<string, Checked>>({
        all: true,
        empty: false,
        created: false,
        confirmed: false,
        finished: false,
        foreignOrders: false,
        contractorInvoiceHasNotSent: false,
        loadDateCurrentDay: false
    })

    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    const [CBcurrency, setCBcurrency] = useState<{[key: string]: number}>({
        "USD": 0,
        "EUR": 0,
        "RUB": 0
    })
    const [CBcurrencySum, setCBcurrencySum] = useState<{[key: string]: number}>({
        "USD": 0,
        "EUR": 0,
        "RUB": 0
    })

    useEffect(() => {
        document.title = "RCC Table"
        const yearUrl = year ? `?year=${year}` : ""
        if (userInfoString) {
            const temp = JSON.parse(userInfoString)
            if (!ALLOWED.includes(temp?.department)) router.push('/')
            setUserInfo(temp)
        }
        fetch(`${ip}/RCC${yearUrl}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then((data: { [key: string]: Order[] }) => {
            if (typeof data === "object" && data !== null) {
                setOrderData(data);
                setAllOrders(Object.values(data).flat());
            } else console.error("Expected an object but got:", data);
            })
            .catch(error => console.error("Fetch error:", error));
        fetch(`${ip}/RCC/contractors`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then((data) => {
            if (data !== null) setContractors(data);
            else console.error("`Expected an object but got:", data);
            })
        .catch(error => console.error("Fetch error:", error));
    }, [year, router])

    const [hideStatus, setHideStatus] = useState<HideStatus>({
        id: false,
        client: false,
        clientManager: false,
        client_sLegalEntity: false,
        routeStart: false,
        routeEnd: false,
        cargo: false,
        loadDate: false,
        // sumOnClient: false,
        brutto: false,
        netto: false,
        kn: false,
        profit: false,
        vehicle: false,
        orderID: false,
        applicationID: false,
        expeditor: false,
        contractorInvoice: false,
        contractor: false,
        contractorLegalEntity: false,
        cancelled: false
    });

    function resetHideStatus() {
        setHideStatus(prev =>
            Object.keys(prev).reduce<HideStatus>((acc, key) => {
              acc[key as keyof HideStatus] = false;
              return acc;
            }, {} as HideStatus)
        );
    }
    
    const columnsName: ColumnNames = {
        id: "ID",
        client: "Клиент",
        clientManager: "КМ",
        client_sLegalEntity: "ЮЛ Клиента",
        routeStart: "Пункт отправки",
        routeEnd: "Пункт назначения",
        cargo: "Груз",
        loadDate: "Дата загрузки",
        sumOnClient: "Сумма на Клиента",
        brutto: "Брутто",
        netto: "Нетто",
        kn: "КН",
        profit: "Профит",
        vehicle: "ТС",
        orderID: "Сделка",
        applicationID: "Заявка",
        expeditor: "Экспедитор",
        contractorInvoice: "Счет подрядчика",
        contractor: "Подрядчика",
        contractorLegalEntity: "ЮЛ подрядчика"
    };

    const [filters, setFilters] = useState({
        id: null,
        client: "",                        
        clientManager: "",                  
        client_sLegalEntity: "",    
        routeStart: "",             
        routeEnd: "",               
        cargo: "",                  
        tnved: null,             
        loadDate: "",
        loadDateCurrentDay: false,
        cooperativeOrder: "",      
        sumOnClient: "",            
        brutto: "",                 
        netto: "",                  
        kn: null,
        profit: "",                 
        deliverDateByCMR: "",       
        vehicle: "",                
        orderID: "",                
        applicationID: "",          
        actsAndInvoices: "",        
        expeditor: "",              
        contractorInvoice: "",      
        contractor: "",             
        contractorLegalEntity: "",
        isContractorInvoiceSent: true,
        orderStatus: '',
        foreignOrder: false
      });

    function resetFilters() {
        setFilters({
            id: null,
            client: "",                         
            clientManager: "",                  
            client_sLegalEntity: "",    
            routeStart: "",             
            routeEnd: "",               
            cargo: "",                  
            tnved: null,                 
            loadDate: "",
            loadDateCurrentDay: false,            
            cooperativeOrder: "",      
            sumOnClient: "",            
            brutto: "",                 
            netto: "",                  
            kn: null,
            profit: "",                 
            deliverDateByCMR: "",       
            vehicle: "",                
            orderID: "",                
            applicationID: "",          
            actsAndInvoices: "",        
            expeditor: "",              
            contractorInvoice: "",      
            isContractorInvoiceSent: true,
            contractor: "",             
            contractorLegalEntity: "",
            orderStatus: '',
            foreignOrder: false
        })
    }

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const [sortField, setSortField] = useState<keyof Order | null>("id");
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const handleSort = (field: keyof Order) => {
        // If clicking on the same field, toggle sort direction
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // If clicking on a new field, set it as the sort field and default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortedOrders = (monthData: Order[]) => {
        if (!sortField) return monthData;
      
        return [...monthData].sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
      
          // Handle different types of values
          if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
          if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      
          // Sort based on data type
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
              ? aValue.localeCompare(bValue) 
              : bValue.localeCompare(aValue);
          } 
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            return sortDirection === 'asc' 
              ? (aValue === bValue ? 0 : aValue ? 1 : -1)
              : (aValue === bValue ? 0 : aValue ? -1 : 1);
          }
      
          // If types don't match, convert to string and compare
          return sortDirection === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
        });
    };

    
    const [selectedOrder, setSelectedOrder] = useState<Order>({
        id: 0,
        client: '',                            
        clientManager: '',                     
        client_sLegalEntity: null,             
        routeStart: null,                      
        routeEnd: null,
        transshipmentPoint: null,                        
        cargo: null,                           
        tnved: null,                           
        loadDate: '',                        
        cooperativeOrder: null,               
        sumOnClient: null,                     
        brutto: null,                          
        netto: null,                           
        kn: null,                              
        profit: null,                          
        deliverDateByCMR: null,                
        vehicle: null,                         
        orderID: null,                         
        applicationID: null,                   
        actsAndInvoices: null,                 
        expeditor: null,                       
        contractorInvoice: null,               
        contractor: null,                      
        contractorLegalEntity: null,           
        additionalExpenses: null ,
        cancelled: false,              
        notes: null,
        orderStatus: "empty",
        applicationAttached: false,
        contractorInvoiceSent: false,
        needToChangeVehicle: false,
        needToChangeBrutto: false,
        needToChangeNetto: false,
        cargoType: "",
        foreignOrder: false,
        toDelete: false
    })

    const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<{[key: string]: number}>({});
    const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

    const handleGlobalSearch = (searchTerm: string) => {
        setGlobalSearchTerm(searchTerm);
        
        if (!searchTerm.trim()) {
          setSearchResults({});
          setShowSearchResults(false);
          return;
        }
        
        const results: {[key: string]: number} = {};
        
        // Search through all months and orders
        Object.entries(orders).forEach(([month, monthOrders]) => {
          const matchCount = monthOrders.filter(order => {
            // Convert all fields to strings and check if they include the search term
            return Object.entries(order).some(([key, value]) => {
              if (value === null || value === undefined) return false;
              return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
          }).length;
          
          if (matchCount > 0) {
            results[month] = matchCount;
          }
        });
        
        setSearchResults(results);
        setShowSearchResults(true);
        
        // If there's only one month with results, switch to it automatically
        const monthsWithResults = Object.keys(results);
        if (monthsWithResults.length === 1) {
          setSelectedMonth(monthsWithResults[0]);
        }
    };

    const handleSearchResultClick = (month: string) => {
        setSelectedMonth(month);
        setShowSearchResults(false);
    };

    function requestTable() {
        fetch(`${ip}/RCC/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setOrderData(data)
                setAllOrders(Object.values(orders).flat())
            })
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    function requestSpecificOrder(id: number) {
        fetch(`${ip}/RCC/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setUpdateOrder(data)
            })
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    async function changeSpecificField<X extends keyof Order>(id: number, field: X, value: Order[X]) {
        await fetch(`${ip}/RCC/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({[field]: value})})
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Ошибка", {
                            description: `Сделки с такой ID ${updateOrder.id} отсутствует (возможно удалена)`,
                            position: "top-right",
                            duration: 6000
                          })    
                    } else {
                        toast.error("Ошибка", {
                            description: `Ошибка: ${response.status}`,
                            position: "top-right",
                            duration: 6000
                          })
                    }
                }
            })
            .then(requestTable) 
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    async function applyContractorInfo(id: number, contractorID: string, contractor: string, contractorLE: string) {
        await fetch(`${ip}/RCC/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                id: id,
                contractorInvoice: contractorID,
                contractor: contractor,
                contractorLegalEntity: contractorLE
            })
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Ошибка", {
                            description: `Сделки с такой ID ${updateOrder.id} отсутствует (возможно удалена)`,
                            position: "top-right",
                            duration: 6000
                          })    
                    } else {
                        toast.error("Ошибка", {
                            description: `Ошибка: ${response.status}`,
                            position: "top-right",
                            duration: 6000
                          })
                    }
                }
            })
            .then(requestTable) 
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    async function sendUpdatedOrder(updatedOrder: Partial<Order> & {id: number}) {
        await fetch(`${ip}/RCC/${updatedOrder.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedOrder)})
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Ошибка", {
                            description: `Сделки с такой ID ${updateOrder.id} отсутствует (возможно удалена)`,
                            position: "top-right",
                            duration: 6000
                          })    
                    } else {
                        toast.error("Ошибка", {
                            description: `Ошибка: ${response.status}`,
                            position: "top-right",
                            duration: 6000
                          })
                    }
                    return // Otherwise, parse as JSON
                }
            })
            .then(requestTable) 
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    function addCopiedOrder(order: Order) {
        const { id, orderID, vehicle, contractorInvoice,
            applicationID, additionalExpenses,
            cancelled, notes, orderStatus, applicationAttached,
            contractorInvoiceSent, needToChangeVehicle, cooperativeOrder,
            needToChangeBrutto, needToChangeNetto,
            actsAndInvoices, client_sInsuranceID,
            ...copiedWithoutID} = order
        fetch(`${ip}/RCC/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(copiedWithoutID)})
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Ошибка", {
                            description: `Сделки с такой ID ${updateOrder.id} отсутствует (возможно удалена)`,
                            position: "top-right",
                            duration: 6000
                          })    
                    } else {
                        toast.error("Ошибка", {
                            description: `Ошибка: ${response.status}`,
                            position: "top-right",
                            duration: 6000
                          })
                    }
                }
                // If response has no content, return an empty object or null
                if (response.ok) {
                    toast.success("Создана новая строка", {
                        description: `Сделка по клиенту ${order.client} скопирована`,
                        position: "top-right",
                        duration: 6000
                      })
                }
                return console.log(response.status); // Otherwise, parse as JSON
            })
            .then(requestTable) 
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    async function handleDownload() {
        try {
          const response = await fetch(`${ip}/RCC/excel`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
          });
    
          if (!response.ok) throw new Error("Failed to download");
    
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
    
          const a = document.createElement("a");
          a.href = url;
          a.download = "orders.xlsx";
          a.click();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Error downloading file:", err);
        }
    }
    
    async function getContractorInvoiceID(contractor: string, notify: boolean = true): Promise<string> {
        try {
            const response = await fetch(`${ip}/RCC/contractorID`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ contractor }),
            });

            if (!response.ok) {
                toast.error("Ошибка", {
                    description: `Ошибка: ${response.status}`,
                    position: "top-center",
                    duration: 6000,
                });
                return ''; // or throw an error if needed
            }

            const data = await response.json();

            if (data?.ID) {
                if (notify) {
                    toast.success("ID получен", {
                        description: data.ID,
                        position: "top-center",
                        duration: 20000,
                    });
                }
                return data.ID;
            }

            return ''; // or handle the missing ID case differently
        } catch (error) {
            console.error("Error while fetching", error);
            return ''; // or rethrow error depending on your needs
        }
    }

    async function copyValues(columns: (keyof Order)[]) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || columns.length === 0) return;

        const range = selection.getRangeAt(0);
        const table = document.querySelector("table");
        if (!table) return;

        const rows = Array.from(table.querySelectorAll("tbody tr"));

        // Determine visible columns based on hideStatus
        const visibleColumns = Object.entries(hideStatus)
            .filter(([_, hidden]) => !hidden)
            .map(([key]) => key);

        // Map keys (e.g., "vehicle", "orderID") to their visible column index
        const columnIndices = columns.map(key => visibleColumns.indexOf(key)).filter(index => index !== -1);
        if (columnIndices.length !== columns.length) return; // Some columns not visible

        // Filter selected rows
        const selectedRows = rows.filter(row => {
            const rowRange = document.createRange();
            rowRange.selectNodeContents(row);
            return (
            range.compareBoundaryPoints(Range.END_TO_START, rowRange) === -1 &&
            range.compareBoundaryPoints(Range.START_TO_END, rowRange) === 1
            );
        });

        // Extract values for each selected row and join
        const copiedText = selectedRows
            .map(row => {
            const cells = Array.from(row.querySelectorAll("td"));
            const values = columnIndices.map(index => cells[index]?.textContent?.trim() ?? "");
            return values.join(" ");
            })
            .filter(line => line.trim() !== "")
            .join("\n");

        if (copiedText) {
            try {
            await navigator.clipboard.writeText(copiedText);
            } catch (err) {
            // Fallback for HTTP or permission issues
            const textarea = document.createElement("textarea");
            textarea.value = copiedText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            }
        }
    }

    const [RU_ENValue, setRU_ENValue] = useState({
        ru: "",
        en: ""
    })
    function addNewOrderStaticFieldValue(section: string, ruValue: string, enValue: string) {
        fetch(`${ip}/RCC/staticValues`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                "section": section,
                "ruValue": ruValue.toLocaleLowerCase(),
                "enValue": enValue.toLocaleLowerCase()
            })})
            .then(response => {
                if (!response.ok) {
                    if (response.status === 304) {
                        toast.error("Ошибка", {
                            description: "Данные значения уже имеются",
                            position: "top-right",
                            duration: 4000
                          })     
                    } else {
                        toast.error("Ошибка", {
                            description: `Ошибка: ${response.status}`,
                            position: "top-right",
                            duration: 6000
                          }) 
                    }
                    return
                }
                toast.success(`Новое значение ${ruValue} - ${enValue} успешно добавлено`, 
                    {
                    position: "top-right",
                    duration: 3000
                });
            })
            .catch(error => {
                console.error("Error while fetching", error)
            })
    }

    function selectedRowActions(action: string) {

    }

    function getCBcurrency() {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Tashkent'
          });
        const currentDate = formatter.format(new Date());  // e.g. "2025-05-03"
        
        fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/USD/${currentDate}`)
        .then(res => res.json())
        .then(data => setCBcurrency(x => ({...x, USD: data[0]["Rate"]})))
        fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/EUR/${currentDate}`)
        .then(res => res.json())
        .then(data => setCBcurrency(x => ({...x, EUR: data[0]["Rate"]})));
        fetch(`https://cbu.uz/ru/arkhiv-kursov-valyut/json/RUB/${currentDate}`)
        .then(res => res.json())
        .then(data => setCBcurrency(x => ({...x, RUB: data[0]["Rate"]})));
    }

    const getTotalBruttoNetto = (orders: Order[]) => {
        let totalBrutto = 0;
        let totalNetto = 0;
        let totalProfit = 0;

        Object.values(orders).forEach((order) => {
            if (!order.cancelled || order.brutto || order.netto) {
                totalBrutto += parseInt(order.brutto || '0')
                if (order.netto?.includes('/')) {
                    let parts = order.netto.split('/')
                    totalNetto += parseInt(parts[0] || '0') + parseInt(parts[1] || '0')
                } else totalNetto += parseInt(order.netto || '0')
            }
        })
        totalProfit = totalBrutto - totalNetto
        
        return { totalBrutto, totalNetto, totalProfit }
    }
    const [moneyTurnover, setMoneyTurnover] = useState({
        brutto: 0,
        netto: 0,
        profit: 0
    })

    const [isClientInputFocused, setIsClientInputFocused] = useState(false);
    const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
    const [date, setDate] = useState<Date>()
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);


    useEffect(() => {
        if (!selectedMonth || !orders[selectedMonth]) {
            setFilteredOrders([]);
            setMoneyTurnover({ brutto: 0, netto: 0, profit: 0});
            return;
        }
        if (!filters.loadDate) { setDate(undefined) }

        const sortedOrders = getSortedOrders(orders[selectedMonth]);
        
        // Apply filters
        const newFilteredOrders = sortedOrders.filter(order => 
            (filters.id === null || order.id === parseInt(filters.id)) &&
            (order.client.toLowerCase().includes(filters.client.toLowerCase())) &&
            (order.clientManager.toLowerCase().includes(filters.clientManager.toLowerCase())) &&
            (order.client_sLegalEntity ?? "").toLowerCase().includes(filters.client_sLegalEntity.toLowerCase()) &&
            (order.routeStart ?? "").toLowerCase().includes(filters.routeStart.toLowerCase()) &&
            (order.routeEnd ?? "").toLowerCase().includes(filters.routeEnd.toLowerCase()) &&
            (order.cargo ?? "").toLowerCase().includes(filters.cargo.toLowerCase()) &&
            // (filters.loadDate ? order.loadDate === filters.loadDate : true) && // Exact match for date
            (
                filters.loadDate 
                    ? order.loadDate === filters.loadDate
                    : filters.loadDateCurrentDay 
                        ? order.loadDate <= new Date().toISOString().slice(0, 10)
                        : true
            ) &&
            (filters.tnved ? (order.tnved ?? 0) === Number(filters.tnved) : true) &&
            (order.cooperativeOrder ?? "").toLowerCase().includes(filters.cooperativeOrder.toLowerCase()) &&
            (order.sumOnClient ?? "").toLowerCase().includes(filters.sumOnClient.toLowerCase()) &&
            (order.brutto ?? "").toLowerCase().includes(filters.brutto.toLowerCase()) &&
            (order.netto ?? "").toLowerCase().includes(filters.netto.toLowerCase()) &&
            (filters.kn ? (order.kn ?? 0) === Number(filters.kn) : true) &&
            (order.profit ?? "").toLowerCase().includes(filters.profit.toLowerCase()) &&
            (filters.deliverDateByCMR ? order.deliverDateByCMR === filters.deliverDateByCMR : true) && // Exact match for date
            (order.vehicle ?? "").toLowerCase().includes(filters.vehicle.toLowerCase()) &&
            // (order.orderID ?? "").toLowerCase().includes(filters.orderID.toLowerCase()) &&
            (filters.orderID === "" || filters.orderID.split(",").map(val => val.trim().toLocaleLowerCase()).some(id => (order.orderID ?? "").toLocaleLowerCase().includes(id))) &&
            // (order.applicationID ?? "").toLowerCase().includes(filters.applicationID.toLowerCase()) &&
            (filters.applicationID.toLocaleLowerCase() === "null" ? order.applicationID === null : (
                order.applicationID ?? '').toLocaleLowerCase().includes(filters.applicationID.toLocaleLowerCase())) &&
            (order.actsAndInvoices ?? "").toLowerCase().includes(filters.actsAndInvoices.toLowerCase()) &&
            (order.expeditor ?? "").toLowerCase().includes(filters.expeditor.toLowerCase()) &&
            (filters.contractorInvoice.toLocaleLowerCase() === "null" ? order.contractorInvoice === null : (
                order.contractorInvoice ?? '').toLocaleLowerCase().includes(filters.contractorInvoice.toLocaleLowerCase())) &&
            (order.contractor ?? "").toLowerCase().includes(filters.contractor.toLowerCase()) &&
            (order.contractorLegalEntity ?? "").toLowerCase().includes(filters.contractorLegalEntity.toLowerCase()) &&
            (order.orderStatus ?? "").toLowerCase().includes(filters.orderStatus.toLowerCase()) &&
            (!filters.foreignOrder || order.foreignOrder === true) &&
            (!hideStatus.cancelled || !order.cancelled) &&
            (filters.isContractorInvoiceSent === undefined || filters.isContractorInvoiceSent === true || order.contractorInvoiceSent === filters.isContractorInvoiceSent)
        );
        
        // Store filtered orders
        setFilteredOrders(newFilteredOrders);
        
        // Calculate totals based on filtered orders
        const { totalBrutto, totalNetto, totalProfit } = getTotalBruttoNetto(newFilteredOrders);
        setMoneyTurnover({
            brutto: totalBrutto,
            netto: totalNetto,
            profit: totalProfit
        });

        const uniqueClients = Array.from(new Set(
            orders[selectedMonth]
                .map(order => order.client)
                .filter(client => client)
        ));
        setClientSuggestions(uniqueClients);
    }, [selectedMonth, orders, filters, hideStatus.cancelled, globalSearchTerm, sortField, sortDirection]);
    const filteredClientSuggestions = clientSuggestions.filter(client =>
        client.toLowerCase().includes(filters.client.toLowerCase())
    )

    return (
        <div>
            <div>
                <Tabs>
                    <TabsList className="flex justify-center w-full">
                        {Object.keys(orders).map(month => (
                            <TabsTrigger key={month} value={month}
                                onClick={() => {
                                    setSelectedMonth(month);
                                }}>{convertMonthYear(month)}</TabsTrigger>
                            ))
                        }
                    </TabsList>
                    <div className="flex flex-wrap space-y-2 justify-end space-x-2 mr-2">
                        {/*  Глобальный поиск */}
                        <div>
                            <Input 
                            type="text" 
                            placeholder="Глобальный поиск..."
                            value={globalSearchTerm}
                            onChange={(e) => handleGlobalSearch(e.target.value)}
                            className="pr-10"
                            />
                            {globalSearchTerm && (
                            <button
                                onClick={() => {
                                setGlobalSearchTerm("");
                                setSearchResults({});
                                setShowSearchResults(false);
                                }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >✕</button>
                            )}
                            
                            {/* Search results dropdown */}
                            {showSearchResults && (
                            <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border p-2">
                                {Object.keys(searchResults).length > 0 ? (
                                <>
                                    <div className="font-medium mb-2">Результаты поиска:</div>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {Object.entries(searchResults).map(([month, count]) => (
                                        <div 
                                            key={month} 
                                            className="flex justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                                            onClick={() => handleSearchResultClick(month)}
                                            >
                                            <span>{convertMonthYear(month)}</span>
                                            <Badge>{count} {count === 1 ? 'результат' : 'результатов'}</Badge>
                                        </div>
                                    ))}
                                    </div>
                                </>
                                ) : (
                                <div className="text-gray-500">Ничего не найдено</div>
                                )}
                            </div>
                            )}
                        </div>

                        {/*  Курс валют */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" onClick={getCBcurrency}>Курсы валют ЦБ</Button>
                            </PopoverTrigger>
                            <PopoverContent className="space-y-2 w-[400px]">   
                                <div className="flex space-x-2 items-center">
                                    <b>USD: {Number(CBcurrency.USD).toLocaleString('ru-RU')}</b>
                                    <Input type="number" className="max-w-[100px] justify-end"
                                        onChange={(e) => setCBcurrencySum(x => ({...x, USD: CBcurrency.USD * Number(e.target.value)}))}/>
                                    <p>{CBcurrencySum.USD !== 0 ? `${CBcurrencySum.USD.toLocaleString("ru-RU")} сумов` : null}</p>
                                </div>
                                <div className="flex space-x-2 items-center">
                                    <b>EUR: {Number(CBcurrency.EUR).toLocaleString("ru-RU")}</b>
                                    <Input type="number" className="max-w-[100px] justify-end"
                                        onChange={(e) => setCBcurrencySum(x => ({...x, EUR: CBcurrency.EUR * Number(e.target.value)}))}/>
                                    <p>{CBcurrencySum.EUR !== 0 ? `${CBcurrencySum.EUR.toLocaleString("ru-RU")} сумов` : null}</p>
                                </div>
                                <div className="flex space-x-2 items-center">
                                    <b>RUB: {Number(CBcurrency.RUB).toLocaleString("ru-RU")}</b>
                                    <Input type="number" className="max-w-[100px] justify-end"
                                        onChange={(e) => setCBcurrencySum(x => ({...x, RUB: CBcurrency.RUB * Number(e.target.value)}))}/>
                                    <p>{CBcurrencySum.RUB !== 0 ? `${CBcurrencySum.RUB.toLocaleString("ru-RU")} сумов` : null}</p>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/*  Статистика */}
                        <Badge variant="secondary" className="font-bold">Сделки: {filteredOrders.length}</Badge>
                        <Badge variant="secondary" className="font-bold">Брутто: {moneyTurnover.brutto}</Badge>
                        <Badge variant="secondary" className="font-bold">Нетто: {moneyTurnover.netto}</Badge>
                        <Badge variant="secondary" className="font-bold">Профит: {moneyTurnover.profit}</Badge>

                        {/*  Выбранные ряды */}
                        <>
                            <Button onClick={() => {
                                setOrderTypes({
                                    all: true,
                                    empty: false,
                                    created: false,
                                    confirmed: false,
                                    finished: false,
                                    foreignOrders: false,
                                    contractorInvoiceHasNotSent: false
                                });
                                resetFilters();
                            }}>Сбросить фильтры</Button>
                            {selectedRows.size > 0 && (
                                <div className="space-x-2">
                                    <Button onClick={() => {
                                        setSelectedRows(new Set());
                                        setLastSelectedIndex(null);
                                    }}>Очистить выделенные <b>({selectedRows.size})</b></Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">Действия с выбраннами рядами</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {/* Клиентская часть */}
                                            <DropdownMenuItem onClick={() => {
                                                for (const item of selectedRows) {
                                                    if (allOrders?.some((x) => x.id == item && 
                                                    x.orderID?.trim() !== '' && 
                                                    x.orderStatus != "confirmed")) changeSpecificField(item, "orderStatus", "confirmed");
                                                }
                                            }}>Подтвердить сделки</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                for (const item of selectedRows) {
                                                    if (allOrders?.some((x) => x.id == item && 
                                                    x.orderID?.trim() !== '' && 
                                                    x.orderStatus != "finished")) changeSpecificField(item, "orderStatus", "finished");
                                                }
                                            }}>Завершить сделки</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                for (const item of selectedRows) {
                                                    if (allOrders?.some((x) => x.id == item && 
                                                    x.orderID?.trim() !== '' && 
                                                    x.orderStatus != "created")) changeSpecificField(item, "orderStatus", "created");
                                                }
                                            }}>Обнулить сделки</DropdownMenuItem>
                                            <Separator/>

                                            {/* Подрядчидская часть */}
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Присвоить номера счета подрядчика</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {contractors.map(v =>
                                                        <DropdownMenuItem key={v.contractor} onClick={async () => {
                                                            for (const item of selectedRows) {
                                                                const temp = await getContractorInvoiceID(v.contractor, false);
                                                                if (allOrders?.some((x) => x.id == item)) {
                                                                    await applyContractorInfo(item, temp, v.contractorName, v.contractorLE);
                                                                }
                                                            }
                                                        }}>{v.contractorLE} - {v.contractorName}</DropdownMenuItem>  
                                                    )}
                                                </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <Separator/>

                                            <DropdownMenuItem onClick={() => {
                                                const newFiltered = filteredOrders.filter(x => !selectedRows.has(x.id));
                                                setFilteredOrders(newFiltered);
                                            }}>Скрыть</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                const newFiltered = filteredOrders.filter(x => selectedRows.has(x.id));
                                                setFilteredOrders(newFiltered);
                                            }}>Скрыть остальные</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </>

                        {/*  Столбы */}
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Button variant="outline">Столбы</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => resetHideStatus()}>Показать все</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => {
                                        resetHideStatus();
                                        setHideStatus(prev => ({
                                            ...prev,
                                            id: true,
                                            tnved: true,
                                            kn: true,
                                            profit: true,
                                            vehicle: true,
                                            applicationID: true,
                                            expeditor: true,
                                            contractorInvoice: true,
                                            contractor: true,
                                            contractorLegalEntity: true
                                        }))
                                    }}>
                                Создание ЗПГ</DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => {
                                        resetHideStatus();
                                        setHideStatus(prev => ({
                                            ...prev,
                                            id: true,
                                            client: true,
                                            clientManager: true,
                                            client_sLegalEntity: true,
                                            routeStart: true,
                                            routeEnd: true,
                                            cargo: true,
                                            loadDate: true,
                                            sumOnClient: true,
                                            brutto: true,
                                            kn: true,
                                            profit: true,
                                            applicationID: true,
                                        }))
                                    }}>
                                Создание ЗНП</DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => {
                                        resetHideStatus();
                                        setHideStatus(prev => ({
                                            ...prev,
                                            id: true,
                                            clientManager: true,
                                            client_sLegalEntity: true,
                                            routeStart: true,
                                            routeEnd: true,
                                            cargo: true,
                                            loadDate: true,
                                            sumOnClient: true,
                                            brutto: true,
                                            kn: true,
                                            profit: true,
                                            vehicle: true,
                                            applicationID: true,
                                            expeditor: true,
                                            contractorInvoice: true,
                                            contractor: true,
                                            contractorLegalEntity: true,
                                            cancelled: true
                                        }))
                                    }}>
                                Отчет</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {Object.entries(hideStatus).map(([key, value]) => {
                                    if (key == "cancelled") {return null}
                                    return (
                                        <DropdownMenuItem
                                            key={key}
                                            className={!value ? "bg-muted font-semibold mt-[2px]" : "mt-[2px]"}
                                            onClick={() => setHideStatus(prev => ({
                                                ...prev, [key]: !value
                                            }))}
                                        >{columnsName[key]}
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/*  Статус сделок */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Статус сделки</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>Статус сделки</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.all}
                                    onCheckedChange={() => {
                                        setOrderTypes(x => ({...x, 
                                            all: true,
                                            created: false,
                                            confirmed: false,
                                            finished: false
                                        }))
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            orderStatus: ''
                                        }));
                                    }
                                }>Все</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.created}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, 
                                            created: e,
                                            all: false,
                                            confirmed: false,
                                            finished: false
                                        }));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            orderStatus: e ? "created" : '',
                                        }));
                                    }}
                                >Созданные</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.confirmed}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, 
                                            confirmed: e,
                                            all: false,
                                            created: false,
                                            finished: false
                                        }));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            orderStatus: e ? "confirmed" : '',
                                        }));
                                    }}
                                >Подтвержденные</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.finished}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, 
                                            finished: e,
                                            all: false,
                                            created: false,
                                            confirmed: false
                                        }));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            orderStatus: e ? "finished" : '',
                                        }));
                                    }}
                                >Завершенные</DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>Тип сделки</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.foreignOrders}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, foreignOrders: e}));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            foreignOrder: e
                                        }));
                                    }}
                                >Зарубежные сделки</DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>Подрядчик</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.contractorInvoiceHasNotSent}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, contractorInvoiceHasNotSent: e}));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            isContractorInvoiceSent: !e
                                        }));
                                    }}
                                >Не отправленые счета подрядчика</DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>Дата загрузки</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={orderTypes.loadDateCurrentDay}
                                    onCheckedChange={(e) => {
                                        setOrderTypes(x => ({...x, loadDateCurrentDay: e}));
                                        setFilters(prevFilters => ({
                                            ...prevFilters, 
                                            loadDateCurrentDay: e
                                        }));
                                    }}
                                >До сегодняшнего дня</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/*  Функции */}
                        <Dialog>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                    className="bg-indigo-400 hover:bg-indigo-500 hover:shadow-sm"
                                    >Функции</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={requestTable}>Обновить таблицу</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownload}>Экспорт в Excel</DropdownMenuItem>
                                    {userInfo?.role != "Viewer" && (
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>Получить ID счета от подрядчика</DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                {contractors.map(x => <DropdownMenuItem onClick={async () => await getContractorInvoiceID(x.contractor)}>{x.contractorLE} - {x.contractorName}</DropdownMenuItem> )}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    )}
                                    {orders[selectedMonth || '']?.some(order => order.cancelled) && (
                                        <DropdownMenuItem onClick={() => {
                                            if (!selectedMonth) return;
                                                setHideStatus(prev => ({
                                                    ...prev, cancelled: !hideStatus.cancelled
                                            }))
                                            }}>{hideStatus.cancelled ? "Показать отмененные" : "Скрыть отмененные"}
                                        </DropdownMenuItem>
                                    )}
                                    {userInfo?.role != "Viewer" && (
                                        <DialogTrigger asChild>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Добавить город/груз</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => {
                                                        setRU_ENSeciton("city");
                                                        setRowMenuModal((x) => ({...x, RU_EN: true}))
                                                    }}>Город</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setRU_ENSeciton("cargo");
                                                        setRowMenuModal((x) => ({...x, RU_EN: true}))
                                                    }}>Груз</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        </DialogTrigger>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Dialog>
                        {userInfo?.role !== "Viewer" && (
                            <DialogAddOrder 
                                modalOpenStatus={rowMenuModals.addNewOrder}
                                changeOpenStatus={status => setRowMenuModal(x => ({...x, addNewOrder: status}))}
                                setStaticValue={setRU_ENSeciton}
                                staticValueModal={rowMenuModals.RU_EN}
                                addStaticValue={status => setRowMenuModal(x => ({...x, RU_EN: status}))}
                                onRefresh={requestTable}
                                trigger={
                                    <Button 
                                        className="bg-green-600 hover:bg-green-500 duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-sm">
                                        Добавить сделку</Button>
                                }
                            />
                        )}
                    </div>
                    {Object.keys(orders).map(month => (
                        <TabsContent value={month} className="w-full" id={month} key={month}>
                            <ScrollArea className="h-[calc(100vh-120px)] rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0">
                                        <TableRow className="text-center">
                                            <TableHead 
                                                hidden={hideStatus.id}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("id")}>
                                                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.id || ''} className="bg-white min-w-[50px]"
                                                onChange={(e) => {
                                                    handleFilterChange("id", e.target.value)
                                                }}/>
                                            </TableHead>
                                            <TableHead
                                                hidden={hideStatus.client}
                                                className="cursor-pointer max-w-[300px]">
                                                <div onClick={() => handleSort("client")}>
                                                    Клиент {sortField === 'client' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                                <Popover open={isClientInputFocused} onOpenChange={setIsClientInputFocused}>
                                                    <PopoverTrigger asChild>
                                                    <Input
                                                        type="text"
                                                        className="bg-white w-full"
                                                        placeholder="Фильтр клиента"
                                                        value={filters.client}
                                                        onChange={(e) => handleFilterChange("client", e.target.value)}
                                                    />
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0">
                                                    <ScrollArea className="h-[400px] rounded-md border">
                                                        <Command>
                                                            <CommandInput placeholder="Поиск клиента..." />
                                                                <CommandGroup>
                                                                {filteredClientSuggestions.length > 0 ? (
                                                                    filteredClientSuggestions.map((client, idx) => (
                                                                    <CommandItem
                                                                        key={idx}
                                                                        onSelect={() => {
                                                                            handleFilterChange("client", client);
                                                                            setIsClientInputFocused(false);
                                                                        }}
                                                                    >
                                                                        {client}
                                                                    </CommandItem>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-2 text-sm text-muted-foreground">Ничего не найдено</div>
                                                                )}
                                                                </CommandGroup>
                                                        </Command>
                                                    </ScrollArea>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.clientManager}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("clientManager")}>
                                                    КМ {sortField === 'clientManager' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.clientManager} className="bg-white min-w-[100px]" 
                                                    onChange={(e) => {
                                                        handleFilterChange("clientManager", e.target.value)
                                                    }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.client_sLegalEntity}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("client_sLegalEntity")}>
                                                    ЮЛ Клиента {sortField === 'client_sLegalEntity' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.client_sLegalEntity} className="bg-white" 
                                                    onChange={(e) => {
                                                        handleFilterChange("client_sLegalEntity", e.target.value)
                                                    }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.routeStart}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("routeStart")}>
                                                    Пункт отправки {sortField === 'routeStart' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                                <Input type="text" value={filters.routeStart} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("routeStart", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead
                                                hidden={hideStatus.routeEnd}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("routeEnd")}>
                                                    Пункт назначения {sortField === 'routeEnd' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.routeEnd} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("routeEnd", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.cargo}
                                                className="min-w-[80px] cursor-pointer">
                                                <div onClick={() => handleSort("cargo")}>
                                                    Груз {sortField === 'cargo' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                                <Input type="text" value={filters.cargo} className="bg-white min-w-[100px]" 
                                                            onChange={(e) => {
                                                                handleFilterChange("cargo", e.target.value)
                                                            }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.loadDate}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("loadDate")}>
                                                    Дата загрузки {sortField === 'loadDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                                <Popover open={rowMenuModals.calendar} onOpenChange={(open) => 
                                                    setRowMenuModal(x => ({...x, calendar: open}))}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[150px] justify-start text-left font-normal",
                                                            !date && "text-muted-foreground"
                                                        )}
                                                        >
                                                        <CalendarIcon />
                                                        {date ? format(date, "PPP") : <span>Выберите дату</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={(selectedDate) => {
                                                            setDate(selectedDate ?? undefined)
                                                            handleFilterChange(
                                                                "loadDate",
                                                                selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                                                            )
                                                            setRowMenuModal(x => ({...x, calendar: false}))
                                                        }}
                                                        initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </TableHead>
                                            {/* <TableHead hidden={hideStatus.sumOnClient}>Сумма на Клиента
                                                <Input type="text" value={filters.sumOnClient} className="bg-white" 
                                                            onChange={(e) => {
                                                                handleFilterChange("sumOnClient", e.target.value)
                                                            }}/>
                                            </TableHead> */}
                                            <TableHead 
                                                hidden={hideStatus.brutto}
                                                className="min-w-[80px]">Брутто $
                                                <Input type="text" value={filters.brutto} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("brutto", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.netto}
                                                className="min-w-[80px]">Нетто $
                                                <Input type="text"  value={filters.netto}className="bg-white" 
                                                            onChange={(e) => {
                                                                handleFilterChange("netto", e.target.value)
                                                            }}/>
                                            </TableHead>
                                            <TableHead hidden={hideStatus.kn}>КН
                                                <Input type="number" value={filters.kn || ''} className="bg-white min-w-[100px]" 
                                                            onChange={(e) => {
                                                                handleFilterChange("kn", e.target.value)
                                                            }}/>
                                            </TableHead>
                                            <TableHead hidden={hideStatus.profit}>Профит
                                            <Input type="number" value={filters.profit} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("profit", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.vehicle}>
                                                ТС {sortField === 'vehicle' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            <Input type="text" value={filters.vehicle} className="bg-white min-w-[120px]" 
                                                        onChange={(e) => {
                                                            handleFilterChange("vehicle", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.orderID}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("orderID")}>
                                                    Сделка {sortField === 'orderID' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.orderID} className="bg-white min-w-[120px]" 
                                                        onChange={(e) => {
                                                            handleFilterChange("orderID", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.applicationID}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("applicationID")}>
                                                    Номер заявки {sortField === 'applicationID' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.applicationID} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("applicationID", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.expeditor}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("expeditor")}>
                                                    Экспедитор {sortField === 'expeditor' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                                <Input type="text" value={filters.expeditor} className="bg-white" 
                                                            onChange={(e) => {
                                                                handleFilterChange("expeditor", e.target.value)
                                                            }}/>
                                            </TableHead>
                                            <TableHead hidden={hideStatus.contractorInvoice}>Счет подрядчика
                                            <Input type="text" value={filters.contractorInvoice} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("contractorInvoice", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                hidden={hideStatus.contractor}
                                                className="cursor-pointer">
                                                <div onClick={() => handleSort("contractor")}>
                                                    Подрядчик {sortField === 'contractor' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                </div>
                                            <Input type="text" value={filters.contractor} className="bg-white" 
                                                        onChange={(e) => {
                                                            handleFilterChange("contractor", e.target.value)
                                                        }}/>
                                            </TableHead>
                                            <TableHead 
                                                    hidden={hideStatus.contractorLegalEntity}
                                                    className="cursor-pointer">
                                                    <div onClick={() => handleSort("contractorLegalEntity")}>
                                                        ЮЛ Подрядчика {sortField === 'contractorLegalEntity' && (sortDirection === 'asc' ? '↑' : '↓')}
                                                    </div>
                                                <Input type="text" value={filters.contractorLegalEntity} className="bg-white" 
                                                            onChange={(e) => {
                                                                handleFilterChange("contractorLegalEntity", e.target.value)
                                                            }}/>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.filter(x => !x.toDelete).map(order => {
                                            return (
                                                <Dialog key={order.id}>
                                                    <ContextMenu key={order.id} modal={false}>
                                                        <ContextMenuTrigger asChild>
                                                            <TableRow 
                                                                onMouseDown={(e) => { if (e.ctrlKey) e.preventDefault(); }}
                                                                onClick={(e) => {
                                                                    if (!e.ctrlKey) return;
                                                                    setSelectedRows(prev => {
                                                                        const newSet = new Set(prev);
                                                                        const currentIndex = filteredOrders.findIndex(o => o.id === order.id);

                                                                        if (e.shiftKey && lastSelectedIndex !== null) {
                                                                            // Select range between lastSelectedIndex and currentIndex
                                                                            const [start, end] = [lastSelectedIndex, currentIndex].sort((a, b) => a - b);
                                                                            for (let i = start; i <= end; i++) {
                                                                                newSet.add(filteredOrders[i].id);
                                                                            }
                                                                        } else if (e.ctrlKey || e.metaKey) {
                                                                        // Ctrl/Cmd + click toggles selection of clicked row only
                                                                            if (newSet.has(order.id)) {
                                                                                newSet.delete(order.id);
                                                                            } else {
                                                                                newSet.add(order.id);
                                                                            }
                                                                            setLastSelectedIndex(currentIndex);
                                                                        } else {
                                                                        // Simple click selects only clicked row
                                                                            newSet.clear();
                                                                            newSet.add(order.id);
                                                                            setLastSelectedIndex(currentIndex);
                                                                        }
                                                                        return newSet;
                                                                    });
                                                                }}>
                                                                <TableCell hidden={hideStatus.id} className="font-medium"
                                                                    variant = {order.cancelled ? "cancelled" 
                                                                        : selectedRows.has(order.id) ? "selected"
                                                                        : "default"}   
                                                                >{order.id}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : order.foreignOrder ? "foreignOrder"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.client}>{order.client}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.clientManager}>{order.clientManager}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.client_sLegalEntity}>{order.client_sLegalEntity}</TableCell>
                                                                <TableCell 
                                                                    hidden={hideStatus.routeStart}
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }>
                                                                    {order.routeStart}</TableCell>

                                                                {!hideStatus.routeEnd && (
                                                                    order.transshipmentPoint ? (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <TableCell hidden={hideStatus.routeEnd}
                                                                                        variant = {
                                                                                            selectedRows.has(order.id) ? "selected"
                                                                                            : order.cancelled ? "cancelled"
                                                                                            : `default`
                                                                                        }>
                                                                                        {order.routeEnd}</TableCell>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Пункт перегруза: {order.transshipmentPoint}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : (
                                                                        <TableCell hidden={hideStatus.routeEnd}
                                                                            variant = {
                                                                                selectedRows.has(order.id) ? "selected"
                                                                                : order.cancelled ? "cancelled"
                                                                                : `default`
                                                                            }>
                                                                            {order.routeEnd}</TableCell>
                                                                    )
                                                                )}

                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.cargo}>{
                                                                    order.cargoType === "Сборный" ? `${order.cargo} (Сборный)` : order.cargo}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.loadDate}>{format(order.loadDate!, "dd-MM-yyyy")}</TableCell>

                                                                {order.sumOnClient ? (
                                                                    <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <TableCell 
                                                                                variant = {
                                                                                    selectedRows.has(order.id) ? "selected"
                                                                                    : order.cancelled ? "cancelled"
                                                                                    : order.needToChangeBrutto ? "needToChange"
                                                                                    : "default"
                                                                                }
                                                                                hidden={hideStatus.brutto}>{order.brutto}</TableCell>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Сумма на клиента: {order.sumOnClient}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                ) : (<TableCell 
                                                                        variant = {
                                                                            selectedRows.has(order.id) ? "selected"
                                                                            : order.cancelled ? "cancelled"
                                                                            : order.needToChangeBrutto ? "needToChange"
                                                                            : "default"
                                                                        }
                                                                        hidden={hideStatus.brutto}>{order.brutto}</TableCell>)}
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : order.needToChangeNetto ? "needToChange"
                                                                        : "default"
                                                                    }
                                                                    hidden={hideStatus.netto}>{order.netto}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.kn}>{order.kn}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.profit}>{order.profit}</TableCell>

                                                                <TableCell hidden={hideStatus.vehicle} 
                                                                    variant = {selectedRows.has(order.id)
                                                                        ? "selected"
                                                                        : order.cancelled
                                                                        ? "cancelled"
                                                                        : order.needToChangeVehicle ? "needToChange"
                                                                        : "default"}
                                                                >{order.vehicle}</TableCell>
                                                                <TableCell hidden={hideStatus.orderID} 
                                                                    variant = {selectedRows.has(order.id)
                                                                        ? "selected"
                                                                        : order.cancelled
                                                                        ? "cancelled"
                                                                        : order.orderStatus === "confirmed"
                                                                        ? "confirmed"
                                                                        : order.orderStatus === "finished"
                                                                        ? "finished"
                                                                        : "default"}
                                                                >{order.orderID}</TableCell>
                                                                <TableCell hidden={hideStatus.applicationID} 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : order.applicationAttached ? "finished"
                                                                        : "default"
                                                                    }
                                                                >{order.applicationID}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.expeditor}>{order.expeditor}</TableCell>
                                                                <TableCell hidden={hideStatus.contractorInvoice} 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : order.contractorInvoiceSent ? "finished"
                                                                        : "default"
                                                                    }
                                                                >{order.contractorInvoice}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                            selectedRows.has(order.id) ? "selected"
                                                                            : order.cancelled ? "cancelled"
                                                                            : `default`
                                                                        }
                                                                    hidden={hideStatus.contractor} >{order.contractor}</TableCell>
                                                                <TableCell 
                                                                    variant = {
                                                                        selectedRows.has(order.id) ? "selected"
                                                                        : order.cancelled ? "cancelled"
                                                                        : `default`
                                                                    }
                                                                    hidden={hideStatus.contractorLegalEntity}>{order.contractorLegalEntity}</TableCell>
                                                            </TableRow>
                                                        </ContextMenuTrigger>
                                                        <ContextMenuContent>
                                                            <DialogTrigger asChild>
                                                                <ContextMenuItem onClick={() => {
                                                                    requestSpecificOrder(order.id)
                                                                    setSelectedOrder(order)
                                                                    setRowMenuModal(prevValues => ({...prevValues, additionalInformation: true}))
                                                                }}>
                                                                Дополнительная информация</ContextMenuItem>
                                                            </DialogTrigger>

                                                            {userInfo?.role !== "Viewer" && (
                                                                <ContextMenuItem
                                                                    onClick={() => addCopiedOrder(order)}
                                                                >Копировать сделку</ContextMenuItem>
                                                            )}

                                                            <ContextMenuSub>
                                                                    <ContextMenuSubTrigger>Скопировать значения</ContextMenuSubTrigger>
                                                                    <ContextMenuSubContent>
                                                                        <ContextMenuItem
                                                                            onClick={async () => await copyValues(["vehicle"])}
                                                                        >Машин</ContextMenuItem>
                                                                        <ContextMenuItem
                                                                            onClick={async () => await copyValues(["orderID"])}
                                                                        >Сделок</ContextMenuItem>
                                                                        <ContextMenuItem
                                                                            onClick={async () => await copyValues(["contractorInvoice"])}
                                                                        >Счета подрядчика</ContextMenuItem>
                                                                        <ContextMenuItem
                                                                            onClick={async () => await copyValues(["vehicle", "orderID"])}
                                                                        >Машин и сделок</ContextMenuItem>
                                                                        <ContextMenuItem
                                                                            onClick={async () => await copyValues(["orderID", "contractorInvoice"])}
                                                                        >Сделок и счетов подрядчика</ContextMenuItem>
                                                                    </ContextMenuSubContent>
                                                            </ContextMenuSub>
                                                            

                                                            {userInfo?.role !== "Viewer" && (
                                                                <ContextMenuItem onClick={() => {
                                                                    requestSpecificOrder(order.id)
                                                                    setRowMenuModal(prevValues => ({...prevValues, change: true}))}}>
                                                                Изменить</ContextMenuItem>
                                                            )}
                                                            

                                                            {userInfo?.role !== "Viewer" && order.orderStatus !== "empty" && 
                                                            (order.orderID ?? '').trim() !== '' && (
                                                                <ContextMenuItem onClick={() => {
                                                                    changeSpecificField(order.id, "orderStatus", order.orderStatus === "empty" ? "created"
                                                                        : order.orderStatus === "created" ? "confirmed"
                                                                        : order.orderStatus === "confirmed" ? "finished"
                                                                        : "created")
                                                                }}>
                                                                    {order.orderStatus === "created" ? "Подтведить сделку" :
                                                                    order.orderStatus === "confirmed" ? "Счет прикреплен" :
                                                                    "Обнулить сделку"}   
                                                                </ContextMenuItem>
                                                            )}
                                                            {userInfo?.role !== "Viewer" && order.applicationID && order.applicationID.trim() !== '' && (
                                                                <ContextMenuItem onClick={() => {
                                                                    changeSpecificField(order.id, "applicationAttached", !order.applicationAttached)
                                                                }}>
                                                                {order.applicationAttached ? "Отменить прикрепление заявки" : "Прикрепить заявку"}
                                                                </ContextMenuItem>
                                                            )}
                                                            

                                                            {userInfo?.role !== "Viewer" && order.contractorInvoice && order.contractorInvoice.trim() !== '' && (
                                                                <ContextMenuItem onClick = {() => {
                                                                    changeSpecificField(order.id, "contractorInvoiceSent", !order.contractorInvoiceSent)
                                                                }}>
                                                                {order.contractorInvoiceSent ? "Отменить счет подрядчика" : "Счет подрядчика отправлен"}
                                                                </ContextMenuItem>
                                                            )}

                                                            {userInfo?.role !== "Viewer" && (
                                                                <ContextMenuSub>
                                                                    <ContextMenuSubTrigger>Вставить ID счета подрядчика</ContextMenuSubTrigger>
                                                                    <ContextMenuSubContent>
                                                                        {contractors.map(x => 
                                                                            <ContextMenuItem onClick={async () => {
                                                                                const temp = await getContractorInvoiceID(x.contractor, false);
                                                                                await applyContractorInfo(order.id, temp, x.contractorName, x.contractorLE)
                                                                            }}>{x.contractorLE} - {x.contractorName}</ContextMenuItem>    
                                                                        )}
                                                                    </ContextMenuSubContent>
                                                                </ContextMenuSub>
                                                            )}

                                                            <ContextMenuItem onClick={() => {
                                                                setRowMenuModal(prevValues => ({...prevValues, history: true}))
                                                                setSelectedOrder(order)
                                                            }}>История изменений</ContextMenuItem>
                                                            
                                                            {userInfo?.role !== "Viewer" && (
                                                                <ContextMenuItem onClick = {() => {
                                                                    changeSpecificField(order.id, "cancelled", !order.cancelled)
                                                                }}>
                                                                {order.cancelled ? "Восстановить сделку" : "Отменить сделку"}
                                                                </ContextMenuItem>
                                                            )}

                                                            {userInfo?.role !== "Viewer" && (
                                                                <ContextMenuItem 
                                                                    // className="focus:bg-red-500 focus:text-white"
                                                                    variant="destructive"
                                                                    onClick={() => changeSpecificField(order.id, "toDelete", !order.toDelete)}
                                                                >Запросить удаление</ContextMenuItem>
                                                            )}
                                                        </ContextMenuContent>
                                                    </ContextMenu>
                                                </Dialog>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal"/>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            <Dialog open={rowMenuModals.RU_EN} onOpenChange={(isOpen) => {
                setRowMenuModal((x) => ({...x, RU_EN: isOpen}));
                setRU_ENValue({ru: '', en: ''})
            }}>
                <DialogContent className="min-w-[400px] max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {RU_ENSection === "city" ? "Укажите название города на русском и английском языках"
                            : "Укажите название груза на русском и английском языках"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="grid space-y-3">
                        <Input 
                            className="text-black"
                            type="text"
                            placeholder="На русском..."
                            value={RU_ENValue.ru}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^[\u0400-\u04FF\s\-]*$/.test(value)) {
                                setRU_ENValue((x) => ({ ...x, ru: value }));
                                }
                            } }/>
                        <Input 
                            className="text-black"
                            type="text"
                            placeholder="On english..."
                            value={RU_ENValue.en}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow only Latin letters and spaces
                                if (/^[a-zA-Z\s\-]*$/.test(value)) {
                                setRU_ENValue((x) => ({ ...x, en: value }));
                                }
                            }}/>
                        <Button onClick={() => {
                            addNewOrderStaticFieldValue(RU_ENSection!, RU_ENValue.ru, RU_ENValue.en);
                            setRowMenuModal((x) => ({...x, RU_EN: false}));
                            setRU_ENValue({ru: '', en: ''})
                        }}>Добавить</Button>
                    </DialogDescription>
                </DialogContent>
            </Dialog>
            
            <UpdateCardDialog
                open={rowMenuModals.change}
                onOpenChange={(isOpen) => {
                    setRowMenuModal((x) => ({...x, change: isOpen}))
                    setUpdateOrder(updateOrderDefault);
                }}
                monthOrders={orders[getMM_YYYY(updateOrder.loadDate!)] ?? []}
                contractors={contractors}
                initialData={updateOrder}
                onSubmit={sendUpdatedOrder}
            />

            <DialogAdditionalInformation 
                modalOpenStatus={rowMenuModals.additionalInformation}
                changeOpenStatus={(isOpen) => setRowMenuModal((x) => ({...x, additionalInformation: isOpen}))}
                order={selectedOrder}
            />

            <ChangesHistoryDialog 
                open={rowMenuModals.history}
                onOpenChange={(isOpen) => setRowMenuModal((x) => ({...x, history: isOpen}))}
                id={selectedOrder.id}
                token={token || undefined}
            />
        </div>
)}
