
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Transaction, AppContextType, TransactionType, 
    Bill, BillStatus, Customer, Account, Invoice, 
    AccountType, PaymentReceipt, PaymentVoucher, CompanyInfo, Supplier, Employee, JournalEntry, User, UserRole, SelectableAccount, EntityType, JournalEntryLine, PurchaseReturn, SalesReturn, Language, TranslationKeys, RecurringTransaction, FixedAsset, Reconciliation, Budget, View, Timesheet, AccruedExpense, AppState, SaveState, CostCenter, Product
} from '../types';
import { translations } from '../translations';

const AppContext = createContext<any>(undefined);

const STORAGE_KEY = 'swk-accounting-data';

const generateUniqueId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const initialAccounts: Account[] = [
    { id: 'asset-1', name: 'الأصول', type: AccountType.ASSET, parentId: null, balance: 0, accountNumber: '1' },
    { id: 'asset-cash', name: 'النقدية', type: AccountType.ASSET, parentId: 'asset-1', balance: 15000, accountNumber: '1101' },
    { id: 'asset-petty-cash', name: 'صندوق المصاريف النثرية', type: AccountType.ASSET, parentId: 'asset-1', balance: 500, accountNumber: '1104' },
    { id: 'asset-bank-1', name: 'البنك الأهلي المصري', type: AccountType.ASSET, parentId: 'asset-1', balance: 50000, accountNumber: '1102', iban: 'EG38000100020000000001234567890' },
    { id: 'asset-bank-2', name: 'بنك مصر', type: AccountType.ASSET, parentId: 'asset-1', balance: 120000, accountNumber: '1103', iban: 'EG38000200010000000000987654321' },
    { id: 'asset-receivables', name: 'العملاء (الذمم المدينة)', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1201' },
    { id: 'asset-emp-advances', name: 'سلف الموظفين', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1202' },
    { id: 'asset-prepaid', name: 'مصروفات مدفوعة مقدماً', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1301' },
    { id: 'asset-inventory', name: 'المخزون (الأصول المتداولة)', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1600' },
    { id: 'asset-fixed', name: 'الأصول الثابتة', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1400' },
    { id: 'asset-accum-dep', name: 'مجمع الإهلاك', type: AccountType.ASSET, parentId: 'asset-1', balance: 0, accountNumber: '1500' },
    { id: 'lia-1', name: 'الالتزامات', type: AccountType.LIABILITY, parentId: null, balance: 0, accountNumber: '2' },
    { id: 'lia-payables', name: 'الموردون (الذمم الدائنة)', type: AccountType.LIABILITY, parentId: 'lia-1', balance: 0, accountNumber: '2101' },
    { id: 'lia-accrued-exp', name: 'مصروفات مستحقة', type: AccountType.LIABILITY, parentId: 'lia-1', balance: 0, accountNumber: '2201' },
    { id: 'lia-accrued-salaries', name: 'رواتب مستحقة', type: AccountType.LIABILITY, parentId: 'lia-1', balance: 0, accountNumber: '2202' },
    { id: 'rev-1', name: 'الإيرادات', type: AccountType.REVENUE, parentId: null, balance: 0, accountNumber: '4' },
    { id: 'rev-sales', name: 'إيرادات المبيعات', type: AccountType.REVENUE, parentId: 'rev-1', balance: 0, accountNumber: '4101' },
    { id: 'rev-services', name: 'إيرادات خدمات', type: AccountType.REVENUE, parentId: 'rev-1', balance: 0, accountNumber: '4102' },
    { id: 'rev-misc', name: 'إيرادات متنوعة', type: AccountType.REVENUE, parentId: 'rev-1', balance: 0, accountNumber: '4103' },
    { id: 'exp-1', name: 'المصروفات', type: AccountType.EXPENSE, parentId: null, balance: 0, accountNumber: '5' },
    { id: 'exp-cogs', name: 'تكلفة البضاعة المباعة', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5000' },
    { id: 'exp-rent', name: 'إيجار', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5101' },
    { id: 'exp-utilities', name: 'فواتير ومنافع', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5102' },
    { id: 'exp-salaries', name: 'رواتب وأجور', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5103' },
    { id: 'exp-dep', name: 'مصروف الإهلاك', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5201' },
    { id: 'exp-misc', name: 'مصروفات متنوعة', type: AccountType.EXPENSE, parentId: 'exp-1', balance: 0, accountNumber: '5104' },
    { id: 'eq-1', name: 'حقوق الملكية', type: AccountType.EQUITY, parentId: null, balance: 0, accountNumber: '3' },
    { id: 'eq-capital', name: 'رأس المال', type: AccountType.EQUITY, parentId: 'eq-1', balance: 0, accountNumber: '3101' },
    { id: 'eq-drawings', name: 'المسحوبات الشخصية', type: AccountType.EQUITY, parentId: 'eq-1', balance: 0, accountNumber: '3201' },
];

const initialCompanyInfo: CompanyInfo = {
    name: 'سويك للمحاسبة',
    address: 'شارع المحاسب، الكويت',
    logo: '',
    standardWorkHours: 8,
    overtimeRate: 1.5,
};

const initialUsers: User[] = [{ id: 'user-admin-default', username: 'admin', password: 'admin', role: UserRole.ADMIN }];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);
    const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
    const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
    const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [accruedExpenses, setAccruedExpenses] = useState<AccruedExpense[]>([]);
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [language, setLanguage] = useState<Language>('ar');
    const [currency, setCurrency] = useState<string>('KWD');
    const [saveState, setSaveState] = useState<SaveState>(SaveState.IDLE);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installApp = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const appState: AppState = useMemo(() => ({
        transactions, bills, customers, suppliers, accounts, invoices, paymentReceipts, 
        paymentVouchers, companyInfo, employees, journalEntries, purchaseReturns, salesReturns,
        recurringTransactions, fixedAssets, reconciliations, budgets, users, currentUser, language, currency,
        accruedExpenses, timesheets, costCenters, products,
    }), [
        transactions, bills, customers, suppliers, accounts, invoices, paymentReceipts, 
        paymentVouchers, companyInfo, employees, journalEntries, purchaseReturns, salesReturns,
        recurringTransactions, fixedAssets, reconciliations, budgets, users, currentUser, language, currency,
        accruedExpenses, timesheets, costCenters, products
    ]);

    const stateRef = useRef(appState);
    useEffect(() => {
        stateRef.current = appState;
    }, [appState]);

    const _loadStateFromData = useCallback((loadedState: Partial<AppState>) => {
        setTransactions(loadedState.transactions || []);
        setBills(loadedState.bills || []);
        setCustomers(loadedState.customers || []);
        setSuppliers(loadedState.suppliers || []);
        setAccounts(loadedState.accounts || initialAccounts);
        setInvoices(loadedState.invoices || []);
        setPaymentReceipts(loadedState.paymentReceipts || []);
        setPaymentVouchers(loadedState.paymentVouchers || []);
        setCompanyInfo({ ...initialCompanyInfo, ...(loadedState.companyInfo || {}) });
        setEmployees(loadedState.employees || []);
        setJournalEntries(loadedState.journalEntries || []);
        setPurchaseReturns(loadedState.purchaseReturns || []);
        setSalesReturns(loadedState.salesReturns || []);
        setRecurringTransactions(loadedState.recurringTransactions || []);
        setFixedAssets(loadedState.fixedAssets || []);
        setReconciliations(loadedState.reconciliations || []);
        setBudgets(loadedState.budgets || []);
        setAccruedExpenses(loadedState.accruedExpenses || []);
        setTimesheets(loadedState.timesheets || []);
        setCostCenters(loadedState.costCenters || []);
        setProducts(loadedState.products || []);
        setUsers(loadedState.users && loadedState.users.length > 0 ? loadedState.users : initialUsers);
        setLanguage(loadedState.language || 'ar');
        setCurrency(loadedState.currency || 'KWD');
    }, []);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                _loadStateFromData(JSON.parse(savedData));
            } else {
                _loadStateFromData({});
            }
        } catch (error) {
            console.error("Failed to load data", error);
            _loadStateFromData({});
        } finally {
            setIsLoading(false);
        }
    }, [_loadStateFromData]);

    const saveToLocalStorage = useCallback(() => {
        setSaveState(SaveState.SAVING);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
            setTimeout(() => {
                setSaveState(SaveState.SAVED);
                setTimeout(() => setSaveState(SaveState.IDLE), 2000);
            }, 300);
        } catch (error) {
            console.error("Failed to save data", error);
            setSaveState(SaveState.IDLE);
        }
    }, []);

    useEffect(() => {
        if (isLoading) return;
        const handler = setTimeout(() => saveToLocalStorage(), 1000);
        return () => clearTimeout(handler);
    }, [appState, isLoading, saveToLocalStorage]);

    const t = useCallback((key: TranslationKeys): string => translations[language][key] || key, [language]);
    const formatCurrency = useCallback((amount: number) => {
        const locale = language === 'ar' ? 'ar-KW' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    }, [language, currency]);

    const _updateAccountBalance = (accountId: string, amount: number) => {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc));
    };

    const _cleanJournalLines = (lines: any[]): JournalEntryLine[] => {
        return lines.map(line => {
            let accId = line.accountId;
            let entityId = line.entityId;
            let entityType = line.entityType;

            if (accId.startsWith('customer-')) {
                entityId = accId.replace('customer-', '');
                entityType = 'customer';
                accId = 'asset-receivables';
            } else if (accId.startsWith('supplier-')) {
                entityId = accId.replace('supplier-', '');
                entityType = 'supplier';
                accId = 'lia-payables';
            } else if (accId.startsWith('employee-')) {
                entityId = accId.replace('employee-', '');
                entityType = 'employee';
                accId = 'asset-emp-advances';
            } else if (accId.startsWith('account-')) {
                accId = accId.replace('account-', '');
            }

            return {
                ...line,
                accountId: accId,
                entityId: entityId || undefined,
                entityType: entityType || undefined,
                debit: Number(line.debit) || 0,
                credit: Number(line.credit) || 0,
            };
        });
    };

    const deleteJournalEntry = useCallback((id: string) => {
        const entry = stateRef.current.journalEntries.find(je => je.id === id);
        if (entry) {
            entry.lines.forEach(line => {
                const account = stateRef.current.accounts.find(a => a.id === line.accountId);
                if (account) {
                    const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;
                    const change = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                    _updateAccountBalance(line.accountId, -change);
                }
            });
        }
        setJournalEntries(prev => prev.filter(item => item.id !== id));
    }, []);

    const addJournalEntry = useCallback((entry: any) => {
        const cleanedLines = _cleanJournalLines(entry.lines);
        const newEntry: JournalEntry = { 
            ...entry, 
            id: generateUniqueId('je'), 
            entryNumber: entry.entryNumber || `JE-${stateRef.current.journalEntries.length + 1}`,
            lines: cleanedLines
        };
        
        cleanedLines.forEach((line) => {
            const account = stateRef.current.accounts.find(a => a.id === line.accountId);
            if (account) {
                const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;
                const change = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                _updateAccountBalance(line.accountId, change);
            }
        });
        
        setJournalEntries(p => [...p, newEntry]);
        return newEntry;
    }, []);

    const updateJournalEntry = useCallback((entry: JournalEntry) => {
        const oldEntry = stateRef.current.journalEntries.find(je => je.id === entry.id);
        if (oldEntry) {
            oldEntry.lines.forEach(line => {
                const account = stateRef.current.accounts.find(a => a.id === line.accountId);
                if (account) {
                    const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;
                    const change = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                    _updateAccountBalance(line.accountId, -change);
                }
            });
        }

        const cleanedLines = _cleanJournalLines(entry.lines);
        const updatedEntry = { ...entry, lines: cleanedLines };

        cleanedLines.forEach(line => {
            const account = stateRef.current.accounts.find(a => a.id === line.accountId);
            if (account) {
                const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;
                const change = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
                _updateAccountBalance(line.accountId, change);
            }
        });

        setJournalEntries(prev => prev.map(item => item.id === entry.id ? updatedEntry : item));
    }, []);

    const addTransaction = useCallback((tx: any) => {
        const id = generateUniqueId('t');
        let lines: any[] = [];
        
        if (tx.type === TransactionType.EXPENSE) {
            lines = [
                { accountId: tx.accountId, debit: tx.amount, credit: 0, description: tx.description },
                { accountId: `account-${tx.assetAccountId}`, debit: 0, credit: tx.amount, description: tx.description }
            ];
        } else if (tx.type === TransactionType.INCOME) {
            lines = [
                { accountId: `account-${tx.assetAccountId}`, debit: tx.amount, credit: 0, description: tx.description },
                { accountId: tx.accountId, debit: 0, credit: tx.amount, description: tx.description }
            ];
        } else if (tx.type === TransactionType.TRANSFER) {
            lines = [
                { accountId: `account-${tx.toAssetAccountId}`, debit: tx.amount, credit: 0, description: tx.description },
                { accountId: `account-${tx.assetAccountId}`, debit: 0, credit: tx.amount, description: tx.description }
            ];
        }

        const je = addJournalEntry({
            date: tx.date,
            description: tx.description,
            lines: lines
        });

        setTransactions(p => [...p, { ...tx, id, journalEntryId: je.id }]);
    }, [addJournalEntry]);

    const updateTransaction = useCallback((tx: Transaction) => {
        const oldTx = stateRef.current.transactions.find(t => t.id === tx.id);
        if (oldTx && oldTx.journalEntryId) {
            let lines: any[] = [];
            if (tx.type === TransactionType.EXPENSE) {
                lines = [
                    { accountId: tx.accountId, debit: tx.amount, credit: 0, description: tx.description },
                    { accountId: `account-${tx.assetAccountId}`, debit: 0, credit: tx.amount, description: tx.description }
                ];
            } else if (tx.type === TransactionType.INCOME) {
                lines = [
                    { accountId: `account-${tx.assetAccountId}`, debit: tx.amount, credit: 0, description: tx.description },
                    { accountId: tx.accountId, debit: 0, credit: tx.amount, description: tx.description }
                ];
            } else if (tx.type === TransactionType.TRANSFER) {
                lines = [
                    { accountId: `account-${tx.toAssetAccountId}`, debit: tx.amount, credit: 0, description: tx.description },
                    { accountId: `account-${tx.assetAccountId}`, debit: 0, credit: tx.amount, description: tx.description }
                ];
            }

            updateJournalEntry({
                id: oldTx.journalEntryId,
                entryNumber: '', // will be handled by updateJournalEntry
                date: tx.date,
                description: tx.description,
                lines: lines.map(l => ({...l, id: generateUniqueId('jel')}))
            });
        }
        setTransactions(p => p.map(t => t.id === tx.id ? tx : t));
    }, [updateJournalEntry]);

    const _sendSystemNotification = useCallback((title: string, body: string) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/vite.svg' });
        }
    }, []);

    const _updateProductStock = useCallback((productId: string, quantityChange: number, costChange?: number) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const newStock = p.currentStock + quantityChange;
                if (quantityChange < 0 && newStock <= p.reorderPoint) {
                    const title = language === 'ar' ? 'تنبيه انخفاض المخزون' : 'Low Stock Warning';
                    const body = language === 'ar' 
                        ? `المنتج "${p.name}" وصل إلى كمية ${newStock}. يرجى مراجعة الطلبيات.` 
                        : `Product "${p.name}" reached stock level ${newStock}. Please reorder soon.`;
                    _sendSystemNotification(title, body);
                }
                let newCost = p.unitCost;
                if (costChange !== undefined && quantityChange > 0) {
                   newCost = ((p.currentStock * p.unitCost) + (quantityChange * costChange)) / (newStock || 1);
                }
                return { ...p, currentStock: newStock, unitCost: newCost };
            }
            return p;
        }));
    }, [language, _sendSystemNotification]);

    const addInvoice = useCallback((invoiceData: any) => {
        const id = generateUniqueId('inv');
        let customerId = invoiceData.customerId;

        if (!customerId && invoiceData.customerName) {
            const existingCustomer = stateRef.current.customers.find(c => 
                c.name.trim().toLowerCase() === invoiceData.customerName.trim().toLowerCase()
            );
            
            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const newCustId = generateUniqueId('c');
                setCustomers(prev => [...prev, { id: newCustId, name: invoiceData.customerName, email: '', phone: '' }]);
                customerId = newCustId;
            }
        }

        const total = invoiceData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const invoice: Invoice = {
            ...invoiceData,
            id,
            customerId,
            totalAmount: total,
            paidAmount: invoiceData.isCash ? total : 0,
        };

        const assetAccId = invoiceData.isCash ? invoiceData.assetAccountId : 'asset-receivables';
        const je = addJournalEntry({
            date: invoice.issueDate,
            description: `فاتورة مبيعات #${invoice.invoiceNumber}`,
            lines: [
                { id: generateUniqueId('jel'), accountId: `account-${assetAccId}`, debit: total, credit: 0, description: `مبيعات للعميل ${invoiceData.customerName || customerId}`, entityId: customerId, entityType: 'customer' },
                { id: generateUniqueId('jel'), accountId: `account-${invoice.revenueAccountId}`, debit: 0, credit: total, description: `مبيعات فاتورة #${invoice.invoiceNumber}` },
            ]
        });

        invoice.items.forEach((item: any) => {
            if (item.productId) {
                _updateProductStock(item.productId, -item.quantity);
                const product = stateRef.current.products.find(p => p.id === item.productId);
                if (product) {
                    const cogsAmount = item.quantity * product.unitCost;
                    addJournalEntry({
                        date: invoice.issueDate,
                        description: `تكلفة بضاعة مباعة - فاتورة #${invoice.invoiceNumber}`,
                        lines: [
                            { id: generateUniqueId('jel'), accountId: 'account-exp-cogs', debit: cogsAmount, credit: 0, description: `COGS: ${product.name}` },
                            { id: generateUniqueId('jel'), accountId: 'account-asset-inventory', debit: 0, credit: cogsAmount, description: `خروج من المخزن: ${product.name}` },
                        ]
                    });
                }
            }
        });

        setInvoices(prev => [...prev, invoice]);
    }, [addJournalEntry, _updateProductStock]);

    const deleteInvoice = useCallback((id: string) => {
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        // 1. Reverse accounting impact
        const relatedJEs = stateRef.current.journalEntries.filter(je => je.description.includes(`#${inv.invoiceNumber}`));
        relatedJEs.forEach(je => deleteJournalEntry(je.id));

        // 2. Return products to stock
        inv.items.forEach(item => { if (item.productId) _updateProductStock(item.productId, item.quantity); });

        setInvoices(prev => prev.filter(i => i.id !== id));
    }, [invoices, _updateProductStock, deleteJournalEntry]);

    const addBill = useCallback((billData: any) => {
        const id = generateUniqueId('bill');
        let supplierId = billData.supplierId;

        if (!supplierId && billData.supplierName) {
            const existingSupplier = stateRef.current.suppliers.find(s => 
                s.name.trim().toLowerCase() === billData.supplierName.trim().toLowerCase()
            );

            if (existingSupplier) {
                supplierId = existingSupplier.id;
            } else {
                const newSuppId = generateUniqueId('s');
                setSuppliers(prev => [...prev, { id: newSuppId, name: billData.supplierName, email: '', phone: '' }]);
                supplierId = newSuppId;
            }
        }

        const total = billData.items ? billData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0) : billData.amount;
        const bill: Bill = {
            ...billData,
            id,
            supplierId,
            amount: total,
            paidAmount: billData.isCash ? total : 0,
            status: billData.isCash ? BillStatus.PAID : BillStatus.UNPAID,
        };

        const creditAccId = billData.isCash ? billData.assetAccountId : 'lia-payables';
        const debitAccId = billData.items ? 'asset-inventory' : bill.accountId;

        addJournalEntry({
            date: bill.billDate,
            description: `فاتورة مشتريات #${bill.billNumber || '---'} من ${billData.supplierName || 'مورد'}`,
            lines: [
                { id: generateUniqueId('jel'), accountId: `account-${debitAccId}`, debit: total, credit: 0, description: bill.name, costCenterId: bill.costCenterId },
                { id: generateUniqueId('jel'), accountId: `account-${creditAccId}`, debit: 0, credit: total, description: `مستحقات فاتورة #${bill.billNumber || 'N/A'}`, entityId: supplierId, entityType: 'supplier' },
            ]
        });

        if (bill.items) {
            bill.items.forEach(item => {
                if (item.productId) {
                    _updateProductStock(item.productId, item.quantity, item.unitCost);
                }
            });
        }

        setBills(prev => [...prev, bill]);
    }, [addJournalEntry, _updateProductStock]);

    const deleteBill = useCallback((id: string) => {
        const bill = bills.find(b => b.id === id);
        if (!bill) return;

        // 1. Reverse accounting impact
        const relatedJEs = stateRef.current.journalEntries.filter(je => je.description.includes(`#${bill.billNumber || bill.name}`));
        relatedJEs.forEach(je => deleteJournalEntry(je.id));

        // 2. Adjust stock
        if (bill.items) {
            bill.items.forEach(item => { if (item.productId) _updateProductStock(item.productId, -item.quantity); });
        }
        setBills(prev => prev.filter(b => b.id !== id));
    }, [bills, _updateProductStock, deleteJournalEntry]);

    const addPaymentVoucher = useCallback((voucherData: any) => {
        const id = generateUniqueId('pv');
        const voucherNumber = `PAY-${stateRef.current.paymentVouchers.length + 101}`;
        const numericAmount = Number(voucherData.amount);
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
            console.error("Invalid voucher amount", voucherData.amount);
            return;
        }

        let debitAccountId = voucherData.accountId;
        if (!debitAccountId.startsWith('account-') && !debitAccountId.startsWith('supplier-') && !debitAccountId.startsWith('employee-') && !debitAccountId.startsWith('customer-')) {
            debitAccountId = `account-${debitAccountId}`;
        }

        const je = addJournalEntry({
            date: voucherData.date,
            description: voucherData.description,
            lines: [
                { id: generateUniqueId('jel'), accountId: debitAccountId, debit: numericAmount, credit: 0, description: voucherData.description, entityId: voucherData.payeeId, entityType: voucherData.payeeType || 'supplier' },
                { id: generateUniqueId('jel'), accountId: `account-${voucherData.assetAccountId}`, debit: 0, credit: numericAmount, description: voucherData.description },
            ]
        });

        const newVoucher: PaymentVoucher = { ...voucherData, id, amount: numericAmount, voucherNumber, journalEntryId: je.id };
        setPaymentVouchers(prev => [...prev, newVoucher]);

        // NEW: Also create a linked Transaction so it shows in history and for payroll tracking
        const newTransaction: Transaction = {
            id: generateUniqueId('t'),
            date: voucherData.date,
            description: voucherData.description,
            amount: numericAmount,
            type: TransactionType.EXPENSE,
            accountId: voucherData.accountId,
            assetAccountId: voucherData.assetAccountId,
            entityId: voucherData.payeeId,
            entityType: voucherData.payeeType || 'supplier',
            paymentVoucherId: id,
            journalEntryId: je.id,
            payrollMonth: voucherData.payrollMonth,
        };
        setTransactions(prev => [...prev, newTransaction]);

        if (voucherData.billId) {
            setBills(prev => prev.map(bill => 
                bill.id === voucherData.billId ? { ...bill, paidAmount: (bill.paidAmount || 0) + numericAmount } : bill
            ));
        }
        return newVoucher;
    }, [addJournalEntry]);

    const deletePaymentVoucher = useCallback((id: string) => {
        const voucher = paymentVouchers.find(v => v.id === id);
        if (voucher) {
            if (voucher.journalEntryId) deleteJournalEntry(voucher.journalEntryId);
            setTransactions(prev => prev.filter(t => t.paymentVoucherId !== id));
            if (voucher.billId) {
                setBills(prev => prev.map(b => b.id === voucher.billId ? { ...b, paidAmount: Math.max(0, b.paidAmount - voucher.amount) } : b));
            }
        }
        setPaymentVouchers(prev => prev.filter(item => item.id !== id));
    }, [paymentVouchers, deleteJournalEntry]);

    const addPaymentReceipt = useCallback((receiptData: any) => {
        const id = generateUniqueId('pr');
        const receiptNumber = `RCV-${stateRef.current.paymentReceipts.length + 101}`;
        const numericAmount = Number(receiptData.amount);
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
            console.error("Invalid receipt amount", receiptData.amount);
            return;
        }

        let creditAccountId = receiptData.accountId;
        if (!creditAccountId.startsWith('account-') && !creditAccountId.startsWith('customer-') && !creditAccountId.startsWith('supplier-')) {
            creditAccountId = `account-${creditAccountId}`;
        }

        const je = addJournalEntry({
            date: receiptData.date,
            description: receiptData.description,
            lines: [
                { id: generateUniqueId('jel'), accountId: `account-${receiptData.assetAccountId}`, debit: numericAmount, credit: 0, description: receiptData.description },
                { id: generateUniqueId('jel'), accountId: creditAccountId, debit: 0, credit: numericAmount, description: receiptData.description, entityId: receiptData.customerId, entityType: receiptData.partyType || 'customer' },
            ]
        });

        const newReceipt: PaymentReceipt = { ...receiptData, id, amount: numericAmount, receiptNumber, journalEntryId: je.id };
        setPaymentReceipts(prev => [...prev, newReceipt]);

        // NEW: Add transaction link
        const newTransaction: Transaction = {
            id: generateUniqueId('t'),
            date: receiptData.date,
            description: receiptData.description,
            amount: numericAmount,
            type: TransactionType.INCOME,
            accountId: receiptData.accountId,
            assetAccountId: receiptData.assetAccountId,
            entityId: receiptData.customerId,
            entityType: receiptData.partyType || 'customer',
            paymentReceiptId: id,
            journalEntryId: je.id
        };
        setTransactions(prev => [...prev, newTransaction]);

        if (receiptData.invoiceId) {
            setInvoices(prev => prev.map(inv => 
                inv.id === receiptData.invoiceId ? { ...inv, paidAmount: (inv.paidAmount || 0) + numericAmount } : inv
            ));
        }
        return newReceipt;
    }, [addJournalEntry]);

    const deletePaymentReceipt = useCallback((id: string) => {
        const receipt = paymentReceipts.find(r => r.id === id);
        if (receipt) {
            if (receipt.journalEntryId) deleteJournalEntry(receipt.journalEntryId);
            setTransactions(prev => prev.filter(t => t.paymentReceiptId !== id));
            if (receipt.invoiceId) {
                setInvoices(prev => prev.map(inv => inv.id === receipt.invoiceId ? { ...inv, paidAmount: Math.max(0, inv.paidAmount - receipt.amount) } : inv));
            }
        }
        setPaymentReceipts(prev => prev.filter(item => item.id !== id));
    }, [paymentReceipts, deleteJournalEntry]);

    const addSalesReturn = useCallback((srData: any) => {
        const id = generateUniqueId('sr');
        const returnNumber = `SRET-${salesReturns.length + 101}`;
        const invoice = invoices.find(i => i.id === srData.invoiceId);
        const amount = Number(srData.amount);
        
        const returnObj: SalesReturn = { ...srData, id, amount, returnNumber, journalEntryId: '' };

        if (invoice) {
            invoice.items.forEach(item => { if (item.productId) _updateProductStock(item.productId, item.quantity); });
        }

        setSalesReturns(prev => [...prev, returnObj]);
        setInvoices(prev => prev.map(i => i.id === srData.invoiceId ? { ...i, returnedAmount: (i.returnedAmount || 0) + amount } : i));
    }, [invoices, salesReturns, _updateProductStock]);

    const addPurchaseReturn = useCallback((prData: any) => {
        const id = generateUniqueId('pr');
        const returnNumber = `PRET-${purchaseReturns.length + 101}`;
        const bill = bills.find(b => b.id === prData.billId);
        const amount = Number(prData.amount);

        const returnObj: PurchaseReturn = { ...prData, id, amount, returnNumber, journalEntryId: '' };

        if (bill && bill.items) {
            bill.items.forEach(item => { if (item.productId) _updateProductStock(item.productId, -item.quantity); });
        }

        setPurchaseReturns(prev => [...prev, returnObj]);
        setBills(prev => prev.map(b => b.id === prData.billId ? { ...b, returnedAmount: (b.returnedAmount || 0) + amount } : b));
    }, [bills, purchaseReturns, _updateProductStock]);

    const login = useCallback((username, password) => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) { setCurrentUser(user); return true; }
        return false;
    }, [users]);
    
    const contextValue = {
        ...appState,
        isEditing, setIsEditing,
        canEdit: currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT,
        isLoading, saveState, currentView, setCurrentView,
        isInstallable, installApp,
        formatCurrency, t, login, logout: () => setCurrentUser(null),
        handleResetData: () => { if(window.confirm("حذف كل البيانات؟")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } },
        exportData: () => {
            const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        },
        importData: (json: string) => { try { JSON.parse(json); localStorage.setItem(STORAGE_KEY, json); window.location.reload(); } catch(e) { alert("خطأ في الملف"); } },
        saveToLocalStorage,
        getSelectableAccountList: () => {
            const accs = accounts.map(a => ({ value: `account-${a.id}`, label: a.name, type: a.type, disabled: !a.parentId }));
            const custs = customers.map(c => ({ value: `customer-${c.id}`, label: `عميل: ${c.name}`, type: AccountType.ASSET, disabled: false }));
            const supps = suppliers.map(s => ({ value: `supplier-${s.id}`, label: `مورد: ${s.name}`, type: AccountType.LIABILITY, disabled: false }));
            const emps = employees.map(e => ({ value: `employee-${e.id}`, label: `موظف: ${e.name}`, type: AccountType.ASSET, disabled: false }));
            return [...accs, ...custs, ...supps, ...emps];
        },
        addAccount: (a: any) => setAccounts(p => [...p, { ...a, id: generateUniqueId('acc') }]),
        updateAccount: (a: Account) => setAccounts(p => p.map(x => x.id === a.id ? a : x)),
        deleteAccount: (id: string) => setAccounts(p => p.filter(x => x.id !== id)),
        addTransaction,
        updateTransaction,
        deleteTransaction: (id: string) => {
            const tx = stateRef.current.transactions.find(t => t.id === id);
            if (tx) {
                if (tx.journalEntryId) deleteJournalEntry(tx.journalEntryId);
            }
            setTransactions(p => p.filter(x => x.id !== id));
        },
        addCustomer: (c: any) => setCustomers(p => [...p, { ...c, id: generateUniqueId('c') }]),
        updateCustomer: (c: Customer) => setCustomers(p => p.map(x => x.id === c.id ? c : x)),
        deleteCustomer: (id: string) => setCustomers(p => p.filter(x => x.id !== id)),
        addSupplier: (s: any) => setSuppliers(p => [...p, { ...s, id: generateUniqueId('s') }]),
        updateSupplier: (s: Supplier) => setSuppliers(p => p.map(x => x.id === s.id ? s : x)),
        deleteSupplier: (id: string) => setSuppliers(p => p.filter(x => x.id !== id)),
        addEmployee: (e: any) => setEmployees(p => [...p, { ...e, id: generateUniqueId('e') }]),
        updateEmployee: (e: Employee) => setEmployees(p => p.map(x => x.id === e.id ? e : x)),
        deleteEmployee: (id: string) => setEmployees(p => p.filter(x => x.id !== id)),
        addProduct: (prod: any) => setProducts(p => [...p, { ...prod, id: generateUniqueId('prod') }]),
        updateProduct: (prod: Product) => setProducts(p => p.map(x => x.id === prod.id ? prod : x)),
        deleteProduct: (id: string) => setProducts(p => p.filter(x => x.id !== id)),
        addInvoice,
        deleteInvoice,
        deleteInvoices: (ids: string[]) => ids.forEach(id => deleteInvoice(id)),
        addBill,
        deleteBill,
        deleteBills: (ids: string[]) => ids.forEach(id => deleteBill(id)),
        addSalesReturn,
        deleteSalesReturn: (id: string) => setSalesReturns(prev => prev.filter(r => r.id !== id)),
        addPurchaseReturn,
        deletePurchaseReturn: (id: string) => setPurchaseReturns(prev => prev.filter(r => r.id !== id)),
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addTimesheet: (ts: any) => setTimesheets(prev => [...prev, { ...ts, id: generateUniqueId('ts') }]),
        updateTimesheet: (ts: Timesheet) => setTimesheets(prev => prev.map(item => item.id === ts.id ? ts : item)),
        addPaymentVoucher,
        updatePaymentVoucher: (voucher: PaymentVoucher) => setPaymentVouchers(prev => prev.map(item => item.id === voucher.id ? voucher : item)),
        deletePaymentVoucher,
        addPaymentReceipt,
        updatePaymentReceipt: (receipt: PaymentReceipt) => setPaymentReceipts(prev => prev.map(item => item.id === receipt.id ? receipt : item)),
        deletePaymentReceipt,
        deletePayrollPayment: (transaction: Transaction) => {
            setTransactions(prev => prev.filter(t => t.id !== transaction.id));
            if (transaction.paymentVoucherId) deletePaymentVoucher(transaction.paymentVoucherId);
            if (transaction.journalEntryId) deleteJournalEntry(transaction.journalEntryId);
        },
        updateCompanyInfo: (info: any) => setCompanyInfo(p => ({...p, ...info})),
        updateSettings: (s: any) => { if(s.language) setLanguage(s.language); if(s.currency) setCurrency(s.currency); },
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};
