import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { Calendar, Repeat, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category_id: '',
    frequency: 'monthly',
    next_due_date: ''
  });

  useEffect(() => {
    fetchRecurringExpenses();
    fetchCategories();
  }, []);

  const fetchRecurringExpenses = async () => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        *,
        expense_categories (name, icon)
      `)
      .order('next_due_date', { ascending: true });

    if (error) {
      toast.error('Failed to fetch recurring expenses');
    } else {
      setRecurringExpenses(data);
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
    const { error } = await supabase.from('recurring_expenses').insert([{
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      user_id: (await supabase.auth.getUser()).data.user.id
    }]);

    if (error) {
      toast.error('Failed to add recurring expense');
    } else {
      toast.success('Recurring expense added');
      setNewExpense({
        amount: '',
        description: '',
        category_id: '',
        frequency: 'monthly',
        next_due_date: ''
      });
      fetchRecurringExpenses();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring expense');
    } else {
      toast.success('Recurring expense deleted');
      fetchRecurringExpenses();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">Add Recurring Expense</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                required
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="₹"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                required
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                value={newExpense.category_id}
                onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                required
                value={newExpense.frequency}
                onChange={(e) => setNewExpense({ ...newExpense, frequency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Due Date</label>
              <input
                type="date"
                required
                value={newExpense.next_due_date}
                onChange={(e) => setNewExpense({ ...newExpense, next_due_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Expense
          </button>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recurring Expenses</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {recurringExpenses.map((expense) => (
              <li key={expense.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Next due: {new Date(expense.next_due_date).toLocaleDateString()}</span>
                      <Repeat className="h-4 w-4 mx-1" />
                      <span className="capitalize">{expense.frequency}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(expense.id)}
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