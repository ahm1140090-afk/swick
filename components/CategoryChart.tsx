
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { TransactionType, CategoryChartData } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const CategoryChart: React.FC = () => {
    const { transactions, accounts, formatCurrency, language } = useAppContext();

    const chartData = useMemo((): CategoryChartData[] => {
        const accountData: { [key: string]: number } = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.accountId)
            .forEach(t => {
                if (t.accountId) {
                    if (!accountData[t.accountId]) {
                        accountData[t.accountId] = 0;
                    }
                    accountData[t.accountId] += t.amount;
                }
            });

        return Object.entries(accountData).map(([accountId, value]) => {
            const account = accounts.find(a => a.id === accountId);
            return { name: account?.name || 'غير معروف', value };
        });
    }, [transactions, accounts]);
    
    if (chartData.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات مصروفات لعرضها.</div>
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.9)',
                            borderColor: '#4b5563',
                            color: '#e5e7eb',
                            direction: language === 'ar' ? 'rtl' : 'ltr'
                        }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CategoryChart;
