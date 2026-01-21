
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AIAssistant from './components/AIAssistant';
import Bills from './components/Bills';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Invoices from './components/Invoices';
import ChartOfAccounts from './components/ChartOfAccounts';
import Reports from './components/Reports';
import PaymentReceipts from './components/PaymentReceipts';
import PaymentVouchers from './components/PaymentVouchers';
import Settings from './components/Settings';
import Employees from './components/Employees';
import Banks from './components/Banks';
import Payroll from './components/Payroll';
import Statements from './components/Statements';
import JournalEntries from './components/JournalEntries';
import { Menu, Save, HardDriveDownload, DownloadCloud } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import PurchaseReturns from './components/PurchaseReturns';
import SalesReturns from './components/SalesReturns';
import RecurringTransactions from './components/RecurringTransactions';
import FixedAssets from './components/FixedAssets';
import BankReconciliation from './components/BankReconciliation';
import PettyCash from './components/PettyCash';
import Budgets from './components/Budgets';
import SalesDashboard from './components/SalesDashboard';
import { TranslationKeys, View } from './types';
import PaymentHistory from './components/PaymentHistory';
import TimeTracking from './components/TimeTracking';
import AccruedExpenses from './components/AccruedExpenses';
import GlobalLoader from './components/GlobalLoader';
import Login from './components/Login';
import Users from './components/Users';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import CostCenters from './components/CostCenters';
import Inventory from './components/Inventory';


// Dynamically load PDF export libraries when needed
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    ensurePdfLibsLoaded: () => Promise<void>;
    handlePrint: (elementId: string) => void;
    handleExportCSV: (data: any[], headers: { [key: string]: string }, fileName: string) => void;
  }
}

const loadedScripts: { [src: string]: true } = {};
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (loadedScripts[src]) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      loadedScripts[src] = true;
      resolve();
    };
    script.onerror = (err) => {
        console.error(`Failed to load script: ${src}`, err);
        reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });
};

window.ensurePdfLibsLoaded = async () => {
  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
  ]);
};

// Global Printing Utility
window.handlePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printHtml = printContent.innerHTML;

    // Create a temporary hidden iframe for printing to maintain styles
    const style = Array.from(document.styleSheets)
        .map(styleSheet => {
            try {
                return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            } catch (e) {
                return '';
            }
        }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html dir="${document.documentElement.dir}">
            <head>
                <title>طباعة</title>
                <style>${style}</style>
                <style>
                    @media print { .no-print { display: none !important; } }
                    body { padding: 20px; background: white !important; color: black !important; }
                </style>
            </head>
            <body>${printHtml}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
};

// Global CSV Export Utility (Excel Friendly with Arabic Support)
window.handleExportCSV = (data: any[], headers: { [key: string]: string }, fileName: string) => {
    const headerKeys = Object.keys(headers);
    const headerLabels = Object.values(headers);
    
    let csvContent = headerLabels.join(',') + '\n';
    
    data.forEach(row => {
        const rowContent = headerKeys.map(key => {
            let val = row[key] === null || row[key] === undefined ? '' : row[key];
            // Escape quotes and wrap in quotes if contains comma
            val = val.toString().replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                val = `"${val}"`;
            }
            return val;
        }).join(',');
        csvContent += rowContent + '\n';
    });

    // Add BOM for Excel Arabic Support (UTF-8 with BOM)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const App: React.FC = () => {
  const { language, t, companyInfo, currentView, setCurrentView, currentUser, isLoading, exportData, saveToLocalStorage, isInstallable, installApp } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // --- Request Notification Permission ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
  }, []);
  
  const renderView = () => {
    switch (currentView) {
      case 'transactions': return <Transactions />;
      case 'ai_assistant': return <AIAssistant />;
      case 'bills': return <Bills />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'chart_of_accounts': return <ChartOfAccounts />;
      case 'invoices': return <Invoices />;
      case 'reports': return <Reports />;
      case 'statements': return <Statements />;
      case 'payment_receipts': return <PaymentReceipts />;
      case 'payment_vouchers': return <PaymentVouchers />;
      case 'settings': return <Settings />;
      case 'employees': return <Employees />;
      case 'banks': return <Banks />;
      case 'payroll': return <Payroll />;
      case 'journal_entries': return <JournalEntries />;
      case 'payment_history': return <PaymentHistory />;
      case 'purchase_returns': return <PurchaseReturns />;
      case 'sales_returns': return <SalesReturns />;
      case 'recurring_transactions': return <RecurringTransactions />;
      case 'fixed_assets': return <FixedAssets />;
      case 'bank_reconciliation': return <BankReconciliation />;
      case 'petty_cash': return <PettyCash />;
      case 'budgets': return <Budgets />;
      case 'time_tracking': return <TimeTracking />;
      case 'accrued_expenses': return <AccruedExpenses />;
      case 'sales_dashboard': return <SalesDashboard />;
      case 'users': return <Users />;
      case 'cost_centers': return <CostCenters />;
      case 'inventory': return <Inventory />;
      case 'dashboard':
      default: return <Dashboard />;
    }
  };

  if (isLoading) {
     return (
          <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
              <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-300">
                  <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p>جاري تحميل البيانات...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
      return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 no-print">
          <div className="flex items-center">
            <button
                className="text-gray-500 focus:outline-none lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
            >
                <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold mx-4">{t(currentView as TranslationKeys) || t('dashboard')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
                <button
                    onClick={installApp}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all animate-bounce"
                    title="تثبيت البرنامج على الجهاز"
                >
                    <DownloadCloud size={18} />
                    <span className="hidden sm:inline text-sm font-bold">تثبيت التطبيق</span>
                </button>
            )}
            <button
              onClick={() => saveToLocalStorage()}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-full transition-colors flex items-center gap-2"
              title="حفظ البيانات في المتصفح"
            >
              <Save size={20} />
              <span className="hidden sm:inline text-sm font-bold">حفظ الآن</span>
            </button>
            <button
              onClick={exportData}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors flex items-center gap-2"
              title={t('export_data_tooltip')}
            >
              <HardDriveDownload size={20} />
              <span className="hidden sm:inline text-sm">نسخة احتياطية</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {renderView()}
        </main>
      </div>
      <GlobalLoader />
      <AutoSaveIndicator />
    </div>
  );
};

export default App;
