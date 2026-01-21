import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PaymentReceipt, PaymentVoucher } from '../types';
import { Download, Printer, Search, Eye, FileSpreadsheet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import PaymentReceiptDetail from './PaymentReceiptDetail';
import PaymentVoucherDetail from './PaymentVoucherDetail';

const PaymentHistory: React.FC = () => {
  const { paymentReceipts, paymentVouchers, customers, accounts, formatCurrency } = useAppContext();
  
  const [viewingItem, setViewingItem] = useState<{ type: 'receipt' | 'voucher', item: PaymentReceipt | PaymentVoucher } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receipt' | 'voucher'>('all');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const combinedPayments = useMemo(() => {
    const receipts = paymentReceipts.map(r => ({
      ...r,
      type: 'receipt' as const,
      number: r.receiptNumber,
      party: customers.find(c => c.id === r.customerId)?.name || r.customerId,
      accountName: accounts.find(a => a.id === r.assetAccountId)?.name || 'N/A',
    }));

    const vouchers = paymentVouchers.map(v => ({
      ...v,
      type: 'voucher' as const,
      number: v.voucherNumber,
      party: v.payeeName,
      accountName: accounts.find(a => a.id === v.assetAccountId)?.name || 'N/A',
    }));

    return [...receipts, ...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paymentReceipts, paymentVouchers, customers, accounts]);

  const filteredPayments = useMemo(() => {
    let intermediate = combinedPayments;

    if (filterType !== 'all') {
      intermediate = intermediate.filter(p => p.type === filterType);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      intermediate = intermediate.filter(p => 
        p.number.toLowerCase().includes(lowercasedQuery) ||
        p.party.toLowerCase().includes(lowercasedQuery) ||
        p.description.toLowerCase().includes(lowercasedQuery) ||
        p.amount.toString().includes(lowercasedQuery)
      );
    }

    return intermediate;
  }, [combinedPayments, filterType, searchQuery]);
  
  const handleExportPDF = async () => {
    try {
      await window.ensurePdfLibsLoaded();
    } catch (error) {
      alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
      return;
    }

    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const table = tableContainer.querySelector('table');
    if (!table) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.padding = '20px';
    pdfContainer.style.fontFamily = "'Cairo', sans-serif";
    pdfContainer.style.direction = 'rtl';
    pdfContainer.style.background = isDarkMode ? '#1f2937' : '#ffffff';
    pdfContainer.style.color = isDarkMode ? '#f3f4f6' : '#111827';
    
    const titleEl = document.createElement('h1');
    titleEl.innerText = 'سجل الدفعات';
    titleEl.style.textAlign = 'center';
    titleEl.style.fontSize = '24px';
    titleEl.style.marginBottom = '10px';
    pdfContainer.appendChild(titleEl);
    
    const dateEl = document.createElement('p');
    dateEl.innerText = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`;
    dateEl.style.textAlign = 'center';
    dateEl.style.fontSize = '12px';
    dateEl.style.marginBottom = '20px';
    pdfContainer.appendChild(dateEl);

    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    clonedTable.querySelectorAll('th:last-child, td:last-child').forEach(el => (el as HTMLElement).style.display = 'none');
    pdfContainer.appendChild(clonedTable);
    
    document.body.appendChild(pdfContainer);

    window.html2canvas(pdfContainer, { scale: 2, useCORS: true })
    .then((canvas: HTMLCanvasElement) => {
        document.body.removeChild(pdfContainer);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 40;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 40) {
            imgHeight = pdfHeight - 40;
            imgWidth = imgHeight * ratio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = 20;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Payment_History_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  const handleExportCSV = () => {
    const headers = {
        date: 'التاريخ',
        number: 'الرقم',
        type: 'النوع',
        party: 'الطرف المقابل',
        description: 'الوصف',
        amount: 'المبلغ',
        accountName: 'الحساب'
    };
    
    const dataToExport = filteredPayments.map(p => ({
        date: p.date,
        number: p.number,
        type: p.type === 'receipt' ? 'قبض' : 'صرف',
        party: p.party,
        description: p.description,
        amount: p.type === 'receipt' ? p.amount : -p.amount,
        accountName: p.accountName,
    }));

    window.handleExportCSV(dataToExport, headers, 'Payment_History');
  };

  const handleView = (item: any) => {
    setViewingItem({
      type: item.type,
      item: item as PaymentReceipt | PaymentVoucher
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">سجل الدفعات</h2>
        
        <div className="flex-grow sm:flex-grow-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
            >
                <option value="all">كل الأنواع</option>
                <option value="receipt">قبض</option>
                <option value="voucher">صرف</option>
            </select>
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
        </div>

        <div className="flex items-center gap-2 no-print self-end sm:self-center">
          <button
            onClick={() => window.handlePrint('printable-area')}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={18} className="ml-2" />
            طباعة
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} className="ml-2" />
            تصدير PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={18} className="ml-2" />
            تصدير Excel
          </button>
        </div>
      </div>

      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">التاريخ</th>
              <th scope="col" className="px-6 py-3">الرقم</th>
              <th scope="col" className="px-6 py-3">النوع</th>
              <th scope="col" className="px-6 py-3">الطرف المقابل</th>
              <th scope="col" className="px-6 py-3">الوصف</th>
              <th scope="col" className="px-6 py-3">المبلغ</th>
              <th scope="col" className="px-6 py-3">الحساب</th>
              <th scope="col" className="px-6 py-3 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(p => (
              <tr key={`${p.type}-${p.id}`} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4">{p.date}</td>
                <td className="px-6 py-4 font-mono">{p.number}</td>
                <td className="px-6 py-4">
                  {p.type === 'receipt' ? (
                    <span className="flex items-center gap-1 text-green-600"><ArrowDownCircle size={16} /> قبض</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600"><ArrowUpCircle size={16} /> صرف</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.party}</td>
                <td className="px-6 py-4">{p.description}</td>
                <td className={`px-6 py-4 font-bold font-mono ${p.type === 'receipt' ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-6 py-4">{p.accountName}</td>
                <td className="px-6 py-4 no-print">
                  <button onClick={() => handleView(p)} className="text-gray-500 hover:text-blue-500"><Eye size={18} /></button>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
                <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500">لا توجد دفعات لعرضها.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingItem?.type === 'receipt' && (
        <PaymentReceiptDetail receipt={viewingItem.item as PaymentReceipt} onClose={() => setViewingItem(null)} />
      )}
      {viewingItem?.type === 'voucher' && (
        <PaymentVoucherDetail voucher={viewingItem.item as PaymentVoucher} onClose={() => setViewingItem(null)} />
      )}
    </div>
  );
};

export default PaymentHistory;
