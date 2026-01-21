
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PurchaseReturn, UserRole } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, Eye, FileSpreadsheet, Upload } from 'lucide-react';
import PurchaseReturnForm from './PurchaseReturnForm';
import PurchaseReturnDetail from './PurchaseReturnDetail';
import CSVImportModal from './CSVImportModal';

const PurchaseReturns: React.FC = () => {
    const { purchaseReturns, suppliers, bills, deletePurchaseReturn, deletePurchaseReturns, formatCurrency, currentUser } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingReturn, setEditingReturn] = useState<PurchaseReturn | null>(null);
    const [viewingReturn, setViewingReturn] = useState<PurchaseReturn | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;

    const processedReturns = useMemo(() => {
        return purchaseReturns.map(pr => {
            const supplier = suppliers.find(s => s.id === pr.supplierId);
            const bill = bills.find(b => b.id === pr.billId);
            return {
                ...pr,
                supplierName: supplier?.name || 'غير معروف',
                billNumber: bill?.billNumber || bill?.name || 'غير معروف',
            };
        });
    }, [purchaseReturns, suppliers, bills]);

    const filteredReturns = useMemo(() => {
        if (!searchQuery) return processedReturns;
        const lower = searchQuery.toLowerCase();
        return processedReturns.filter(pr => pr.returnNumber.toLowerCase().includes(lower) || pr.supplierName.toLowerCase().includes(lower));
    }, [processedReturns, searchQuery]);

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(filteredReturns.map(r => r.id)));
        else setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleBulkDelete = () => {
        if (window.confirm(`حذف ${selectedIds.size} مرتجع مشتريات؟`)) {
            deletePurchaseReturns(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">مرتجعات المشتريات</h2>
                <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute right-3 top-2.5 text-gray-400" />
                    <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pr-10 p-2 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex items-center gap-2 no-print self-end sm:self-center">
                    {selectedIds.size > 0 && canEdit && (
                        <button onClick={handleBulkDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 font-bold text-sm">حذف ({selectedIds.size})</button>
                    )}
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold shadow-sm transition-all"><Upload size={18} className="ml-2" /> استيراد</button>
                    {canEdit && (
                        <button onClick={() => { setEditingReturn(null); setIsFormModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md"><Plus size={18} className="ml-2" /> إضافة مرتجع</button>
                    )}
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="p-4 no-print"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredReturns.length && filteredReturns.length > 0} className="w-4 h-4 text-blue-600 rounded" /></th>
                            <th className="px-6 py-3">رقم المرتجع</th>
                            <th className="px-6 py-3">التاريخ</th>
                            <th className="px-6 py-3">المورد</th>
                            <th className="px-6 py-3">فاتورة الشراء</th>
                            <th className="px-6 py-3">المبلغ المسترد</th>
                            {canEdit && <th className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReturns.map(pr => (
                            <tr key={pr.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 ${selectedIds.has(pr.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}>
                                <td className="p-4 no-print"><input type="checkbox" checked={selectedIds.has(pr.id)} onChange={() => toggleSelect(pr.id)} className="w-4 h-4 text-blue-600 rounded" /></td>
                                <td className="px-6 py-4 font-mono">{pr.returnNumber}</td>
                                <td className="px-6 py-4">{pr.date}</td>
                                <td className="px-6 py-4 font-bold">{pr.supplierName}</td>
                                <td className="px-6 py-4">{pr.billNumber}</td>
                                <td className="px-6 py-4 font-bold text-green-500">{formatCurrency(pr.amount)}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                                        <button onClick={() => setViewingReturn(pr)} className="text-gray-500"><Eye size={18} /></button>
                                        <button onClick={() => { setEditingReturn(pr); setIsFormModalOpen(true); }} className="text-blue-500"><Edit size={18} /></button>
                                        <button onClick={() => deletePurchaseReturn(pr.id)} className="text-red-500"><Trash2 size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && canEdit && <PurchaseReturnForm purchaseReturn={editingReturn} onClose={() => setIsFormModalOpen(false)} />}
            {isImportModalOpen && <CSVImportModal type="purchase_returns" onClose={() => setIsImportModalOpen(false)} />}
            {viewingReturn && <PurchaseReturnDetail purchaseReturn={viewingReturn} onClose={() => setViewingReturn(null)} />}
        </div>
    );
};

export default PurchaseReturns;
