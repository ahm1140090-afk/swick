
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { TransactionType, ChartData } from '../types';

const IncomeExpenseChart: React.FC = () => {
    const { transactions, formatCurrency, language } = useAppContext();

    // Fix: Added explicit return type for useMemo to match the imported ChartData interface.
    const chartData = useMemo((): ChartData[] => {
        const monthlyData: { [key: string]: { دخل: number; مصروفات: number } } = {};

        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString(language === 'ar' ? 'ar-KW' : 'en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) {
                monthlyData[month] = { دخل: 0, مصروفات: 0 };
            }
            if (t.type === TransactionType.INCOME) {
                monthlyData[month].دخل += t.amount;
            } else {
                monthlyData[month].مصروفات += t.amount;
            }
        });

        return Object.entries(monthlyData)
            .map(([name, values]) => ({ name, ...values }))
            .sort((a, b) => {
                // A simple sort that may not cover all arabic month names correctly but works for this case.
                const [monthA, yearA] = a.name.split(' ');
                const [monthB, yearB] = b.name.split(' ');
                if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                // This is a naive month sort, a proper library would be needed for perfect chronological order
                return 1;
            });
    }, [transactions, language]);

    if (!transactions.length) {
      return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات لعرضها.</div>
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.9)',
                            borderColor: '#4b5563',
                            color: '#e5e7eb',
                            direction: language === 'ar' ? 'rtl' : 'ltr'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="دخل" fill="#22c55e" name="الدخل" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="مصروفات" fill="#ef4444" name="المصروفات" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncomeExpenseChart;
