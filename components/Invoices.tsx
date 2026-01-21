
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Invoice } from '../types';
import { Plus, Edit, Trash2, Eye, Download, Printer, DollarSign, Search, Paperclip, FileSpreadsheet, Upload } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import InvoiceDetail from './InvoiceDetail';
import QuickPaymentModal from './QuickPaymentModal';
import AttachmentViewerModal from './AttachmentViewerModal';
import CSVImportModal from './CSVImportModal';

type FilterStatus = 'all' | 'paid' | 'partially_paid' | 'unpaid';

const ITEMS_PER_PAGE = 10;

const Invoices: React.FC = () => {
  const { invoices, customers, accounts, deleteInvoice, formatCurrency, canEdit } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Invoice['attachments']>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<string>('issueDate-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, sortBy, searchQuery]);

  const getInvoiceStatusInfo = (invoice: { paidAmount: number, totalAmount: number, returnedAmount?: number }) => {
    const remaining = invoice.totalAmount - invoice.paidAmount - (invoice.returnedAmount || 0);
    if (remaining <= 0 && invoice.totalAmount > 0) {
        return { text: 'مدفوعة', component: <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">مدفوعة</span> };
    }

    if (invoice.paidAmount > 0 || (invoice.returnedAmount || 0) > 0) {
        return { text: 'مدفوعة جزئياً', component: <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">مدفوعة جزئياً</span> };
    }
    
    return { text: 'غير مدفوعة', component: <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">غير مدفوعة</span> };
  };

  const handleExportPDF = async () => {
    try {
      await window.ensurePdfLibsLoaded();
    } catch (error) {
      alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
      console.error("PDF lib loading error:", error);
      return;
    }

    const tableContainer = tableContainerRef.current;
    if (!tableContainer) {
        alert("لا يمكن العثور على العنصر المراد تصديره.");
        return;
    }

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
    titleEl.innerText = 'فواتير المبيعات';
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
    const actionHeader = clonedTable.querySelector('th:last-child');
    const actionCells = clonedTable.querySelectorAll('td:last-child');
    if (actionHeader) (actionHeader as HTMLElement).style.display = 'none';
    actionCells.forEach(td => (td as HTMLElement).style.display = 'none');
    pdfContainer.appendChild(clonedTable);
    
    document.body.appendChild(pdfContainer);
    
    window.html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
    }).then((canvas: HTMLCanvasElement) => {
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
        const y = 20; // Position at the top with a margin

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`Invoices_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  const handleAddNew = () => {
    setEditingInvoice(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormModalOpen(true);
  };
  
  const handleAddPayment = (invoice: Invoice) => {
    setPayingInvoice(invoice);
  };

  const handleView = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let processedInvoices = invoices.map(inv => {
        const customerName = customers.find(c => c.id === inv.customerId)?.name || 'غير معروف';
        const revenueAccountName = accounts.find(a => a.id === inv.revenueAccountId)?.name || 'غير محدد';
        return { ...inv, customerName, revenueAccountName };
    });

    processedInvoices = processedInvoices.filter(inv => {
        if (filterStatus === 'all') return true;
        
        const statusText = getInvoiceStatusInfo(inv).text;
    
        if (filterStatus === 'paid') return statusText === 'مدفوعة';
        if (filterStatus === 'partially_paid') return statusText === 'مدفوعة جزئياً';
        if (filterStatus === 'unpaid') return statusText === 'غير مدفوعة';
        
        return false;
    });

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        processedInvoices = processedInvoices.filter(inv => {
            const statusText = getInvoiceStatusInfo(inv).text;
            
            return inv.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
                (inv.orderNumber && inv.orderNumber.toLowerCase().includes(lowercasedQuery)) ||
                inv.customerName.toLowerCase().includes(lowercasedQuery) ||
                inv.totalAmount.toString().includes(lowercasedQuery) ||
                statusText.includes(lowercasedQuery);
        });
    }

    processedInvoices.sort((a, b) => {
        switch (sortBy) {
            case 'issueDate-asc': return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
            case 'totalAmount-asc': return a.totalAmount - b.totalAmount;
            case 'totalAmount-desc': return b.totalAmount - a.totalAmount;
            case 'issueDate-desc': default: return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        }
    });
    return processedInvoices;
  }, [invoices, filterStatus, sortBy, searchQuery, customers, accounts]);

  const { paginatedInvoices, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredAndSortedInvoices.length / ITEMS_PER_PAGE);
    const paginated = filteredAndSortedInvoices.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    return { paginatedInvoices: paginated, totalPages: total };
  }, [filteredAndSortedInvoices, currentPage]);

  const handleExportCSV = () => {
    const headers = {
        invoiceNumber: 'رقم الفاتورة',
        orderNumber: 'رقم الطلب',
        customerName: 'العميل',
        issueDate: 'تاريخ الإصدار',
        totalAmount: 'الإجمالي',
        paidAmount: 'المدفوع',
        returnedAmount: 'المرتجع',
        remaining: 'المتبقي',
        status: 'الحالة',
    };
    
    const dataToExport = filteredAndSortedInvoices.map(inv => {
        const remaining = inv.totalAmount - inv.paidAmount - (inv.returnedAmount || 0);
        const status = getInvoiceStatusInfo(inv).text;
        return {
            invoiceNumber: inv.invoiceNumber,
            orderNumber: inv.orderNumber || '',
            customerName: inv.customerName,
            issueDate: inv.issueDate,
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            returnedAmount: inv.returnedAmount || 0,
            remaining: Math.max(0, remaining),
            status: status,
        };
    });

    window.handleExportCSV(dataToExport, headers, 'Invoices');
};


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex-shrink-0">فواتير المبيعات</h2>
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="بحث بالرقم, العميل, المبلغ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2 gap-y-2 no-print self-end">
            <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold shadow-sm"
            >
                <Upload size={18} className="ml-2" /> استيراد
            </button>
             <button
                onClick={() => window.handlePrint('printable-area')}
                className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
              >
                <Printer size={18} className="ml-2" /> طباعة
            </button>
             <button
                onClick={handleExportPDF}
                className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
              >
                <Download size={18} className="ml-2" /> PDF
            </button>
            {canEdit && (
              <button
                  onClick={handleAddNew}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-md"
                >
                  <Plus size={18} className="ml-2" /> فاتورة جديدة
              </button>
            )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 no-print border-b dark:border-gray-700 pb-4">
            <div className="flex items-center">
                <label htmlFor="filterStatus" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">تصفية:</label>
                <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">كل الحالات</option>
                    <option value="paid">مدفوعة</option>
                    <option value="partially_paid">مدفوعة جزئياً</option>
                    <option value="unpaid">غير مدفوعة</option>
                </select>
            </div>
            <div className="flex items-center">
                 <label htmlFor="sortBy" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">ترتيب:</label>
                 <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600">
                    <option value="issueDate-desc">التاريخ (الأحدث)</option>
                    <option value="issueDate-asc">التاريخ (الأقدم)</option>
                    <option value="totalAmount-desc">المبلغ (الأعلى)</option>
                    <option value="totalAmount-asc">المبلغ (الأقل)</option>
                </select>
            </div>
      </div>


      <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">رقم الفاتورة</th>
              <th scope="col" className="px-6 py-3">العميل</th>
              <th scope="col" className="px-6 py-3">تاريخ الإصدار</th>
              <th scope="col" className="px-6 py-3">الإجمالي</th>
              <th scope="col" className="px-6 py-3">المدفوع</th>
              <th scope="col" className="px-6 py-3">المتبقي</th>
              <th scope="col" className="px-6 py-3">الحالة</th>
              <th scope="col" className="px-6 py-3 no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
             {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map(inv => {
                  const isCash = !!inv.isCash;
                  const remaining = inv.totalAmount - inv.paidAmount - (inv.returnedAmount || 0);
                  return (
                  <tr key={inv.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <span>{inv.invoiceNumber}</span>
                            {inv.orderNumber && <span className="text-[10px] text-gray-400">طلب: {inv.orderNumber}</span>}
                        </div>
                        {inv.attachments && inv.attachments.length > 0 && (
                            <button onClick={() => setViewingAttachments(inv.attachments)} className="text-gray-400 hover:text-blue-500" title="عرض المرفقات">
                                <Paperclip size={16} />
                            </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{inv.customerName}</td>
                    <td className="px-6 py-4">{inv.issueDate}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                        {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400">
                        {formatCurrency(inv.paidAmount)}
                    </td>
                     <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(Math.max(0, remaining))}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            {getInvoiceStatusInfo(inv).component}
                            {isCash && <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">نقدي</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                      <button onClick={() => handleView(inv)} className="text-gray-500 hover:text-gray-700 p-1" title="عرض وتصدير"><Eye size={18} /></button>
                      {canEdit && !isCash && remaining > 0 && (
                        <button onClick={() => handleAddPayment(inv)} className="text-green-500 hover:text-green-700 p-1" title="تسجيل دفعة"><DollarSign size={18} /></button>
                      )}
                      {canEdit && !isCash && (
                        <>
                          <button onClick={() => handleEdit(inv)} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                        </>
                      )}
                       {canEdit && (
                         <button onClick={() => deleteInvoice(inv.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                       )}
                    </td>
                  </tr>
                )})
            ) : (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'لا توجد فواتير تطابق بحثك.' : 'لا توجد فواتير تطابق معايير الفلترة الحالية.'}
                </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 no-print">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
          >
            السابق
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
          >
            التالي
          </button>
        </div>
      )}

      {isFormModalOpen && canEdit && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => setIsFormModalOpen(false)}
        />
      )}
      {isImportModalOpen && <CSVImportModal type="invoices" onClose={() => setIsImportModalOpen(false)} />}
      {payingInvoice && canEdit && (
        <QuickPaymentModal
            item={payingInvoice}
            type="invoice"
            onClose={() => setPayingInvoice(null)}
        />
      )}
      {viewingInvoice && (
        <InvoiceDetail
            invoice={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
        />
      )}
      {viewingAttachments && <AttachmentViewerModal attachments={viewingAttachments} onClose={() => setViewingAttachments(null)} />}
    </div>
  );
};

export default Invoices;
