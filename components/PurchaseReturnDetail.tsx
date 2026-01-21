
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PurchaseReturn } from '../types';
import { X, Download, Printer } from 'lucide-react';

interface PurchaseReturnDetailProps {
    purchaseReturn: PurchaseReturn;
    onClose: () => void;
}

const PurchaseReturnDetail: React.FC<PurchaseReturnDetailProps> = ({ purchaseReturn, onClose }) => {
    const { suppliers, bills, companyInfo, formatCurrency } = useAppContext();
    const returnRef = useRef<HTMLDivElement>(null);
    const supplier = useMemo(() => suppliers.find(s => s.id === purchaseReturn.supplierId), [suppliers, purchaseReturn.supplierId]);
    const originalBill = useMemo(() => bills.find(b => b.id === purchaseReturn.billId), [bills, purchaseReturn.billId]);

    const handleExportPDF = async () => {
        try {
            await window.ensurePdfLibsLoaded();
        } catch (error) {
            alert("فشل تحميل مكتبات التصدير. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            return;
        }

        const returnElement = returnRef.current;
        if (!returnElement) {
            alert("لا يمكن العثور على العنصر المراد تصديره.");
            return;
        }

        window.html2canvas(returnElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        }).then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a5' });
            
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
            pdf.save(`Purchase-Return_${purchaseReturn.returnNumber}.pdf`);
        });
    };

    if (!purchaseReturn) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 sm:p-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b dark:border-gray-700 no-print">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">تفاصيل مرتجع المشتريات #{purchaseReturn.returnNumber}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.handlePrint('printable-purchase-return-detail')} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center">
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
                
                <div id="printable-purchase-return-detail" ref={returnRef} className="p-8 sm:p-12 text-gray-800 dark:text-gray-200">
                    <div className="flex justify-between items-start mb-8 pb-4 border-b dark:border-gray-600">
                        <div className="flex items-center">
                            {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-16 w-16 object-contain ml-4" />}
                            <div>
                                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{companyInfo.address}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-300 uppercase">إشعار مدين</h2>
                             <p className="font-mono">{purchaseReturn.returnNumber}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <p className="text-sm text-gray-500">التاريخ</p>
                            <p className="font-semibold">{purchaseReturn.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">المبلغ</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(purchaseReturn.amount)}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-8">
                        <p className="text-sm text-gray-500">إشعار مدين للسيد/السادة:</p>
                        <p className="font-bold text-lg">{supplier?.name}</p>
                        <p className="text-sm">بخصوص الفاتورة الأصلية رقم: {originalBill?.billNumber || originalBill?.name || 'N/A'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">وذلك عن:</p>
                        <p className="font-semibold">{purchaseReturn.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t dark:border-gray-600">
                        <div className="text-center">
                            <p className="mb-8">_________________________</p>
                            <p className="font-semibold">المحاسب</p>
                        </div>
                        <div className="text-center">
                             <p className="mb-8">_________________________</p>
                             <p className="font-semibold">المدير المالي</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PurchaseReturnDetail;