
import { translations } from "./translations";

export enum AccountType {
  ASSET = 'asset',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  EQUITY = 'equity',
  LIABILITY = 'liability',
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  balance: number; 
  accountNumber?: string;
  iban?: string;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export type EntityType = 'customer' | 'supplier' | 'employee';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 encoded file data
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  accountId?: string; 
  assetAccountId?: string; 
  toAssetAccountId?: string; 
  paymentReceiptId?: string; 
  paymentVoucherId?: string; 
  billId?: string; 
  employeeId?: string; 
  payrollMonth?: string; 
  invoiceId?: string; 
  entityId?: string;
  entityType?: EntityType;
  attachments?: Attachment[];
  journalEntryId?: string;
  costCenterId?: string;
}

export enum BillStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  billDate: string; // YYYY-MM-DD
  status: BillStatus;
  accountId: string; 
  billNumber?: string;
  orderNumber?: string; // NEW: Added order number for purchases
  supplierId?: string;
  paidAmount: number;
  isCash?: boolean;
  assetAccountId?: string;
  returnedAmount?: number;
  attachments?: Attachment[];
  costCenterId?: string;
  // Link to inventory
  items?: { productId: string; quantity: number; unitCost: number }[];
}

export interface Customer {
  id: string;
  customerNumber?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  idNumber?: string;
  idExpirationDate?: string; 
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  idNumber?: string;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string; // Link to inventory
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderNumber?: string; // NEW: Added order number
    customerId: string;
    issueDate: string; 
    items: InvoiceItem[];
    totalAmount: number;
    paidAmount: number;
    revenueAccountId: string;
    isCash?: boolean;
    assetAccountId?: string;
    returnedAmount?: number;
    attachments?: Attachment[];
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  customerId: string; // Used as generic entityId
  partyName: string;   // Added to store the name (Customer/Supplier/Employee)
  partyType: EntityType; // Added to store the type
  amount: number;
  assetAccountId: string;
  accountId: string;
  description: string;
  checkNumber?: string;
  referenceNumber?: string;
  journalEntryId: string;
  invoiceId?: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  payeeName: string;
  payeeId?: string;     // Added for internal linking
  payeeType?: EntityType; // Added for internal linking
  amount: number;
  assetAccountId: string;
  accountId: string;
  description: string;
  checkNumber?: string;
  referenceNumber?: string;
  journalEntryId: string;
  billId?: string;
}

// --- Inventory Types ---
export interface Product {
  id: string;
  sku: string;
  name: string;
  category?: string;
  description?: string;
  unit: string; // e.g., 'Piece', 'KG', 'Box'
  currentStock: number;
  reorderPoint: number;
  unitCost: number; // For valuation
  salePrice: number;
}

export interface CompanyInfo {
    name: string;
    address: string;
    logo: string; 
    standardWorkHours?: number;
    overtimeRate?: number;
}

export interface Employee {
    id: string;
    employeeNumber: string;
    name: string;
    position: string;
    paymentType: 'Salaried' | 'Hourly';
    baseSalary: number;
    hourlyRate: number;
    email: string;
    phone: string;
    address?: string;
    hireDate?: string; 
    terminationDate?: string; 
    bankAccountId?: string;
    iban?: string;
    standardWorkHours?: number;
}

export interface JournalEntryLine {
    id: string;
    accountId: string;
    debit: number;
    credit: number;
    description: string;
    entityId?: string;
    entityType?: EntityType;
    reconciliationId?: string;
    costCenterId?: string;
}

export interface JournalEntry {
    id: string;
    entryNumber: string; 
    date: string; 
    description: string;
    lines: JournalEntryLine[];
    purchaseReturnId?: string;
    salesReturnId?: string;
    attachments?: Attachment[];
}

export interface PurchaseReturn {
    id: string;
    returnNumber: string; 
    date: string; 
    supplierId: string;
    billId: string;
    amount: number;
    assetAccountId?: string; 
    description: string;
    journalEntryId: string; 
    attachments?: Attachment[];
    items?: { productId: string; quantity: number }[];
}

export interface SalesReturn {
    id: string;
    returnNumber: string; 
    date: string; 
    customerId: string;
    invoiceId: string;
    amount: number;
    assetAccountId?: string; 
    description: string;
    journalEntryId: string; 
    attachments?: Attachment[];
    items?: { productId: string; quantity: number }[];
}

