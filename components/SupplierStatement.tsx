
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Printer, FileText, FileOutput, Undo2, BookText } from 'lucide-react';

interface SupplierStatementProps {
    supplierId: string;
    startDate: string;
    endDate: string;
}

const SupplierStatement: React.FC<SupplierStatementProps> = ({ supplierId, startDate, endDate }) => {
    const { journalEntries, suppliers, formatCurrency, companyInfo } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);
    const supplier = useMemo(() => suppliers.find((s: any) => s.id === supplierId), [supplierId, suppliers]);

    const handleExportPDF = async () => {
        await window.ensurePdfLibsLoaded();
        const reportElement = reportRef.current;
        if (!reportElement || !supplier) return;

        // إخفاء الأزرار
        const buttons = reportElement.querySelectorAll('.no-print-capture');
        buttons.forEach((btn: any) => btn.style.visibility = 'hidden');

        try {
            const canvas = await window.html2canvas(reportElement, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 30;
            const imgWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = margin;

            // الصفحة الأولى
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - margin * 2);

            // إضافة صفحات إضافية للتقارير الطويلة
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - margin * 2);
            }

            pdf.save(`كشف_حساب_مورد_${supplier.name}_${startDate}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("حدث خطأ أثناء تصدير ملف PDF.");
        } finally {
            buttons.forEach((btn: any) => btn.style.visibility = 'visible');
        }
    };

    const reportData = useMemo(() => {
        if (!supplier) return { openingBalance: 0, movements: [], closingBalance: 0 };
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const allLines = journalEntries.flatMap((je: any) => 
            je.lines.filter((l: any) => l.entityId === supplierId && l.entityType === 'supplier').map((l: any) => ({
                date: je.date,
                description: je.description || l.description,
                debit: l.debit,
                credit: l.credit,
                ref: je.entryNumber
            }))
        );

        const openingBalance = allLines.filter((l: any) => new Date(l.date) < start).reduce((s: number, l: any) => s + (l.credit - l.debit), 0);
        const movements = allLines.filter((l: any) => {
            const d = new Date(l.date);
            return d >= start && d <= end;
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let running = openingBalance;
        const processed = movements.map((m: any) => {
            running += (m.credit - m.debit);
            return { ...m, balance: running };
        });

        return { openingBalance, movements: processed, closingBalance: running };
    }, [supplier, supplierId, startDate, endDate, journalEntries]);
    
    if (!supplier) return null;

    return (
        <div ref={reportRef} id="supplier-statement-area" className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-gray-800">
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-purple-600">
                <div className="flex items-center gap-4">
                    {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" className="h-16 w-16 object-contain" />}
                    <div>
                        <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                        <h2 className="text-xl font-semibold text-purple-600">كشف حساب مورد</h2>
                        <p className="text-sm text-gray-500 mt-1">للفترة من {startDate} إلى {endDate}</p>
                    </div>
                </div>
                <div className="text-left no-print flex gap-2 no-print-capture">
                    <button onClick={handleExportPDF} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 px-4 shadow-sm font-bold transition-all">
                        <FileOutput size={18} /> تصدير PDF
                    </button>
                    <button onClick={() => window.handlePrint('supplier-statement-area')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"><Printer size={18}/></button>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">بيانات المورد:</p>
                    <p className="font-bold text-lg">{supplier.name}</p>
                    <p className="text-sm text-gray-600">{supplier.phone}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-left border border-purple-100">
                    <p className="text-xs text-purple-600 mb-1">صافي الرصيد المستحق (للمورد):</p>
                    <p className="font-bold text-2xl text-purple-700 font-mono">{formatCurrency(reportData.closingBalance)}</p>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 font-bold">
                            <th className="px-4 py-3 border">التاريخ</th>
                            <th className="px-4 py-3 border">البيان / المرجع</th>
                            <th className="px-4 py-3 border text-left">مدين (-) دفع/مرتجع</th>
                            <th className="px-4 py-3 border text-left">دائن (+) مشتريات</th>
                            <th className="px-4 py-3 border text-left">الرصيد المتبقي</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-purple-50/30 font-semibold italic">
                            <td className="px-4 py-3 border" colSpan={2}>رصيد سابق (مستحقات سابقة)</td>
                            <td className="px-4 py-3 border text-left">—</td>
                            <td className="px-4 py-3 border text-left">—</td>
                            <td className="px-4 py-3 border font-mono text-left">{formatCurrency(reportData.openingBalance)}</td>
                        </tr>
                        {reportData.movements.length > 0 ? reportData.movements.map((m, i) => (
                            <tr key={i} className="hover:bg-gray-50 border-b">
                                <td className="px-4 py-3 border whitespace-nowrap">{m.date}</td>
                                <td className="px-4 py-3 border">
                                    <div className="font-medium">{m.description}</div>
                                    <div className="text-xs text-gray-400 font-mono">{m.ref}</div>
                                </td>
                                <td className="px-4 py-3 border font-mono text-left text-red-500">{m.debit > 0 ? formatCurrency(m.debit) : '-'}</td>
                                <td className="px-4 py-3 border font-mono text-left text-purple-600">{m.credit > 0 ? formatCurrency(m.credit) : '-'}</td>
                                <td className="px-4 py-3 border font-mono text-left font-bold">{formatCurrency(m.balance)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-gray-400 italic">لا توجد حركات مسجلة في هذه الفترة</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-purple-600 text-white font-bold">
                            <td className="px-6 py-4 border text-right" colSpan={2}>إجمالي مستحقات المورد الحالية</td>
                            <td className="px-6 py-4 border text-left font-mono" colSpan={3}>{formatCurrency(reportData.closingBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             <div className="mt-12 text-center text-xs text-gray-400 italic border-t pt-4">
                تم استخراج هذا الكشف آلياً بتاريخ {new Date().toLocaleString('ar-EG')}
            </div>
        </div>
    );
};

export default SupplierStatement;
