import React, { useState, useMemo } from 'react';
import AccountStatement from './AccountStatement';
import CustomerStatement from './CustomerStatement';
import SupplierStatement from './SupplierStatement';
import { useAppContext } from '../context/AppContext';
import SearchableSelect from './SearchableSelect';

type StatementType = 'account' | 'customer' | 'supplier';

const Statements: React.FC = () => {
    const { getSelectableAccountList, customers, suppliers } = useAppContext();
    const [activeStatement, setActiveStatement] = useState<StatementType>('account');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    
    const [selectedId, setSelectedId] = useState<string>('');
    
    const selectableAccounts = useMemo(() => getSelectableAccountList(), [getSelectableAccountList]);
    const selectableCustomers = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
    const selectableSuppliers = useMemo(() => suppliers.map(s => ({ value: s.id, label: s.name })), [suppliers]);


    const selectOptions = useMemo(() => {
        switch (activeStatement) {
            case 'account': return selectableAccounts.filter(a => !a.disabled);
            case 'customer': return selectableCustomers;
            case 'supplier': return selectableSuppliers;
            default: return [];
        }
    }, [activeStatement, selectableAccounts, selectableCustomers, selectableSuppliers]);

    // Set a default ID when the statement type changes
    React.useEffect(() => {
        if (selectOptions.length > 0) {
            setSelectedId(selectOptions[0].value);
        } else {
            setSelectedId('');
        }
    }, [activeStatement, selectOptions]);

    const renderSelectors = () => {
        let label = '';
        switch(activeStatement) {
            case 'account': label = 'الحساب'; break;
            case 'customer': label = 'العميل'; break;
            case 'supplier': label = 'المورد'; break;
        }

        return (
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-64">
                    <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       {label}
                    </label>
                    <SearchableSelect
                        id="entityId"
                        value={selectedId}
                        onChange={setSelectedId}
                        options={selectOptions}
                    />
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
        )
    }

    const renderStatement = () => {
        if (!selectedId) {
            return (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                    <p>الرجاء اختيار {activeStatement === 'account' ? 'حساب' : activeStatement === 'customer' ? 'عميل' : 'مورد'} لعرض الكشف.</p>
                </div>
            )
        }
        
        let entityId = selectedId;
        if (selectedId.startsWith('account-')) {
            entityId = selectedId.replace('account-', '');
        }

        switch(activeStatement) {
            case 'account': return <AccountStatement accountId={entityId} startDate={startDate} endDate={endDate} />;
            case 'customer': return <CustomerStatement customerId={selectedId} startDate={startDate} endDate={endDate} />;
            case 'supplier': return <SupplierStatement supplierId={selectedId} startDate={startDate} endDate={endDate} />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex flex-wrap border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <button onClick={() => setActiveStatement('account')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeStatement === 'account' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        كشف حساب
                    </button>
                    <button onClick={() => setActiveStatement('customer')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeStatement === 'customer' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        كشف حساب عميل
                    </button>
                    <button onClick={() => setActiveStatement('supplier')} className={`px-3 py-2 text-sm font-medium rounded-md ${activeStatement === 'supplier' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        كشف حساب مورد
                    </button>
                </div>
                {renderSelectors()}
            </div>

            <div>
                {renderStatement()}
            </div>
        </div>
    )
}

export default Statements;