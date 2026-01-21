
import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Supplier } from '../types';
import { Plus, Edit, Trash2, Download, Printer, Search, FileSpreadsheet, Upload } from 'lucide-react';
import SupplierForm from './SupplierForm';
import CSVImportModal from './CSVImportModal';

const Suppliers: React.FC = () => {
  const { suppliers, deleteSupplier, bills, paymentVouchers, purchaseReturns, formatCurrency, canEdit, t } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const suppliersWithBalance = useMemo(() => {
    return suppliers.map(supplier => {
        const supplierBills = bills.filter(b => b.supplierId === supplier.id && !b.isCash);
        const supplierPayments = paymentVouchers.filter(pv => {
            if (pv.billId) {
                const bill = bills.find(b => b.id === pv.billId);
                return bill?.supplierId === supplier.id;
            }
            return pv.payeeName === supplier.name;
        });
        const supplierReturns = purchaseReturns.filter(pr => pr.supplierId === supplier.id);
        const totalBilled = supplierBills.reduce((sum, b) => sum + b.amount, 0);
        const totalPaid = supplierPayments.reduce((sum, pv) => sum + pv.amount, 0);
        const totalReturned = supplierReturns.reduce((sum, pr) => sum + pr.amount, 0);
        const balance = totalBilled - totalPaid - totalReturned;
        return { ...supplier, balance };
    });
  }, [suppliers, bills, paymentVouchers, purchaseReturns]);
  
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliersWithBalance;
    const lower = searchQuery.toLowerCase();
    return suppliersWithBalance.filter(s => s.name.toLowerCase().includes(lower) || s.phone.includes(lower));
  }, [suppliersWithBalance, searchQuery]);

  const handleExportCSV = () => {
    const headers = { name: 'الاسم', phone: 'الهاتف', balance: 'الرصيد المستحق', address: 'العنوان' };
    window.handleExportCSV(filteredSuppliers, headers, 'Suppliers');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">قائمة الموردين</h2>
        <div className="relative w-full lg:w-72">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="بحث بالمورد أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-all">
            <Upload size={18} className="ml-2" /> استيراد
          </button>
          <button onClick={handleExportCSV} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <FileSpreadsheet size={18} className="ml-2" /> تصدير
          </button>
          <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-bold">
            <Printer size={18} className="ml-2" /> طباعة
          </button>
          {canEdit && (
            <button onClick={() => { setEditingSupplier(null); setIsFormModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md">
              <Plus size={18} className="ml-2" /> إضافة مورد
            </button>
          )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto border dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">الاسم</th>
              <th scope="col" className="px-6 py-3">الهاتف</th>
              <th scope="col" className="px-6 py-3">الرصيد</th>
              <th scope="col" className="px-6 py-3">العنوان</th>
              {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(s => (
              <tr key={s.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{s.name}</td>
                <td className="px-6 py-4">{s.phone}</td>
                <td className={`px-6 py-4 font-bold font-mono ${s.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(s.balance)}</td>
                <td className="px-6 py-4">{s.address || '—'}</td>
                {canEdit && (
                  <td className="px-6 py-4 flex gap-2 no-print">
                    <button onClick={() => { setEditingSupplier(s); setIsFormModalOpen(true); }} className="text-blue-500"><Edit size={18} /></button>
                    <button onClick={() => deleteSupplier(s.id)} className="text-red-500"><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && canEdit && <SupplierForm supplier={editingSupplier} onClose={() => setIsFormModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="suppliers" onClose={() => setIsImportModalOpen(false)} />}
    </div>
  );
};

export default Suppliers;
