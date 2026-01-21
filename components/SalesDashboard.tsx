import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { DollarSign, FileCheck, FileClock, Percent, BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Stat Card component
const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full ltr:mr-4 rtl:ml-4 ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  </div>
);

const SalesDashboard: React.FC = () => {
  const { invoices, customers, formatCurrency, t, language } = useAppContext();

  const salesData = useMemo(() => {
    if (invoices.length === 0) {
      return {
        totalSales: 0,
        paidInvoicesCount: 0,
        unpaidInvoicesCount: 0,
        avgInvoiceValue: 0,
        salesByMonth: [],
        topCustomers: [],
        topItems: [],
      };
    }

    // --- KPIs ---
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidInvoicesCount = invoices.filter(inv => inv.paidAmount >= inv.totalAmount - (inv.returnedAmount || 0)).length;
    const unpaidInvoicesCount = invoices.length - paidInvoicesCount;
    const avgInvoiceValue = totalSales / invoices.length;

    // --- Sales Over Time (Last 12 months) ---
    const salesByMonthMap: { [key: string]: number } = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    invoices.forEach(inv => {
      const invDate = new Date(inv.issueDate);
      if (invDate >= twelveMonthsAgo) {
        const monthKey = `${invDate.getFullYear()}-${(invDate.getMonth() + 1).toString().padStart(2, '0')}`;
        salesByMonthMap[monthKey] = (salesByMonthMap[monthKey] || 0) + inv.totalAmount;
      }
    });

    const salesByMonth = Object.entries(salesByMonthMap)
      .map(([key, sales]) => ({ 
          key, 
          name: new Date(key + '-02').toLocaleString(language === 'ar' ? 'ar-KW' : 'en-US', { month: 'short', year: '2-digit' }), 
          [t('sales')]: sales 
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // --- Top Customers ---
    const customerSales: { [key: string]: number } = {};
    invoices.forEach(inv => {
      customerSales[inv.customerId] = (customerSales[inv.customerId] || 0) + inv.totalAmount;
    });

    const topCustomers = Object.entries(customerSales)
      .map(([customerId, total]) => {
        const customer = customers.find(c => c.id === customerId);
        return { name: customer?.name || 'Unknown', total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // --- Top Selling Items ---
    const itemSales: { [key: string]: number } = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        itemSales[item.description] = (itemSales[item.description] || 0) + (item.quantity * item.unitPrice);
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { totalSales, paidInvoicesCount, unpaidInvoicesCount, avgInvoiceValue, salesByMonth, topCustomers, topItems };
  }, [invoices, customers, t, language]);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">لا توجد بيانات مبيعات</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة بعض الفواتير لعرض لوحة تحكم المبيعات.</p>
      </div>
    );
  }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_sales')} value={formatCurrency(salesData.totalSales)} icon={DollarSign} color="bg-blue-500" />
        <StatCard title={t('paid_invoices')} value={salesData.paidInvoicesCount.toString()} icon={FileCheck} color="bg-green-500" />
        <StatCard title={t('unpaid_invoices')} value={salesData.unpaidInvoicesCount.toString()} icon={FileClock} color="bg-red-500" />
        <StatCard title={t('average_invoice_value')} value={formatCurrency(salesData.avgInvoiceValue)} icon={Percent} color="bg-yellow-500" />
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t('sales_over_time')}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={salesData.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(value) => new Intl.NumberFormat('ar-EG', { notation: 'compact' }).format(value as number)} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#4b5563', direction: language === 'ar' ? 'rtl' : 'ltr' }} formatter={(value: number) => [formatCurrency(value), t('sales')]} />
                    <Bar dataKey={t('sales')} fill="#3b82f6" name={t('sales')} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t('top_customers')}</h3>
          <ul className="space-y-3">
            {salesData.topCustomers.map((customer, index) => (
              <li key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 font-bold ltr:mr-3 rtl:ml-3">{index + 1}</span>
                  <span>{customer.name}</span>
                </div>
                <span className="font-bold font-mono">{formatCurrency(customer.total)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t('top_selling_items')}</h3>
           <div style={{ width: '100%', height: 200 }}>
             <ResponsiveContainer>
                <PieChart>
                    <Pie data={salesData.topItems} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false}>
                         {salesData.topItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{direction: language === 'ar' ? 'rtl' : 'ltr'}}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
