export interface Order {
    id: number;                             
    client: string;                         
    clientManager: string;                  
    client_sLegalEntity?: string | null;    
    routeStart?: string | null;             
    routeEnd?: string | null;   
    transshipmentPoint?: string | null;            
    cargo?: string | null;                  
    tnved?: number | null;                  
    loadDate: string;               
    cooperativeOrder?: string | null;      
    sumOnClient?: string | null;            
    brutto?: string | null;                 
    netto?: string | null;                  
    kn?: number | null;                     
    profit?: string | null;                 
    deliverDateByCMR?: string | null;       
    vehicle?: string | null;                
    orderID?: string | null;                
    applicationID?: string | null;          
    actsAndInvoices?: string | null;        
    expeditor?: string | null;              
    contractorInvoice?: string | null;      
    contractor?: string | null;             
    contractorLegalEntity?: string | null;  
    additionalExpenses?: string | null;
    cancelled: boolean;
    notes?: string | null;
    orderStatus?: string | null;
    applicationAttached: boolean;
    contractorInvoiceSent: boolean;
    needToChangeVehicle: boolean;
    needToChangeBrutto: boolean;
    needToChangeNetto: boolean;
    cargoType: string;
    foreignOrder: boolean,
    client_sInsuranceID?: string | null;
    toDelete: boolean;
    toDeleteRequest?: string | null;
}

export interface HideStatus {
    [key: string]: boolean;
}

// Type for column names
export interface ColumnNames {
    [key: string]: string;
}

export interface UserInfo {
    id: number;
    username: string;
    department: string;
    role: string
}