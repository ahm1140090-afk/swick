

import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { FixedAsset, UserRole } from '../types';
import { Plus, Edit, Trash2, Search, Printer, Download, FileSpreadsheet } from 'lucide-react';
import FixedAssetForm from './FixedAssetForm';

const FixedAssets: React.FC = () => {
    const { fixedAssets, deleteFixedAsset, accounts, currentUser, formatCurrency, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.ACCOUNTANT;

    const processedAssets = useMemo(() => {
        return fixedAssets.map(asset => {
            const accumDepAccount = accounts.find(a => a.id === asset.accumulatedDepreciationAccountId);
            // The balance of a contra-asset account will be negative, so we take its absolute value.
            const accumulatedDepreciation = accumDepAccount ? Math.abs(accumDepAccount.balance) : 0;
            const netBookValue = asset.acquisitionCost - accumulatedDepreciation;
            
            return { ...asset, accumulatedDepreciation, netBookValue };
        });
    }, [fixedAssets, accounts]);

    const filteredAssets = useMemo(() => {
        if (!searchQuery) {
            return processedAssets;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return processedAssets.filter(asset =>
            asset.name.toLowerCase().includes(lowercasedQuery) ||
            asset.acquisitionCost.toString().includes(lowercasedQuery) ||
            asset.acquisitionDate.includes(lowercasedQuery)
        );
    }, [processedAssets, searchQuery]);

    const handleAddNew = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    const handleEdit = (asset: FixedAsset) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

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
        titleEl.innerText = t('fixed_assets');
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
            const y = 20; // Position at the top with a margin

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`Fixed_Assets_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    };

    const handleExportCSV = () => {
        const headers = {
            name: 'اسم الأصل',
            acquisitionDate: t('acquisition_date'),
            acquisitionCost: t('acquisition_cost'),
            usefulLifeYears: t('useful_life_years'),
            salvageValue: t('salvage_value'),
            accumulatedDepreciation: t('accumulated_depreciation'),
            netBookValue: t('net_book_value'),
        };
    
        const dataToExport = filteredAssets.map(asset => ({
            name: asset.name,
            acquisitionDate: asset.acquisitionDate,
            acquisitionCost: asset.acquisitionCost,
            usefulLifeYears: asset.usefulLifeYears,
            salvageValue: asset.salvageValue,
            accumulatedDepreciation: asset.accumulatedDepreciation,
            netBookValue: asset.netBookValue,
        }));
    
        window.handleExportCSV(dataToExport, headers, 'Fixed_Assets');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('fixed_assets')}</h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="بحث بالاسم, التاريخ, التكلفة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 no-print self-end sm:self-center">
                     <button onClick={() => window.handlePrint('printable-area')} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <Printer size={18} className="ml-2" /> طباعة
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <Download size={18} className="ml-2" /> تصدير PDF
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} className="ml-2" /> تصدير Excel
                    </button>
                    {canEdit && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={18} className="ml-2" />
                            {t('add_fixed_asset')}
                        </button>
                    )}
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">اسم الأصل</th>
                            <th scope="col" className="px-6 py-3">{t('acquisition_date')}</th>
                            <th scope="col" className="px-6 py-3">{t('acquisition_cost')}</th>
                            <th scope="col" className="px-6 py-3">{t('accumulated_depreciation')}</th>
                            <th scope="col" className="px-6 py-3">{t('net_book_value')}</th>
                            {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                            <tr key={asset.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{asset.name}</td>
                                <td className="px-6 py-4">{asset.acquisitionDate}</td>
                                <td className="px-6 py-4 font-mono">{formatCurrency(asset.acquisitionCost)}</td>
                                <td className="px-6 py-4 font-mono text-orange-600 dark:text-orange-400">{formatCurrency(asset.accumulatedDepreciation)}</td>
                                <td className="px-6 py-4 font-mono font-bold">{formatCurrency(asset.netBookValue)}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex space-x-2 space-x-reverse no-print">
                                        <button onClick={() => handleEdit(asset)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                        <button onClick={() => deleteFixedAsset(asset.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <p>{searchQuery ? 'لا توجد أصول تطابق بحثك.' : 'لا توجد أصول ثابتة لعرضها.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && canEdit && (
                <FixedAssetForm
                    asset={editingAsset}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default FixedAssets;
