
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bill, AccountType, Attachment, Product } from '../types';
import { X, Plus, Trash2, UserPlus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import AttachmentManager from './AttachmentManager';
import SupplierForm from './SupplierForm';

interface BillFormProps {
  bill: Bill | null;
  onClose: () => void;
}

const BillForm: React.FC<BillFormProps> = ({ bill, onClose }) => {
  const { addBill, updateBill, accounts, suppliers, costCenters, setIsEditing, products, formatCurrency } = useAppContext();
  
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isCash, setIsCash] = useState(false);
  const [assetAccountId, setAssetAccountId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [costCenterId, setCostCenterId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    billDate: new Date().toISOString().split('T')[0],
    accountId: 'asset-inventory', 
    billNumber: '',
    orderNumber: '',
  });

  const [items, setItems] = useState<{ id: string, productId: string, quantity: number, unitCost: number }[]>([]);

  useEffect(() => {
    setIsEditing(true);
    return () => setIsEditing(false);
  }, [setIsEditing]);

  const { purchaseAccounts, assetAccounts, costCenterOptions } = useMemo(() => ({
    purchaseAccounts: accounts.filter(a => (a.type === AccountType.EXPENSE || a.id === 'asset-inventory') && a.parentId !== null)
        .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` })),
    assetAccounts: accounts.filter(a => a.type === AccountType.ASSET && a.parentId !== null)
        .map(acc => ({ value: acc.id, label: `${acc.accountNumber ? `(${acc.accountNumber}) ` : ''}${acc.name}` })),
    costCenterOptions: costCenters.map(cc => ({ value: cc.id, label: cc.name })),
  }), [accounts, costCenters]);

  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: s.id, label: s.name })), [suppliers]);
  const productOptions = useMemo(() => products.map((p: Product) => ({ value: p.id, label: p.name })), [products]);

  useEffect(() => {
    if (bill) {
      setFormData({
        name: bill.name,
        billDate: bill.billDate,
        accountId: bill.accountId,
        billNumber: bill.billNumber || '',
        orderNumber: bill.orderNumber || '',
      });
      setSelectedSupplierId(bill.supplierId || '');
      setIsCash(!!bill.isCash);
      setCostCenterId(bill.costCenterId || '');
      setAttachments(bill.attachments || []);
      setItems(bill.items ? bill.items.map(it => ({ ...it, id: `it-${Math.random()}` })) : []);
    } else {
        setIsCash(false);
        if (assetAccounts.length > 0) setAssetAccountId(assetAccounts[0].value);
    }
  }, [bill, assetAccounts]);

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, { id: `it-${Date.now()}`, productId: '', quantity: 1, unitCost: 0 }]);
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const totalAmount = useMemo(() => {
    if (items.length > 0) return items.reduce((sum, it) => sum + (it.quantity * it.unitCost), 0);
    return parseFloat(formData.name) || 0; // Fallback for simple amount bills if needed, though items are preferred
  }, [items, formData.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
        alert("الرجاء اختيار المورد.");
        return;
    }
    if (isCash && !assetAccountId) {
        alert("الرجاء اختيار حساب النقدية/البنك.");
        return;
    }
    const billData = {
      ...formData,
      amount: totalAmount,
      items: items.map(({ id, ...rest }) => rest),
      isCash,
      assetAccountId: isCash ? assetAccountId : undefined,
      attachments,
      costCenterId: costCenterId || undefined,
      supplierId: selectedSupplierId
    };
    if (bill) updateBill({ ...bill, ...billData });
    else addBill(billData);
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 py-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{bill ? 'تعديل الفاتورة' : 'إضافة فاتورة مشتريات'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-700 w-fit">
                <button type="button" onClick={() => setIsCash(false)} className={`px-4 py-2 text-sm rounded-md ${!isCash ? 'bg-white shadow font-bold' : ''}`}>آجلة</button>
                <button type="button" onClick={() => setIsCash(true)} className={`px-4 py-2 text-sm rounded-md ${isCash ? 'bg-white shadow font-bold' : ''}`}>نقدية</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold">المورد</label>
                        <button type="button" onClick={() => setShowAddSupplier(true)} className="text-xs text-blue-600 flex items-center gap-1 font-bold hover:underline">
                            <Plus size={14} /> مورد جديد
                        </button>
                    </div>
                    <SearchableSelect options={supplierOptions} value={selectedSupplierId} onChange={setSelectedSupplierId} placeholder="اختر مورد" required />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-bold">رقم الفاتورة</label>
                    <input type="text" name="billNumber" value={formData.billNumber} onChange={e => setFormData(p => ({...p, billNumber: e.target.value}))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-bold">رقم الطلب</label>
                    <input type="text" name="orderNumber" value={formData.orderNumber} onChange={e => setFormData(p => ({...p, orderNumber: e.target.value}))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm" placeholder="اختياري" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 text-sm font-bold">تاريخ الفاتورة</label>
                    <input type="date" value={formData.billDate} onChange={e => setFormData(p => ({...p, billDate: e.target.value}))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm" required />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-bold">الحساب المدين</label>
                    <SearchableSelect options={purchaseAccounts} value={formData.accountId} onChange={v => setFormData(p => ({...p, accountId: v}))} required />
                </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">البنود المشتراة <span className="text-xs font-normal text-gray-500">(تؤثر على المخزون)</span></h3>
                <div className="space-y-2">
                    {items.map(it => (
                        <div key={it.id} className="grid grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                            <div className="col-span-5">
                                <SearchableSelect options={productOptions} value={it.productId} onChange={v => handleItemChange(it.id, 'productId', v)} placeholder="اختر منتج" />
                            </div>
                            <div className="col-span-3">
                                <input type="number" placeholder="الكمية" value={it.quantity} onChange={e => handleItemChange(it.id, 'quantity', parseFloat(e.target.value))} className="w-full p-2 border rounded-lg text-sm" required />
                            </div>
                            <div className="col-span-3">
                                <input type="number" placeholder="تكلفة الوحدة" value={it.unitCost} onChange={e => handleItemChange(it.id, 'unitCost', parseFloat(e.target.value))} className="w-full p-2 border rounded-lg text-sm" required />
                            </div>
                            <div className="col-span-1 flex items-center justify-center">
                                <button type="button" onClick={() => removeItem(it.id)} className="text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 font-bold hover:underline">+ إضافة منتج</button>
            </div>

            <div className="flex justify-between items-end bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div>
                    <label className="block mb-1 text-sm font-bold">مركز التكلفة</label>
                    <SearchableSelect options={costCenterOptions} value={costCenterId} onChange={setCostCenterId} placeholder="اختياري" />
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">إجمالي الفاتورة</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                </div>
            </div>

            {isCash && (
                <div>
                    <label className="block mb-1 text-sm font-bold">الدفع من حساب</label>
                    <SearchableSelect options={assetAccounts} value={assetAccountId} onChange={setAssetAccountId} required />
                </div>
            )}
            
            <AttachmentManager attachments={attachments} setAttachments={setAttachments} />
            
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold">إلغاء</button>
                <button type="submit" className="px-8 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg">حفظ الفاتورة وتوريد المخزن</button>
            </div>
        </form>
      </div>
    </div>
    {showAddSupplier && <SupplierForm supplier={null} onClose={() => setShowAddSupplier(false)} />}
    </>
  );
};

export default BillForm;
