
import React, { useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Printer, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface InventoryReportProps {
    startDate: string;
    endDate: string;
}

const InventoryReport: React.FC<InventoryReportProps> = ({ startDate, endDate }) => {
    const { products, formatCurrency, t, companyInfo } = useAppContext();
    const reportRef = useRef<HTMLDivElement>(null);

    const reportData = useMemo(() => {
        const items = products.map(p => ({
            ...p,
            totalValue: p.currentStock * p.unitCost,
            isLowStock: p.currentStock <= p.reorderPoint && p.currentStock > 0,
            isOutOfStock: p.currentStock <= 0,
        }));

        const totalInventoryValue = items.reduce((sum, i) => sum + i.totalValue, 0);
        const lowStockCount = items.filter(i => i.isLowStock).length;
        const outOfStockCount = items.filter(i => i.isOutOfStock).length;

        return { items, totalInventoryValue, lowStockCount, outOfStockCount };
    }, [products]);

    const handleExportPDF = async () => {
        try {
            await window.ensurePdfLibsLoaded();
        } catch (error) {
            alert("فشل تحميل مكتبات التصدير.");
            return;
        }

        const element = reportRef.current;
        if (!element) return;

        window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' })
        .then((canvas: HTMLCanvasElement) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const ratio = canvas.width / canvas.height;
            let imgWidth = pdfWidth - 40;
            let imgHeight = imgWidth / ratio;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
            pdf.save(`Inventory_Report_${startDate}_to_${endDate}.pdf`);
        });
    };

    const handleExportCSV = () => {
        const headers = { sku: 'SKU', name: 'المنتج', stock: 'الكمية', cost: 'التكلفة', valuation: 'القيمة الإجمالية' };
        const data = reportData.items.map(i => ({
            sku: i.sku,
            name: i.name,
            stock: i.currentStock,
            cost: i.unitCost,
            valuation: i.totalValue
        }));
        window.handleExportCSV(data, headers, 'Inventory_Report');
    };

    return (
        <div id="inventory-report-area" ref={reportRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div className="flex justify-between items-start mb-6">
                <div className="text-right flex-grow">
                    <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                    <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300">{t('inventory_report')}</h2>
                    <p className="text-sm text-gray-500">للفترة من {startDate} إلى {endDate}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button onClick={() => window.handlePrint('inventory-report-area')} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><Printer size={18}/></button>
                    <button onClick={handleExportPDF} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 text-blue-600"><Download size={18}/></button>
                    <button onClick={handleExportCSV} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 text-green-600"><FileSpreadsheet size={18}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-600 dark:text-blue-400">{t('total_inventory_value')}</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(reportData.totalInventoryValue)}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100">
                    <p className="text-sm text-orange-600 dark:text-orange-400">تنبيهات انخفاض المخزون</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{reportData.lowStockCount}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100">
                    <p className="text-sm text-red-600 dark:text-red-400">أصناف منتهية</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-200">{reportData.outOfStockCount}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">{t('product_name')}</th>
                            <th className="px-4 py-3">{t('stock_level')}</th>
                            <th className="px-4 py-3">{t('reorder_point')}</th>
                            <th className="px-4 py-3">{t('unit_cost')}</th>
                            <th className="px-4 py-3">{t('valuation')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.items.map(item => (
                            <tr key={item.id} className={`border-b dark:border-gray-700 ${item.isOutOfStock ? 'bg-red-50 dark:bg-red-900/10' : item.isLowStock ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                <td className="px-4 py-3 font-mono">{item.sku}</td>
                                <td className="px-4 py-3 font-bold">{item.name}</td>
                                <td className={`px-4 py-3 font-bold ${item.isOutOfStock ? 'text-red-600' : item.isLowStock ? 'text-orange-600' : ''}`}>
                                    {item.currentStock} {item.unit}
                                </td>
                                <td className="px-4 py-3">{item.reorderPoint}</td>
                                <td className="px-4 py-3 font-mono">{formatCurrency(item.unitCost)}</td>
                                <td className="px-4 py-3 font-mono font-bold">{formatCurrency(item.totalValue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryReport;
