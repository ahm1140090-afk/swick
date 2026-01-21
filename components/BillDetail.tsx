
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bill } from '../types';
import { X, Download, Printer } from 'lucide-react';

interface BillDetailProps {
    bill: Bill;
    onClose: () => void;
}

const BillDetail: React.FC<BillDetailProps> = ({ bill, onClose }) => {
    const { suppliers, companyInfo, formatCurrency, paymentVouchers, accounts } = useAppContext();
    const billRef = useRef<HTMLDivElement>(null);
    const supplier = useMemo(() => suppliers.find(s => s.id === bill.supplierId), [suppliers, bill.supplierId]);

    const billPayments = useMemo(() => {
        return paymentVouchers
            .filter(p => p.billId === bill.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [paymentVouchers, bill.id]);

    const handleExportPDF = async () => {
        try {
          await window.ensurePdfLibsLoaded();
        } catch (error) {
          alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
          console.error("PDF lib loading error:", error);
          return;
        }

        const billElement = billRef.current;
        if (!billElement) {
            alert("لا يمكن العثور على العنصر المراد تصديره.");
            return;
        }

        window.html2canvas(billElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        }).then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40; // with margin
            let imgHeight = imgWidth / ratio;
            
            if (imgHeight > pdfHeight - 40) {
                imgHeight = pdfHeight - 40;
                imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 20;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`Bill_${bill.billNumber || bill.name}.pdf`);
        });
    };

    if (!bill) return null;

    const balanceDue = bill.amount - (bill.paidAmount || 0) - (bill.returnedAmount || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 sm:p-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b dark:border-gray-700 no-print">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">تفاصيل الفاتورة #{bill.billNumber || bill.name}</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={() => window.handlePrint('printable-bill-detail')} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center">
                            <Printer size={18} className="ml-2" />
                            طباعة
                        </button>
                        <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                            <Download size={18} className="ml-2" />
                            تصدير PDF
                        </button>
                         <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div id="printable-bill-detail" ref={billRef} className="p-6 sm:p-10 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center">
                            {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-16 w-16 object-contain ml-4" />}
                            <div>
                                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{companyInfo.address}</p>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-300 uppercase">فاتورة مشتريات</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        <div>
                            <h3 className="font-semibold mb-1">فاتورة من:</h3>
                            <p className="font-bold">{supplier?.name || 'غير محدد'}</p>
                            <p className="text-sm">{supplier?.email}</p>
                            <p className="text-sm">{supplier?.phone}</p>
                        </div>
                        <div className="text-right">
                             <p><span className="font-semibold">رقم الفاتورة:</span> {bill.billNumber || 'N/A'}</p>
                             {bill.orderNumber && <p><span className="font-semibold">رقم الطلب:</span> {bill.orderNumber}</p>}
                             <p><span className="font-semibold">نوع الفاتورة:</span> {bill.isCash ? 'نقدية' : 'آجلة'}</p>
                             <p><span className="font-semibold">تاريخ الفاتورة:</span> {bill.billDate}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3 font-semibold text-right">الوصف</th>
                                    <th className="p-3 font-semibold text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b dark:border-gray-700">
                                    <td className="p-3">{bill.name}</td>
                                    <td className="p-3 text-left font-mono">{formatCurrency(bill.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {billPayments.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-2">سجل الدفعات</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-3 font-semibold text-right">تاريخ الدفعة</th>
                                            <th className="p-3 font-semibold text-right">رقم السند</th>
                                            <th className="p-3 font-semibold text-right">الدفع من حساب</th>
                                            <th className="p-3 font-semibold text-left">المبلغ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billPayments.map(payment => {
                                            const accountName = accounts.find(a => a.id === payment.assetAccountId)?.name || 'غير معروف';
                                            return (
                                                <tr key={payment.id} className="border-b dark:border-gray-700">
                                                    <td className="p-3">{payment.date}</td>
                                                    <td className="p-3">{payment.voucherNumber}</td>
                                                    <td className="p-3">{accountName}</td>
                                                    <td className="p-3 text-left font-mono">{formatCurrency(payment.amount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <div className="w-full sm:w-2/5">
                            <div className="flex justify-between py-2 text-gray-600 dark:text-gray-300">
                                <span>المجموع الفرعي</span>
                                <span className="font-mono">{formatCurrency(bill.amount)}</span>
                            </div>
                            {(bill.returnedAmount || 0) > 0 && (
                                <div className="flex justify-between py-2 text-gray-600 dark:text-gray-300">
                                    <span>المرتجعات</span>
                                    <span className="font-mono text-orange-500">({formatCurrency(bill.returnedAmount || 0)})</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 text-gray-600 dark:text-gray-300">
                                <span>المبلغ المدفوع</span>
                                <span className="font-mono text-green-500">({formatCurrency(bill.paidAmount || 0)})</span>
                            </div>
                            <div className="flex justify-between py-2 font-bold text-lg border-t-2 dark:border-gray-600 mt-2">
                                <span>الرصيد المستحق</span>
                                <span className="font-mono">{formatCurrency(balanceDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillDetail;
