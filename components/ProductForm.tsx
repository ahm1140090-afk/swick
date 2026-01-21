
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Product } from '../types';
import { X } from 'lucide-react';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, t } = useAppContext();
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: 'قطعة',
    currentStock: '0',
    reorderPoint: '5',
    unitCost: '0',
    salePrice: '0',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        category: product.category || '',
        unit: product.unit,
        currentStock: product.currentStock.toString(),
        reorderPoint: product.reorderPoint.toString(),
        unitCost: product.unitCost.toString(),
        salePrice: product.salePrice.toString(),
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock) || 0,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        unitCost: parseFloat(formData.unitCost) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
    };

    if (product) {
        updateProduct({ ...product, ...data });
    } else {
        addProduct(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">{product ? t('edit_product') : t('add_product')}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('product_name')}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">الفئة</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('unit')}</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" placeholder="قطعة، كجم..." />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">المخزون الحالي</label>
                    <input type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">نقطة إعادة الطلب</label>
                    <input type="number" name="reorderPoint" value={formData.reorderPoint} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">سعر التكلفة</label>
                    <input type="number" name="unitCost" value={formData.unitCost} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">سعر البيع</label>
                    <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">{t('confirm')}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
