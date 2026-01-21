
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bill, BillStatus } from '../types';
import { Plus, Edit, Trash2, Download, Printer, DollarSign, Search, Paperclip, Eye, FileSpreadsheet, Upload } from 'lucide-react';
import BillForm from './BillForm';
import QuickPaymentModal from './QuickPaymentModal';
import AttachmentViewerModal from './AttachmentViewerModal';
import BillDetail from './BillDetail';
import CSVImportModal from './CSVImportModal';

const Bills: React.FC = () => {
  const { bills, deleteBill, deleteBills, accounts, suppliers, costCenters, formatCurrency, canEdit } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Bill['attachments']>(null);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'partially_paid'>('all');
  const [sortBy, setSortBy] = useState<string>('billDate-asc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedBills = useMemo(() => {
    let processedBills = bills.map(bill => {
      const accountName = accounts.find(a => a.id === bill.accountId)?.name || 'غير محدد';
      const supplierName = suppliers.find(s => s.id === bill.supplierId)?.name || '—';
      const costCenterName = costCenters.find(c => c.id === bill.costCenterId)?.name || '';
      return { ...bill, accountName, supplierName, costCenterName };
    });

    processedBills = processedBills.filter(bill => {
      const remaining = bill.amount - (bill.paidAmount || 0) - (bill.returnedAmount || 0);
      const isPaid = remaining <= 0 && bill.amount > 0;
      const isPartial = (bill.paidAmount || 0) > 0 || (bill.returnedAmount || 0) > 0;
      
      if (filterStatus === 'all') return true;
      if (filterStatus === 'paid') return isPaid;
      if (filterStatus === 'unpaid') return !isPaid && !isPartial;
      if (filterStatus === 'partially_paid') return isPartial && !isPaid;
      return false;
    });

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        processedBills = processedBills.filter(bill => 
            bill.name.toLowerCase().includes(lowercasedQuery) ||
            (bill.billNumber && bill.billNumber.toLowerCase().includes(lowercasedQuery)) ||
            bill.supplierName.toLowerCase().includes(lowercasedQuery)
        );
    }

    processedBills.sort((a, b) => {
        const [key, direction] = sortBy.split('-');
        const valA = a[key as keyof typeof a] || '';
        const valB = b[key as keyof typeof b] || '';
        return direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    return processedBills;
  }, [bills, accounts, suppliers, costCenters, filterStatus, sortBy, searchQuery]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAndSortedBills.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
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
    if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} فاتورة محددة؟`)) {
      deleteBills(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">فواتير المشتريات</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search size={18} className="absolute right-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pr-10 p-2 dark:bg-gray-700 dark:border-gray-600" />
            </div>
        </div>
        <div className="flex items-center gap-2 no-print shrink-0">
            {selectedIds.size > 0 && canEdit && (
                <button onClick={handleBulkDelete} className="flex items-center bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors font-bold text-sm">
                    <Trash2 size={18} className="ml-2" /> حذف ({selectedIds.size})
                </button>
            )}
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold">
                <Upload size={18} className="ml-2" /> استيراد
            </button>
            <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold"><Printer size={18} className="ml-2" /> طباعة</button>
            {canEdit && (
                <button onClick={() => { setEditingBill(null); setIsFormModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md">
                <Plus size={18} className="ml-2" /> إضافة فاتورة
                </button>
            )}
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="p-4 no-print"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredAndSortedBills.length && filteredAndSortedBills.length > 0} className="w-4 h-4 text-blue-600 rounded" /></th>
              <th scope="col" className="px-6 py-3">الوصف / الرقم</th>
              <th scope="col" className="px-6 py-3">المورد</th>
              <th scope="col" className="px-6 py-3">التاريخ</th>
              <th scope="col" className="px-6 py-3">الإجمالي</th>
              <th scope="col" className="px-6 py-3">المتبقي</th>
              <th scope="col" className="px-6 py-3">الحالة</th>
              <th scope="col" className="px-6 py-3 no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedBills.map(bill => {
              const remaining = bill.amount - bill.paidAmount - (bill.returnedAmount || 0);
              return (
              <tr key={bill.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${selectedIds.has(bill.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}>
                <td className="p-4 no-print"><input type="checkbox" checked={selectedIds.has(bill.id)} onChange={() => toggleSelect(bill.id)} className="w-4 h-4 text-blue-600 rounded" /></td>
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  <div className="flex flex-col">
                    <span>{bill.name}</span>
                    <span className="text-[10px] text-gray-400">{bill.billNumber || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{bill.supplierName}</td>
                <td className="px-6 py-4">{bill.billDate}</td>
                <td className="px-6 py-4 font-bold">{formatCurrency(bill.amount)}</td>
                <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(remaining)}</td>
                <td className="px-6 py-4">
                    {remaining <= 0 ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">مدفوعة</span> : <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">مستحقة</span>}
                </td>
                <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                    <button onClick={() => setViewingBill(bill)} className="text-gray-500 hover:text-gray-700 p-1"><Eye size={18} /></button>
                    {canEdit && (
                    <>
                        {!bill.isCash && remaining > 0 && <button onClick={() => setPayingBill(bill)} className="text-green-500 p-1"><DollarSign size={18} /></button>}
                        <button onClick={() => { setEditingBill(bill); setIsFormModalOpen(true); }} className="text-blue-500 p-1"><Edit size={18} /></button>
                        <button onClick={() => deleteBill(bill.id)} className="text-red-500 p-1"><Trash2 size={18} /></button>
                    </>
                    )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && canEdit && <BillForm bill={editingBill} onClose={() => setIsFormModalOpen(false)} />}
      {isImportModalOpen && <CSVImportModal type="bills" onClose={() => setIsImportModalOpen(false)} />}
      {payingBill && canEdit && <QuickPaymentModal item={payingBill} type="bill" onClose={() => setPayingBill(null)} />}
      {viewingBill && <BillDetail bill={viewingBill} onClose={() => setViewingBill(null)} />}
      {viewingAttachments && <AttachmentViewerModal attachments={viewingAttachments} onClose={() => setViewingAttachments(null)} />}
    </div>
  );
};

export default Bills;
