import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function ExpenseCalendar() {
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchExpenses();
  }, [selectedDate]);

  const fetchExpenses = async () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (!error) {
      setExpenses(data);
    }
  };

  const getDayExpenses = (date) => {
    return expenses.filter(expense => 
      format(new Date(expense.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getDayTotal = (date) => {
    const dayExpenses = getDayExpenses(date);
    return dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Expense Calendar</h3>
          <input
            type="month"
            value={format(selectedDate, 'yyyy-MM')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            const dayExpenses = getDayExpenses(date);
            const hasExpenses = dayExpenses.length > 0;
            const total = getDayTotal(date);

            return (
              <div
                key={date.toISOString()}
                className={`
                  p-2 border rounded-lg text-center
                  ${hasExpenses ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200'}
                `}
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(date, 'd')}
                </div>
                {hasExpenses && (
                  <div className="mt-1 text-xs font-medium text-indigo-600">
                    {formatCurrency(total)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="space-y-4">
          {days.map(date => {
            const dayExpenses = getDayExpenses(date);
            if (dayExpenses.length === 0) return null;

            return (
              <div key={date.toISOString()} className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {format(date, 'MMMM d, yyyy')}
                  </h4>
                  <span className="text-indigo-600 font-medium">
                    {formatCurrency(getDayTotal(date))}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{expense.description}</span>
                      <span className="text-gray-900">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}