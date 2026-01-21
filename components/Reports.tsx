
import React, { useState } from 'react';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';
import TrialBalance from './TrialBalance';
import PayrollStatement from './PayrollStatement';
import InventoryReport from './InventoryReport';
import { useAppContext } from '../context/AppContext';

type ReportType = 'income_statement' | 'balance_sheet' | 'trial_balance' | 'payroll_statement' | 'inventory_report';

const Reports: React.FC = () => {
    const { t } = useAppContext();
    const [activeReport, setActiveReport] = useState<ReportType>('income_statement');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    
    const renderDatePickers = () => {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex flex-wrap border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <button onClick={() => setActiveReport('income_statement')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeReport === 'income_statement' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        قائمة الدخل
                    </button>
                    <button onClick={() => setActiveReport('balance_sheet')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeReport === 'balance_sheet' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        الميزانية
                    </button>
                    <button onClick={() => setActiveReport('trial_balance')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeReport === 'trial_balance' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        ميزان المراجعة
                    </button>
                    <button onClick={() => setActiveReport('payroll_statement')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeReport === 'payroll_statement' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {t('payroll_statement')}
                    </button>
                    <button onClick={() => setActiveReport('inventory_report')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeReport === 'inventory_report' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {t('inventory_report')}
                    </button>
                </div>
                {renderDatePickers()}
            </div>

            <div className="animate-fade-in">
                {activeReport === 'income_statement' && <IncomeStatement startDate={startDate} endDate={endDate} />}
                {activeReport === 'balance_sheet' && <BalanceSheet startDate={startDate} endDate={endDate} />}
                {activeReport === 'trial_balance' && <TrialBalance startDate={startDate} endDate={endDate} />}
                {activeReport === 'payroll_statement' && <PayrollStatement startDate={startDate} endDate={endDate} />}
                {activeReport === 'inventory_report' && <InventoryReport startDate={startDate} endDate={endDate} />}
            </div>
        </div>
    )
}

export default Reports;