export interface AccruedExpense {
  id: string;
  date: string; 
  description: string;
  amount: number;
  expenseAccountId: string;
  liabilityAccountId: string;
  status: 'Accrued' | 'Paid';
  accrualJournalEntryId: string;
  paymentVoucherId?: string | null;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  date: string; 
  checkIn: string | null; 
  checkOut: string | null; 
  isHoliday: boolean;
  isLeave: boolean;
  notes?: string;
}

export interface ChartData {
    name: string;
    دخل: number;
    مصروفات: number;
}

export interface CategoryChartData {
    name: string;
    value: number;
}

export interface SelectableAccount {
  value: string;
  label: string;
  disabled: boolean;
  type: AccountType;
}

export type Language = 'ar' | 'en';
export type TranslationKeys = keyof typeof translations.ar;

export interface CostCenter {
    id: string;
    code?: string;
    name: string;
}

export enum UserRole {
    ADMIN = 'admin',
    ACCOUNTANT = 'accountant',
    VIEWER = 'viewer',
}

export enum SaveState {
  IDLE,
  SAVING,
  SAVED,
}

export interface User {
    id: string;
    username: string;
    password: string; 
    role: UserRole;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  transactionDetails: Omit<Transaction, 'id' | 'date' | 'attachments'>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string; 
  endDate?: string | null; 
  nextDueDate: string; 
  lastGeneratedDate?: string | null; 
}

export interface FixedAsset {
  id: string;
  name: string;
  acquisitionDate: string; 
  acquisitionCost: number;
  usefulLifeYears: number;
  salvageValue: number;
  assetAccountId: string;
  accumulatedDepreciationAccountId: string;
  depreciationExpenseAccountId: string;
  lastDepreciationDate?: string; 
}

export interface Reconciliation {
    id: string;
    accountId: string;
    statementDate: string;
    statementBalance: number;
    createdAt: string;
}

export interface Budget {
  id: string;
  accountId: string; 
  period: string; 
  amount: number;
}

export interface AppState {
    transactions: Transaction[];
    bills: Bill[];
    customers: Customer[];
    suppliers: Supplier[];
    accounts: Account[];
    invoices: Invoice[];
    paymentReceipts: PaymentReceipt[];
    paymentVouchers: PaymentVoucher[];
    companyInfo: CompanyInfo;
    employees: Employee[];
    journalEntries: JournalEntry[];
    purchaseReturns: PurchaseReturn[];
    salesReturns: SalesReturn[];
    recurringTransactions: RecurringTransaction[];
    fixedAssets: FixedAsset[];
    reconciliations: Reconciliation[];
    budgets: Budget[];
    accruedExpenses: AccruedExpense[];
    timesheets: Timesheet[];
    costCenters: CostCenter[];
    products: Product[]; // NEW
    users: User[];
    currentUser: User | null;
    language: Language;
    currency: string;
}

export type View = 'dashboard' | 'sales_dashboard' | 'transactions' | 'ai_assistant' | 'bills' | 'customers' | 'suppliers' | 'chart_of_accounts' | 'invoices' | 'reports' | 'payment_receipts' | 'payment_vouchers' | 'settings' | 'employees' | 'banks' | 'payroll' | 'statements' | 'journal_entries' | 'users' | 'purchase_returns' | 'sales_returns' | 'recurring_transactions' | 'fixed_assets' | 'bank_reconciliation' | 'petty_cash' | 'budgets' | 'payment_history' | 'time_tracking' | 'accrued_expenses' | 'cost_centers' | 'inventory';


