
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TransactionType } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Smartphone, DownloadCloud } from 'lucide-react';
import IncomeExpenseChart from './IncomeExpenseChart';
import CategoryChart from './CategoryChart';
import PwaInstallModal from './PwaInstallModal';

const StatCard: React.FC<{ title: string; amount: string; icon: React.ElementType; color: string }> = ({ title, amount, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full ltr:mr-4 rtl:ml-4 ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">
        {amount}
      </p>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { transactions, formatCurrency, t, isInstallable, installApp } = useAppContext();
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title={t('totalIncome')} amount={formatCurrency(totalIncome)} icon={TrendingUp} color="bg-green-500" />
        <StatCard title={t('totalExpenses')} amount={formatCurrency(totalExpenses)} icon={TrendingDown} color="bg-red-500" />
        <StatCard title={t('netProfit')} amount={formatCurrency(netProfit)} icon={DollarSign} color="bg-blue-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-r-4 border-blue-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 ltr:mr-4 rtl:ml-4">
                <Smartphone className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t('install_pwa_title')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('install_pwa_subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isInstallable && (
                <button
                    onClick={installApp}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-bold flex items-center gap-2"
                >
                    <DownloadCloud size={20} />
                    تثبيت الآن
                </button>
            )}
            <button
                onClick={() => setIsPwaModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex-shrink-0"
            >
                {t('install_pwa_button')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t('income_vs_expenses')}</h3>
          <IncomeExpenseChart />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t('expenses_distribution')}</h3>
          <CategoryChart />
        </div>
      </div>
      {isPwaModalOpen && <PwaInstallModal onClose={() => setIsPwaModalOpen(false)} />}
    </div>
  );
};

export default Dashboard;
