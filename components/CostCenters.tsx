
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { CostCenter, UserRole } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, FileSpreadsheet } from 'lucide-react';
import CostCenterForm from './CostCenterForm';

const CostCenters: React.FC = () => {
    const { costCenters, deleteCostCenter, currentUser, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;

    const filteredCostCenters = useMemo(() => {
        if (!searchQuery) {
            return costCenters;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return costCenters.filter(cc =>
            cc.name.toLowerCase().includes(lowercasedQuery) ||
            (cc.code && cc.code.toLowerCase().includes(lowercasedQuery))
        );
    }, [costCenters, searchQuery]);

    const handleAddNew = () => {
        setEditingCostCenter(null);
        setIsModalOpen(true);
    };

    const handleEdit = (costCenter: CostCenter) => {
        setEditingCostCenter(costCenter);
        setIsModalOpen(true);
    };

    const handleExportCSV = () => {
        window.handleExportCSV(filteredCostCenters, { code: 'الكود', name: 'الاسم' }, 'Cost_Centers');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('cost_centers')}</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الكود..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 no-print self-end sm:self-center">
                    <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <Printer size={18} className="ml-2" /> طباعة
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} className="ml-2" /> تصدير Excel
                    </button>
                    {canEdit && (
                        <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus size={18} className="ml-2" />
                            إضافة مركز تكلفة
                        </button>
                    )}
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">الكود</th>
                            <th scope="col" className="px-6 py-3">الاسم</th>
                            {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCostCenters.map(cc => (
                            <tr key={cc.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-mono">{cc.code || '—'}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{cc.name}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                                        <button onClick={() => handleEdit(cc)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                        <button onClick={() => deleteCostCenter(cc.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                         {filteredCostCenters.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 3 : 2} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>{searchQuery ? 'لا توجد مراكز تكلفة تطابق بحثك.' : 'لا توجد مراكز تكلفة لعرضها.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && canEdit && (
                <CostCenterForm
                    costCenter={editingCostCenter}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default CostCenters;