export interface AppContextType extends AppState {
    isEditing: boolean;
    canEdit: boolean;
    isLoading: boolean;
    loadingMessage: string;
    saveState: SaveState;
    setLoading: (loading: boolean, message?: string) => void;
    handleResetData: () => void;
    setIsEditing: (isEditing: boolean) => void;
    getSelectableAccountList: () => SelectableAccount[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    addBill: (bill: Omit<Bill, 'id' | 'status' | 'paidAmount'> & { supplierName?: string; isCash?: boolean; assetAccountId?: string; costCenterId?: string; orderNumber?: string }) => void;
    updateBill: (bill: Bill) => void;
    deleteBill: (id: string) => void;
    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    addAccount: (account: Omit<Account, 'id'>) => void;
    updateAccount: (account: Account) => void;
    deleteAccount: (id: string) => void;
    addInvoice: (invoice: Omit<Invoice, 'id' | 'totalAmount' | 'invoiceNumber' | 'paidAmount' | 'customerId'> & { customerId?: string; customerName?: string; invoiceNumber?: string; orderNumber?: string; isCash?: boolean; assetAccountId?: string; }) => void;
    updateInvoice: (invoice: Invoice) => void;
    deleteInvoice: (id: string) => void;
    addPaymentReceipt: (receipt: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'journalEntryId'>) => void;
    updatePaymentReceipt: (receipt: PaymentReceipt) => void;
    deletePaymentReceipt: (id: string) => void;
    addPaymentVoucher: (voucher: Omit<PaymentVoucher, 'id' | 'voucherNumber' | 'journalEntryId'> & { employeeId?: string; payrollMonth?: string; }) => PaymentVoucher;
    updatePaymentVoucher: (voucher: PaymentVoucher) => void;
    deletePaymentVoucher: (id: string) => void;
    updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
    addEmployee: (employee: Omit<Employee, 'id'>) => void;
    updateEmployee: (employee: Employee) => void;
    deleteEmployee: (id: string) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    processPayroll: (employeeIds: string[], assetAccountId: string, payrollMonth: string) => void;
    deletePayrollPayment: (transaction: Transaction) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber'> & { entryNumber?: string }) => JournalEntry;
    updateJournalEntry: (entry: JournalEntry) => void;
    deleteJournalEntry: (id: string) => void;
    addPurchaseReturn: (pr: Omit<PurchaseReturn, 'id' | 'returnNumber' | 'journalEntryId'>) => void;
    updatePurchaseReturn: (pr: PurchaseReturn) => void;
    deletePurchaseReturn: (id: string) => void;
    addSalesReturn: (sr: Omit<SalesReturn, 'id' | 'returnNumber' | 'journalEntryId'>) => void;
    updateSalesReturn: (sr: SalesReturn) => void;
    deleteSalesReturn: (id: string) => void;
    addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id' | 'nextDueDate'>) => void;
    updateRecurringTransaction: (rt: RecurringTransaction) => void;
    deleteRecurringTransaction: (id: string) => void;
    addFixedAsset: (asset: Omit<FixedAsset, 'id'> & { purchaseAccountId: string }) => void;
    updateFixedAsset: (asset: FixedAsset) => void;
    deleteFixedAsset: (id: string) => void;
    addReconciliation: (data: Omit<Reconciliation, 'id' | 'createdAt'> & { lineIds: string[] }) => void;
    undoReconciliation: (reconciliationId: string) => void;
    addBudget: (budget: Omit<Budget, 'id'>) => void;
    updateBudget: (budget: Budget) => void;
    deleteBudget: (id: string) => void;
    addAccruedExpense: (data: Omit<AccruedExpense, 'id' | 'status' | 'accrualJournalEntryId' | 'paymentVoucherId'>) => void;
    payAccruedExpense: (accruedExpenseId: string, paymentData: { assetAccountId: string; date: string; payeeName: string }) => void;
    addTimesheet: (timesheet: Omit<Timesheet, 'id'>) => void;
    updateTimesheet: (timesheet: Timesheet) => void;
    addCostCenter: (cc: Omit<CostCenter, 'id'>) => void;
    updateCostCenter: (cc: CostCenter) => void;
    deleteCostCenter: (id: string) => void;
    // --- Inventory Functions ---
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    updateSettings: (settings: { language?: Language; currency?: string }) => void;
    formatCurrency: (amount: number) => string;
    t: (key: TranslationKeys) => string;
    timeTrackingInitialFilter: { employeeId: string; year: number; month: number } | null;
    setTimeTrackingInitialFilter: (filter: { employeeId: string; year: number; month: number } | null) => void;
    currentView: View;
    setCurrentView: (view: View) => void;
    exportData: () => void;
    importData: (jsonContent: string) => void;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    saveToLocalStorage: () => void;
}
