import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BudgetLimits() {
  const [budgetLimits, setBudgetLimits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
    period: 'monthly'
  });

  useEffect(() => {
    fetchBudgetLimits();
    fetchCategories();
  }, []);

  const fetchBudgetLimits = async () => {
    const { data, error } = await supabase
      .from('budget_limits')
      .select(`
        *,
        expense_categories (name, icon)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch budget limits');
    } else {
      setBudgetLimits(data);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch categories');
    } else {
      setCategories(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('budget_limits').insert([{
      ...newBudget,
      amount: parseFloat(newBudget.amount),
      user_id: (await supabase.auth.getUser()).data.user.id
    }]);

    if (error) {
      toast.error('Failed to add budget limit');
    } else {
      toast.success('Budget limit added');
      setNewBudget({
        category_id: '',
        amount: '',
        period: 'monthly'
      });
      fetchBudgetLimits();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('budget_limits')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete budget limit');
    } else {
      toast.success('Budget limit deleted');
      fetchBudgetLimits();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">Add Budget Limit</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                value={newBudget.category_id}
                onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                required
                value={newBudget.amount}
                onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="₹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <select
                required
                value={newBudget.period}
                onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget Limit
          </button>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Budget Limits</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {budgetLimits.map((budget) => (
              <li key={budget.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {budget.expense_categories.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 capitalize">
                      {budget.period} limit
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(budget.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}