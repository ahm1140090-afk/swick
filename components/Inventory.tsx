
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Product, UserRole } from '../types';
import { Plus, Edit, Trash2, Search, Printer, Download, FileSpreadsheet, AlertTriangle, Package, Upload } from 'lucide-react';
import ProductForm from './ProductForm';
import CSVImportModal from './CSVImportModal';

const Inventory: React.FC = () => {
    const { products, deleteProduct, formatCurrency, canEdit, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const lower = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            p.sku.toLowerCase().includes(lower) ||
            p.category?.toLowerCase().includes(lower)
        );
    }, [products, searchQuery]);

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleExportCSV = () => {
        const headers = {
            sku: 'SKU',
            name: 'اسم المنتج',
            category: 'الفئة',
            currentStock: 'الكمية الحالية',
            unit: 'الوحدة',
            unitCost: 'التكلفة',
            salePrice: 'سعر البيع',
            reorderPoint: 'حد الطلب'
        };
        window.handleExportCSV(filteredProducts, headers, 'Inventory');
    };

    const getStockStatus = (p: Product) => {
        if (p.currentStock <= 0) return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">{t('out_of_stock')}</span>;
        if (p.currentStock <= p.reorderPoint) return <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> {t('low_stock')}</span>;
        return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{t('in_stock')}</span>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Package className="text-blue-500" size={28} />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('inventory')}
                    </h2>
                </div>
                
                <div className="relative w-full lg:w-64">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 no-print w-full lg:w-auto justify-end">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold"
                    >
                        <Upload size={18} className="ml-2" />
                        استيراد
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
                    >
                        <FileSpreadsheet size={18} className="ml-2" />
                        تصدير Excel
                    </button>
                    {canEdit && (
                        <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-bold">
                            <Plus size={18} /> {t('add_product')}
                        </button>
                    )}
                </div>
            </div>

            <div id="printable-area" ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">الاسم</th>
                            <th scope="col" className="px-6 py-3">الكمية</th>
                            <th scope="col" className="px-6 py-3">التكلفة</th>
                            <th scope="col" className="px-6 py-3">سعر البيع</th>
                            <th scope="col" className="px-6 py-3">الحالة</th>
                            {canEdit && <th scope="col" className="px-6 py-3 no-print">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono">{p.sku}</td>
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{p.name}</td>
                                <td className="px-6 py-4 font-mono">{p.currentStock} {p.unit}</td>
                                <td className="px-6 py-4 font-mono">{formatCurrency(p.unitCost)}</td>
                                <td className="px-6 py-4 font-mono">{formatCurrency(p.salePrice)}</td>
                                <td className="px-6 py-4">{getStockStatus(p)}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 flex gap-2 no-print">
                                        <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                        <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500 italic">
                                    لا توجد منتجات مطابقة للبحث.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <ProductForm product={editingProduct} onClose={() => setIsModalOpen(false)} />}
            
            {isImportModalOpen && (
                <CSVImportModal 
                  type="inventory" 
                  onClose={() => setIsImportModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default Inventory;
