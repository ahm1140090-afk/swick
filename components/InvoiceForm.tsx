
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Invoice, InvoiceItem, AccountType, Attachment, Product } from '../types';
import { X, Plus, Trash2, UserPlus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import AttachmentManager from './AttachmentManager';
import CustomerForm from './CustomerForm';

interface InvoiceFormProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onClose }) => {
  const { customers, addInvoice, updateInvoice, invoices, accounts, formatCurrency, setIsEditing, products } = useAppContext();
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCash, setIsCash] = useState(false);
  const [assetAccountId, setAssetAccountId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    orderNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    revenueAccountId: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [total, setTotal] = useState(0);

  const { revenueAccounts, assetAccounts } = useMemo(() => ({
    revenueAccounts: accounts.filter(a => a.type === AccountType.REVENUE && a.parentId !== null).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
        .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` })),
    assetAccounts: accounts.filter(a => a.type === AccountType.ASSET && a.parentId !== null).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
        .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` }))
  }), [accounts]);

  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name })), [customers]);
  const productOptions = useMemo(() => products.map((p: Product) => ({ value: p.id, label: `${p.name} (متوفر: ${p.currentStock})` })), [products]);

  useEffect(() => {
    setIsEditing(true);
    return () => setIsEditing(false);
  }, [setIsEditing]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: invoice.orderNumber || '',
        issueDate: invoice.issueDate,
        revenueAccountId: invoice.revenueAccountId,
      });
      setSelectedCustomerId(invoice.customerId);
      setItems(invoice.items.map(item => ({...item}))); 
      setIsCash(!!invoice.isCash);
      setAttachments(invoice.attachments || []);
    } else {
       const lastInvoiceNumber = invoices.reduce((max, inv) => {
            const num = parseInt(inv.invoiceNumber.split('-')[1] || '0', 10);
            return num > max ? num : max;
        }, 0);
        const newInvoiceNumber = `INV-${(lastInvoiceNumber + 1).toString().padStart(3, '0')}`;
        setFormData(prev => ({ 
            ...prev, 
            invoiceNumber: newInvoiceNumber,
            revenueAccountId: prev.revenueAccountId || (accounts.find(a => a.id === 'rev-sales')?.id || (revenueAccounts.length > 0 ? revenueAccounts[0].value : ''))
        }));
        setIsCash(false);
        if (assetAccounts.length > 0) setAssetAccountId(assetAccounts[0].value);
    }
  }, [invoice, invoices, accounts, revenueAccounts, assetAccounts]);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    setTotal(newTotal);
  }, [items]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(prevItems => prevItems.map(item => {
        if (item.id === id) {
            const updated = { ...item, [field]: value };
            if (field === 'productId' && value) {
                const product = products.find((p: Product) => p.id === value);
                if (product) {
                    updated.description = product.name;
                    updated.unitPrice = product.salePrice;
                }
            }
            return updated;
        }
        return item;
    }));
  };
  
  const addItem = () => setItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
        alert("الرجاء اختيار العميل.");
        return;
    }
    if (isCash && !assetAccountId) {
        alert("الرجاء اختيار حساب النقدية/البنك للفاتورة النقدية.");
        return;
    }
    const invoiceData = { 
        ...formData, 
        items, 
        attachments, 
        isCash, 
        assetAccountId: isCash ? assetAccountId : undefined, 
        customerId: selectedCustomerId 
    };
    if (invoice) {
        updateInvoice({ ...invoice, ...invoiceData, totalAmount: total });
    } else {
        addInvoice(invoiceData);
    }
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-10 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{invoice ? `تعديل الفاتورة #${invoice.invoiceNumber}` : 'فاتورة جديدة'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-700 w-fit">
                <button type="button" onClick={() => setIsCash(false)} className={`px-4 py-2 text-sm rounded-md transition-colors ${!isCash ? 'bg-white dark:bg-gray-800 shadow font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>فاتورة آجلة</button>
                <button type="button" onClick={() => setIsCash(true)} className={`px-4 py-2 text-sm rounded-md transition-colors ${isCash ? 'bg-white dark:bg-gray-800 shadow font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>فاتورة نقدية</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="customerId" className="text-sm font-medium text-gray-900 dark:text-white">العميل</label>
                        <button type="button" onClick={() => setShowAddCustomer(true)} className="text-xs text-blue-600 flex items-center gap-1 font-bold hover:underline">
                            <Plus size={14} /> عميل جديد
                        </button>
                    </div>
                    <SearchableSelect
                        id="customerId"
                        options={customerOptions}
                        value={selectedCustomerId}
                        onChange={setSelectedCustomerId}
                        placeholder="اختر عميل من القائمة"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="invoiceNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الفاتورة</label>
                    <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="orderNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الطلب</label>
                    <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" placeholder="اختياري" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="issueDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">تاريخ الإصدار</label>
                    <input type="date" name="issueDate" value={formData.issueDate} onChange={handleFormChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="revenueAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">حساب الإيراد</label>
                    <SearchableSelect
                        name="revenueAccountId"
                        id="revenueAccountId"
                        value={formData.revenueAccountId}
                        onChange={(value) => setFormData(prev => ({ ...prev, revenueAccountId: value }))}
                        options={revenueAccounts}
                        placeholder="-- اختر حساب إيراد --"
                        required
                    />
                </div>
            </div>

            {isCash && (
                <div>
                    <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">إيداع في حساب</label>
                    <SearchableSelect
                        name="assetAccountId"
                        id="assetAccountId"
                        value={assetAccountId}
                        onChange={setAssetAccountId}
                        options={assetAccounts}
                        placeholder="-- اختر حساب --"
                        required
                    />
                </div>
            )}

            <div className="pt-4">
                <h3 className="text-lg font-semibold mb-2">البنود (المخزون)</h3>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border dark:border-gray-700">
                           <div className="col-span-5">
                                <label className="block mb-1 text-xs text-gray-500">المنتج / الوصف</label>
                                <div className="space-y-1">
                                    <SearchableSelect
                                        value={item.productId || ''}
                                        onChange={v => handleItemChange(item.id, 'productId', v)}
                                        options={productOptions}
                                        placeholder="اختر منتج من المخزن"
                                    />
                                    <input type="text" placeholder="وصف مخصص للفاتورة" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" required />
                                </div>
                           </div>
                           <div className="col-span-2">
                                <label className="block mb-1 text-xs text-gray-500">الكمية</label>
                                <input type="number" placeholder="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" required />
                           </div>
                            <div className="col-span-2">
                                <label className="block mb-1 text-xs text-gray-500">السعر</label>
                                <input type="number" placeholder="0.00" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))} className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" required />
                           </div>
                           <div className="col-span-2">
                               <label className="block mb-1 text-xs text-gray-500">الإجمالي</label>
                               <span className="block p-2 text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.quantity * item.unitPrice)}</span>
                           </div>
                           <div className="col-span-1 flex items-center justify-center pt-6">
                             {items.length > 1 && <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>}
                           </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 flex items-center text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all font-bold">
                    <Plus size={16} className="ml-1"/> إضافة بند جديد
                </button>
            </div>
            
            <AttachmentManager attachments={attachments} setAttachments={setAttachments} />
            
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <div className="text-2xl font-bold flex flex-col items-end">
                    <span className="text-sm text-gray-500">إجمالي الفاتورة</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-3">
                <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-bold">إلغاء</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg">حفظ الفاتورة وتحديث المخزن</button>
            </div>
        </form>
      </div>
    </div>
    {showAddCustomer && <CustomerForm customer={null} onClose={() => setShowAddCustomer(false)} />}
    </>
  );
};

export default InvoiceForm;
