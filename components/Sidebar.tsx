
import React from 'react';
import { LayoutDashboard, List, Bot, X, Receipt, Users, FileText, Library, FileBarChart, FileDown, FileUp, Settings, Truck, Briefcase, Landmark, Wallet, FileSpreadsheet, BookText, Trash2, Undo2, CornerUpLeft, Repeat, Building2, GitCompareArrows, Box, PiggyBank, BarChart3, History, Clock, FileClock, LogOut, Network, Package } from 'lucide-react';
import { View, UserRole } from '../types';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { handleResetData, t, language, currentView, setCurrentView, logout, currentUser } = useAppContext();

  const navItems: { id: View; label: string; icon: React.ElementType, adminOnly?: boolean }[] = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'sales_dashboard', label: t('sales_dashboard'), icon: BarChart3 },
    { id: 'transactions', label: t('transactions'), icon: List },
    { id: 'inventory', label: t('inventory'), icon: Package }, // NEW
    { id: 'recurring_transactions', label: t('recurring_transactions'), icon: Repeat },
    { id: 'invoices', label: t('invoices'), icon: FileText },
    { id: 'sales_returns', label: t('sales_returns'), icon: CornerUpLeft },
    { id: 'payment_receipts', label: t('payment_receipts'), icon: FileDown },
    { id: 'payment_vouchers', label: t('payment_vouchers'), icon: FileUp },
    { id: 'bills', label: t('bills'), icon: Receipt },
    { id: 'purchase_returns', label: t('purchase_returns'), icon: Undo2 },
    { id: 'customers', label: t('customers'), icon: Users },
    { id: 'suppliers', label: t('suppliers'), icon: Truck },
    { id: 'employees', label: t('employees'), icon: Briefcase },
    { id: 'payroll', label: t('payroll'), icon: Wallet },
    { id: 'time_tracking', label: t('time_tracking'), icon: Clock },
    { id: 'budgets', label: t('budgets'), icon: PiggyBank },
    { id: 'accrued_expenses', label: t('accrued_expenses'), icon: FileClock },
    { id: 'petty_cash', label: t('petty_cash'), icon: Box },
    { id: 'banks', label: t('banks'), icon: Landmark },
    { id: 'fixed_assets', label: t('fixed_assets'), icon: Building2 },
    { id: 'chart_of_accounts', label: t('chart_of_accounts'), icon: Library },
    { id: 'cost_centers', label: t('cost_centers'), icon: Network },
    { id: 'journal_entries', label: t('journal_entries'), icon: BookText },
    { id: 'payment_history', label: t('payment_history'), icon: History },
    { id: 'bank_reconciliation', label: t('bank_reconciliation'), icon: GitCompareArrows },
    { id: 'reports', label: t('reports'), icon: FileBarChart },
    { id: 'statements', label: t('statements'), icon: FileSpreadsheet },
    { id: 'ai_assistant', label: t('ai_assistant'), icon: Bot },
    { id: 'users', label: t('users'), icon: Users, adminOnly: true },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if(window.innerWidth < 1024) { // Close sidebar on mobile after navigation
        setIsOpen(false);
    }
  }
  
   const handleReset = () => {
    handleResetData();
    if(window.innerWidth < 1024) {
        setIsOpen(false);
    }
  }
  
  const sidebarClasses = language === 'ar' 
    ? `right-0 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 border-l` 
    : `left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r`;


  return (
    <div
      className={`absolute lg:relative inset-y-0 z-30 w-64 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out border-gray-200 dark:border-gray-700 no-print flex flex-col ${sidebarClasses}`}
    >
      <div className="flex-grow overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('smart_accountant')}</h2>
          <button
            className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-6 pb-4">
          {navItems.filter(item => !item.adminOnly || currentUser?.role === UserRole.ADMIN).map(item => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.id);
              }}
              className={`flex items-center px-6 py-3 text-base font-semibold transition-colors duration-200 ${
                currentView === item.id
                  ? `bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 ${language === 'ar' ? 'border-r-4' : 'border-l-4'} border-blue-500`
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className={`w-6 h-6 ${language === 'ar' ? 'ml-4' : 'mr-4'}`} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <a
              href="#"
              onClick={(e) => { e.preventDefault(); logout(); }}
              className={`flex items-center justify-center px-4 py-2 text-base font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
          >
              <LogOut className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <span>{t('logout')}</span>
          </a>
          <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleReset(); }}
              className={`flex items-center justify-center px-4 py-2 text-base font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors`}
          >
              <Trash2 className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              <span>حذف البيانات</span>
          </a>
      </div>
    </div>
  );
};

export default Sidebar;
