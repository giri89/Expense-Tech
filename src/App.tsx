import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, 
  PieChart, 
  LogOut, 
  Plus, 
  Trash2, 
  Settings, 
  Home,
  TrendingUp,
  Calendar,
  CreditCard,
  Menu,
  X,
  FileSpreadsheet,
  Clock,
  Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

// Import new components
import ExpenseStats from './components/ExpenseStats';
import ExpenseCalendar from './components/ExpenseCalendar';
import RecurringExpenses from './components/RecurringExpenses';
import BudgetLimits from './components/BudgetLimits';
import ExpenseExport from './components/ExpenseExport';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', category: 'other' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [monthlyBudget, setMonthlyBudget] = useState(2000);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setView('expenses');
        fetchExpenses();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('expenses');
        fetchExpenses();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchExpenses = async () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch expenses');
    } else {
      setExpenses(data);
    }
  };

  useEffect(() => {
    if (session) {
      fetchExpenses();
    }
  }, [selectedMonth]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
      } else if (view === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Registration successful! Please check your email.');
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success('Password reset instructions sent to your email.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('expenses').insert([
        {
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          category: newExpense.category,
          user_id: session.user.id,
        },
      ]);

      if (error) throw error;
      toast.success('Expense added successfully');
      setNewExpense({ amount: '', description: '', category: 'other' });
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  };

  const getCategoryExpenses = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const renderSidebarLink = (icon, text, tabName) => (
    <button
      onClick={() => {
        setActiveTab(tabName);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
        activeTab === tabName ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <Wallet className="mx-auto h-12 w-12 text-indigo-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {view === 'login' ? 'Welcome back' : view === 'register' ? 'Create account' : 'Reset password'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {view !== 'forgot' && (
                <input
                  type="password"
                  required={view !== 'forgot'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              )}
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? 'Processing...' : view === 'login' ? 'Sign in' : view === 'register' ? 'Sign up' : 'Reset password'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              {view === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setView('register')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow-sm">
        <div className="flex items-center h-16 px-4">
          <Wallet className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-semibold text-gray-900">Expense Tech</span>
        </div>
        <div className="flex-1 flex flex-col p-4 space-y-2">
          {renderSidebarLink(<Home className="h-5 w-5" />, 'Dashboard', 'dashboard')}
          {renderSidebarLink(<TrendingUp className="h-5 w-5" />, 'Analytics', 'analytics')}
          {renderSidebarLink(<Calendar className="h-5 w-5" />, 'Calendar', 'calendar')}
          {renderSidebarLink(<CreditCard className="h-5 w-5" />, 'Expenses', 'expenses')}
          {renderSidebarLink(<Clock className="h-5 w-5" />, 'Recurring', 'recurring')}
          {renderSidebarLink(<Target className="h-5 w-5" />, 'Budget Limits', 'budget')}
          {renderSidebarLink(<FileSpreadsheet className="h-5 w-5" />, 'Export', 'export')}
          {renderSidebarLink(<Settings className="h-5 w-5" />, 'Settings', 'settings')}
        </div>
        <div className="p-4 border-t">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">TechStack</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-t px-2 py-3">
            {renderSidebarLink(<Home className="h-5 w-5" />, 'Dashboard', 'dashboard')}
            {renderSidebarLink(<TrendingUp className="h-5 w-5" />, 'Analytics', 'analytics')}
            {renderSidebarLink(<Calendar className="h-5 w-5" />, 'Calendar', 'calendar')}
            {renderSidebarLink(<CreditCard className="h-5 w-5" />, 'Expenses', 'expenses')}
            {renderSidebarLink(<Clock className="h-5 w-5" />, 'Recurring', 'recurring')}
            {renderSidebarLink(<Target className="h-5 w-5" />, 'Budget Limits', 'budget')}
            {renderSidebarLink(<FileSpreadsheet className="h-5 w-5" />, 'Export', 'export')}
            {renderSidebarLink(<Settings className="h-5 w-5" />, 'Settings', 'settings')}
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center space-x-2 w-full p-3 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <ExpenseStats />
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Spending Trends</h3>
                  <div className="mt-4" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={expenses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="created_at" tickFormatter={(date) => format(new Date(date), 'MMM d')} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="amount" stroke="#4F46E5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
                  <div className="mt-4" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={getCategoryExpenses()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getCategoryExpenses().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {getCategoryExpenses().map((category, index) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-600 capitalize">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeTab === 'calendar' && (
            <ExpenseCalendar />
          )}

          {/* Expenses View */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Add Expense Form */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Expense</h3>
                  <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="food">Food</option>
                        <option value="transport">Transport</option>
                        <option value="utilities">Utilities</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </button>
                  </form>
                </div>
              </div>

              {/* Expense List */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Expenses</h3>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <li key={expense.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(expense.created_at), 'PPP')} • {expense.category}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="text-lg font-semibold text-gray-900">
                              ₹{parseFloat(expense.amount).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
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
          )}

          {/* Recurring Expenses View */}
          {activeTab === 'recurring' && (
            <RecurringExpenses />
          )}

          {/* Budget Limits View */}
          {activeTab === 'budget' && (
            <BudgetLimits />
          )}

          {/* Export View */}
          {activeTab === 'export' && (
            <ExpenseExport />
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-500">{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => toast.success('Password reset email sent')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={format(selectedMonth, 'yyyy-MM')}
                    onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;