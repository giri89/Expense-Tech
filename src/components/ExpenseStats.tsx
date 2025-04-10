import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExpenseStats() {
  const [categoryStats, setCategoryStats] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [averageExpense, setAverageExpense] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Fetch category-wise stats
    const { data: categoryData } = await supabase
      .from('expenses')
      .select(`
        category,
        amount
      `);

    if (categoryData) {
      const stats = categoryData.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount);
        acc[curr.category] = (acc[curr.category] || 0) + amount;
        return acc;
      }, {});

      const formattedStats = Object.entries(stats).map(([category, amount]) => ({
        category,
        amount,
      }));

      setCategoryStats(formattedStats);

      // Calculate total
      const total = categoryData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      setTotalExpenses(total);

      // Calculate average
      setAverageExpense(total / categoryData.length || 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Average Expense</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(averageExpense)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {categoryStats.length}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category-wise Expenses</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="amount" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}