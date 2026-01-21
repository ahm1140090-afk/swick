
import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, Check, AlertCircle, FileSpreadsheet, ArrowRight, Table } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TransactionType, AccountType, EntityType } from '../types';

interface CSVImportModalProps {
  type: 'transactions' | 'customers' | 'suppliers' | 'inventory' | 'employees' | 'accounts' | 'receipts' | 'vouchers' | 'invoices' | 'bills' | 'sales_returns' | 'purchase_returns' | 'timesheets';
  onClose: () => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ type, onClose }) => {
  const { 
    addTransaction, addCustomer, addSupplier, addProduct, 
    addEmployee, addAccount, addPaymentReceipt, addPaymentVoucher,
    addInvoice, addBill, addSalesReturn, addPurchaseReturn, addTimesheet,
    t, accounts, customers, suppliers, employees, products, invoices, bills
  } = useAppContext();
  
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = useMemo(() => {
    switch (type) {
        case 'transactions': return ['date', 'description', 'amount', 'type'];
        case 'customers':
        case 'suppliers': return ['name', 'phone'];
        case 'inventory': return ['sku', 'name', 'currentStock', 'unitCost', 'salePrice'];
        case 'employees': return ['name', 'employeeNumber', 'position', 'baseSalary'];
        case 'accounts': return ['name', 'accountNumber', 'type'];
        case 'receipts': return ['date', 'partyName', 'amount', 'assetAccountId'];
        case 'vouchers': return ['date', 'payeeName', 'amount', 'assetAccountId'];
        case 'invoices': return ['invoiceNumber', 'issueDate', 'customerName', 'totalAmount'];
        case 'bills': return ['billNumber', 'billDate', 'supplierName', 'amount'];
        case 'sales_returns': return ['date', 'customerName', 'invoiceNumber', 'amount'];
        case 'purchase_returns': return ['date', 'supplierName', 'billNumber', 'amount'];
        case 'timesheets': return ['employeeName', 'date', 'checkIn', 'checkOut'];
        default: return [];
    }
  }, [type]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(selectedFile, 'UTF-8');
    }
  };

  const detectDelimiter = (line: string): string => {
    const commonDelimiters = [',', ';', '\t', '|'];
    let detected = ',';
    let maxCount = -1;

    commonDelimiters.forEach(d => {
      const count = line.split(d).length;
      if (count > maxCount) {
        maxCount = count;
        detected = d;
      }
    });
    return detected;
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      alert("الملف فارغ أو غير صحيح.");
      return;
    }

    const delimiter = detectDelimiter(lines[0]);
    
    const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(new RegExp(`\\${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      rawHeaders.forEach((header, i) => { obj[header] = values[i]; });
      return obj;
    });

    setHeaders(rawHeaders);
    setData(rows);
    
    const initialMapping: any = {};
    rawHeaders.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('تاريخ') || lower.includes('date')) {
            initialMapping.date = h;
            initialMapping.issueDate = h;
            initialMapping.billDate = h;
        }
        if (lower.includes('وصف') || lower.includes('desc') || lower.includes('statement') || lower.includes('بيان')) {
            initialMapping.description = h;
            initialMapping.name = h;
        }
        if (lower.includes('مبلغ') || lower.includes('amount') || lower.includes('قيمة') || lower.includes('total')) {
            initialMapping.amount = h;
            initialMapping.totalAmount = h;
        }
        if (lower.includes('نوع') || lower.includes('type')) initialMapping.type = h;
        if (lower.includes('اسم') || lower.includes('name') || lower.includes('client') || lower.includes('عميل') || lower.includes('طرف')) {
            initialMapping.name = h;
            initialMapping.payeeName = h;
            initialMapping.customerName = h;
            initialMapping.supplierName = h;
            initialMapping.employeeName = h;
            initialMapping.partyName = h;
        }
        if (lower.includes('صندوق') || lower.includes('bank') || lower.includes('حساب الدفع')) {
            initialMapping.assetAccountId = h;
        }
        if (lower.includes('رقم') || lower.includes('number') || lower.includes('كود')) {
            if (lower.includes('طلب') || lower.includes('order')) initialMapping.orderNumber = h;
            else {
                initialMapping.invoiceNumber = h;
                initialMapping.billNumber = h;
                initialMapping.employeeNumber = h;
                initialMapping.accountNumber = h;
            }
        }
    });
    setMapping(initialMapping);
    setStep('map');
  };

  const handleImport = () => {
    let successCount = 0;
    const processedNames = new Set<string>();

    data.forEach(row => {
        try {
            switch (type) {
                case 'receipts': {
                    const partyName = row[mapping.partyName];
                    const customer = customers.find(c => c.name.trim() === partyName?.trim());
                    addPaymentReceipt({
                        date: row[mapping.date] || new Date().toISOString().split('T')[0],
                        partyName: partyName || 'طرف غير معروف',
                        amount: parseFloat(row[mapping.amount]) || 0,
                        assetAccountId: row[mapping.assetAccountId] || 'asset-cash',
                        accountId: customer ? `customer-${customer.id}` : 'rev-misc',
                        description: row[mapping.description] || 'سند قبض مستورد',
                        customerId: customer?.id || '',
                        partyType: 'customer'
                    });
                    break;
                }
                case 'vouchers': {
                    const payeeName = row[mapping.payeeName];
                    const supplier = suppliers.find(s => s.name.trim() === payeeName?.trim());
                    addPaymentVoucher({
                        date: row[mapping.date] || new Date().toISOString().split('T')[0],
                        payeeName: payeeName || 'مستفيد غير معروف',
                        amount: parseFloat(row[mapping.amount]) || 0,
                        assetAccountId: row[mapping.assetAccountId] || 'asset-cash',
                        accountId: supplier ? `supplier-${supplier.id}` : 'exp-misc',
                        description: row[mapping.description] || 'سند صرف مستورد',
                        payeeId: supplier?.id || '',
                        payeeType: 'supplier'
                    });
                    break;
                }
                case 'invoices':
                    addInvoice({
                        invoiceNumber: row[mapping.invoiceNumber] || `INV-${Date.now()}-${successCount}`,
                        issueDate: row[mapping.issueDate],
                        customerName: row[mapping.customerName],
                        items: [{ id: '1', description: row[mapping.description] || 'مستورد', quantity: 1, unitPrice: parseFloat(row[mapping.totalAmount]) || 0 }],
                        revenueAccountId: 'rev-sales',
                        isCash: false
                    });
                    break;
                case 'bills':
                    addBill({
                        billNumber: row[mapping.billNumber] || `BILL-${Date.now()}-${successCount}`,
                        billDate: row[mapping.billDate],
                        supplierName: row[mapping.supplierName],
                        name: row[mapping.name] || row[mapping.description] || 'فاتورة مستوردة',
                        amount: parseFloat(row[mapping.amount]) || 0,
                        accountId: 'exp-misc',
                        isCash: false
                    });
                    break;
                case 'sales_returns':
                    addSalesReturn({
                        date: row[mapping.date],
                        customerName: row[mapping.customerName],
                        invoiceNumber: row[mapping.invoiceNumber],
                        amount: parseFloat(row[mapping.amount]) || 0,
                        description: row[mapping.description] || 'مرتجع مبيعات مستورد'
                    });
                    break;
                case 'purchase_returns':
                    addPurchaseReturn({
                        date: row[mapping.date],
                        supplierName: row[mapping.supplierName],
                        billNumber: row[mapping.billNumber],
                        amount: parseFloat(row[mapping.amount]) || 0,
                        description: row[mapping.description] || 'مرتجع مشتريات مستورد'
                    });
                    break;
                case 'customers': {
                    const name = row[mapping.name]?.trim();
                    if (name && !processedNames.has(name.toLowerCase())) {
                        const exists = customers.some(c => c.name.trim().toLowerCase() === name.toLowerCase());
                        if (!exists) { addCustomer({ name, phone: row[mapping.phone] || '', email: '', address: '' }); processedNames.add(name.toLowerCase()); }
                    }
                    break;
                }
                case 'suppliers': {
                    const name = row[mapping.name]?.trim();
                    if (name && !processedNames.has(name.toLowerCase())) {
                        const exists = suppliers.some(s => s.name.trim().toLowerCase() === name.toLowerCase());
                        if (!exists) { addSupplier({ name, phone: row[mapping.phone] || '', email: '', address: '' }); processedNames.add(name.toLowerCase()); }
                    }
                    break;
                }
                case 'inventory':
                    addProduct({ sku: row[mapping.sku], name: row[mapping.name], currentStock: parseFloat(row[mapping.currentStock]) || 0, unitCost: parseFloat(row[mapping.unitCost]) || 0, salePrice: parseFloat(row[mapping.salePrice]) || 0, unit: row[mapping.unit] || 'قطعة', reorderPoint: 5 });
                    break;
            }
            successCount++;
        } catch (e) { console.error("Error row:", e); }
    });
    alert(`تم استيراد ${successCount} سجل بنجاح!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" />
            استيراد {t(type as any) || type} من ملف
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div className="text-center space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all group" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={64} className="mx-auto text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                <p className="text-xl font-bold">اضغط هنا لرفع ملف CSV</p>
                <p className="text-sm text-gray-500 mt-2">يمكنك حفظ ملف الإكسيل بصيغة CSV (Comma delimited) قبل الرفع.</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="text-blue-500 shrink-0" size={20} />
                    <p className="text-sm text-blue-700 dark:text-blue-300">يرجى تحديد العمود المقابل لكل حقل في النظام.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {requiredFields.map(field => (
                        <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="w-full sm:w-1/3 text-sm font-bold">{t(`${field}_column` as any) || field}</label>
                            <select 
                                value={mapping[field] || ''} 
                                onChange={(e) => setMapping(prev => ({...prev, [field]: e.target.value}))} 
                                className="w-full sm:w-2/3 p-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                            >
                                <option value="">-- اختر العمود --</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 pt-4">
                    <button onClick={() => setStep('upload')} className="flex-1 bg-gray-100 py-3 rounded-lg font-bold">رجوع</button>
                    <button onClick={() => setStep('preview')} disabled={requiredFields.some(f => !mapping[f])} className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300">المعاينة</button>
                </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
                 <h3 className="font-bold">معاينة البيانات (أول 5 أسطر):</h3>
                 <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>{requiredFields.map(f => <th key={f} className="p-3 border text-right font-bold">{t(`${f}_column` as any) || f}</th>)}</tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 5).map((row, i) => (
                                <tr key={i}>{requiredFields.map(f => <td key={f} className="p-3 border truncate max-w-[150px]">{row[mapping[f]] || '-'}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between items-center pt-6">
                    <button onClick={() => setStep('map')} className="text-blue-600 font-bold underline">تعديل الربط</button>
                    <button onClick={handleImport} className="bg-green-600 text-white px-10 py-3 rounded-lg font-bold flex items-center gap-2"><Check size={20} /> استيراد الآن</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
