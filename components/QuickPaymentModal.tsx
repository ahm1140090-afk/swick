
import React, { useState, useEffect, useMemo } from 'react';
import { X, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Invoice, Bill, AccountType } from '../types';
import SearchableSelect from './SearchableSelect';

interface QuickPaymentModalProps {
  item: Invoice | Bill;
  type: 'invoice' | 'bill';
  onClose: () => void;
}

const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({ item, type, onClose }) => {
  const { addPaymentReceipt, addPaymentVoucher, accounts, suppliers, formatCurrency, setIsEditing } = useAppContext();

  const remainingAmount = 'totalAmount' in item
    ? item.totalAmount - (item.paidAmount || 0) - (item.returnedAmount || 0)
    : item.amount - (item.paidAmount || 0) - (item.returnedAmount || 0);

  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetAccountId, setAssetAccountId] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    setIsEditing(true);
    return () => {
        setIsEditing(false);
    };
  }, [setIsEditing]);


  const assetAccounts = useMemo(() =>
    accounts.filter(a => a.type === AccountType.ASSET && a.parentId).sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '', 'ar-EG-u-kn-true'))
    .map(a => ({ value: a.id, label: `${a.accountNumber ? `(${a.accountNumber}) ` : ''}${a.name}` })),
    [accounts]
  );

  useEffect(() => {
    if (assetAccounts.length > 0) {
      setAssetAccountId(assetAccounts[0].value);
    }
  }, [assetAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح.');
      return;
    }
    if (paymentAmount > remainingAmount + 0.001) { // Add a small tolerance for floating point issues
      alert('مبلغ الدفعة أكبر من المبلغ المتبقي.');
      return;
    }
    if (!assetAccountId) {
      alert('الرجاء اختيار حساب الدفع.');
      return;
    }

    if (type === 'invoice') {
      const invoice = item as Invoice;
      addPaymentReceipt({
        customerId: invoice.customerId,
        amount: paymentAmount,
        date: date,
        assetAccountId: assetAccountId,
        // FIX: Corrected property from `revenueAccountId` to `accountId` and set it to the customer's A/R account.
        accountId: `customer-${invoice.customerId}`,
        description: `دفعة من فاتورة رقم ${invoice.invoiceNumber}`,
        invoiceId: invoice.id,
        checkNumber: checkNumber || undefined,
        referenceNumber: referenceNumber || undefined,
      });
    } else {
      const bill = item as Bill;
      const supplierName = suppliers.find(s => s.id === bill.supplierId)?.name || 'غير معروف';
      addPaymentVoucher({
        payeeName: supplierName,
        amount: paymentAmount,
        date: date,
        assetAccountId: assetAccountId,
        accountId: `supplier-${bill.supplierId}`,
        description: `دفعة من فاتورة مشتريات #${bill.billNumber || bill.name}`,
        billId: bill.id,
        checkNumber: checkNumber || undefined,
        referenceNumber: referenceNumber || undefined,
      });
    }

    onClose();
  };

  // FIX: Cast 'item' to 'Bill' to safely access the 'name' property, which doesn't exist on the 'Invoice' type.
  const title = type === 'invoice'
    ? `تسجيل دفعة للفاتورة #${(item as Invoice).invoiceNumber}`
    : `تسجيل دفعة لفاتورة المشتريات #${(item as Bill).billNumber || (item as Bill).name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ المتبقي</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">مبلغ الدفعة</label>
              <input type="number" step="any" name="amount" value={amount} onChange={e => setAmount(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">تاريخ الدفع</label>
              <input type="date" name="date" value={date} onChange={e => setDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" required />
            </div>
          </div>
          <div>
            <label htmlFor="assetAccountId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">الدفع من حساب</label>
            <SearchableSelect
              options={assetAccounts}
              value={assetAccountId}
              onChange={setAssetAccountId}
              placeholder="-- اختر حساب --"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم الشيك (اختياري)</label>
              <input type="text" name="checkNumber" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label htmlFor="referenceNumber" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">رقم مرجعي (اختياري)</label>
              <input type="text" name="referenceNumber" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 ml-2">إلغاء</button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <Wallet size={18} className="ml-2" />
              تأكيد الدفع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickPaymentModal;
