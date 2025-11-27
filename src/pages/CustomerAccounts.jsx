import { useState, useEffect } from 'react';
import { Wallet, Search, Plus, Minus, TrendingUp, TrendingDown, Eye, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { paymentRecordsAPI, customerAPI } from '../services/api';
import './CustomerAccounts.css';

const CustomerAccounts = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    notes: ''
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchTerm]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll({ search: searchTerm, limit: 20 });
      if (response.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerAccount = async (customer) => {
    try {
      setLoading(true);
      setSelectedCustomer(customer);

      const [accountRes, transactionsRes] = await Promise.all([
        paymentRecordsAPI.getCustomerAccount(customer._id),
        paymentRecordsAPI.getTransactions(customer._id, { limit: 50 })
      ]);

      if (accountRes.success) {
        setAccountData(accountRes.data);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data.transactions);
      }
    } catch (err) {
      showError(err.message || 'Failed to load customer account');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!formData.description) {
      showError('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      const response = await paymentRecordsAPI.addCredit(selectedCustomer._id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        notes: formData.notes
      });

      if (response.success) {
        success('Credit added successfully');
        setShowCreditModal(false);
        setFormData({ amount: '', description: '', notes: '' });
        loadCustomerAccount(selectedCustomer);
      }
    } catch (err) {
      showError(err.message || 'Failed to add credit');
    } finally {
      setLoading(false);
    }
  };

  const handleDebitAccount = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!formData.description) {
      showError('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      const response = await paymentRecordsAPI.debitAccount(selectedCustomer._id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        notes: formData.notes
      });

      if (response.success) {
        success('Account debited successfully');
        setShowDebitModal(false);
        setFormData({ amount: '', description: '', notes: '' });
        loadCustomerAccount(selectedCustomer);
      }
    } catch (err) {
      showError(err.message || 'Failed to debit account');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      credit: 'text-green-600',
      debit: 'text-red-600',
      refund: 'text-blue-600',
      change_added: 'text-purple-600',
      bonus: 'text-yellow-600',
      adjustment: 'text-gray-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getTransactionIcon = (type) => {
    const isCredit = ['credit', 'refund', 'change_added', 'bonus'].includes(type);
    return isCredit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <Layout>
      <div className="customer-accounts-page">
        {/* Header */}
        <div className="customer-accounts-header">
          <div className="customer-accounts-header-content">
            <h1>Customer Accounts</h1>
            <p>Manage customer account balances and transactions</p>
          </div>
        </div>

        {/* Search */}
        <Card style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer by name, email, or phone..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: '0.95rem' }}
            />
            <Search style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', width: '20px', height: '20px', color: 'var(--gray-400)' }} />
          </div>

          {/* Search Results */}
          {customers.length > 0 && !selectedCustomer && (
            <div style={{ marginTop: 'var(--spacing-xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)' }}>
              {customers.map((customer) => (
                <button
                  key={customer._id}
                  onClick={() => loadCustomerAccount(customer)}
                  style={{ padding: 'var(--spacing-lg)', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', background: 'var(--white)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-base)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.background = 'rgba(35, 131, 155, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.background = 'var(--white)';
                  }}
                >
                  <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{customer.email}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{customer.phone}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Customer Account Details */}
        {selectedCustomer && accountData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            {/* Customer Info & Balance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)' }}>
              {/* Customer Info */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet style={{ width: '32px', height: '32px', color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{selectedCustomer.email}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                  onClick={() => {
                    setSelectedCustomer(null);
                    setAccountData(null);
                    setTransactions([]);
                  }}
                >
                  Search Another Customer
                </Button>
              </Card>

              {/* Account Balance */}
              <Card style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'var(--white)' }}>
                <div style={{ fontSize: '0.875rem', opacity: '0.9', marginBottom: '0.5rem' }}>Available Balance</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                  {formatCurrency(accountData.accountBalance)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', opacity: '0.9' }}>
                  <div>
                    <div>Total Credits</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(accountData.totalCredits)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Total Debits</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(accountData.totalDebits)}</div>
                  </div>
                </div>
              </Card>

              {/* Account Stats */}
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Status</span>
                    <Badge variant={accountData.status === 'active' ? 'success' : 'warning'}>
                      {accountData.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Transactions</span>
                    <span style={{ fontWeight: '600' }}>{accountData.transactionCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Change Added</span>
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                      {formatCurrency(accountData.totalChangeAdded)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Refunds Received</span>
                    <span style={{ fontWeight: '600', color: 'var(--info)' }}>
                      {formatCurrency(accountData.totalRefundsReceived)}
                    </span>
                  </div>
                  {accountData.lastTransactionDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Last Activity</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {format(new Date(accountData.lastTransactionDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <Button onClick={() => setShowCreditModal(true)}>
                <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Add Credit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDebitModal(true)}
                disabled={accountData.accountBalance === 0}
              >
                <Minus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Debit Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTransactionsModal(true)}
              >
                <Eye style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                View All Transactions
              </Button>
            </div>

            {/* Recent Transactions */}
            <Card>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>Recent Transactions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {transactions.slice(0, 10).map((transaction) => {
                  const isCredit = ['credit', 'refund', 'change_added', 'bonus'].includes(
                    transaction.type
                  );
                  return (
                    <div
                      key={transaction.transactionId}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div
                          style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: isCredit ? 'var(--success-light)' : 'var(--error-light)' }}
                        >
                          <div className={getTransactionTypeColor(transaction.type)}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{transaction.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {transaction.transactionId} •{' '}
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                          {transaction.reference && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{transaction.reference}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{ fontWeight: '600', color: isCredit ? 'var(--success)' : 'var(--error)' }}
                        >
                          {isCredit ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          Bal: {formatCurrency(transaction.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {transactions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--gray-500)' }}>
                    No transactions yet
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Add Credit Modal */}
        <Modal
          isOpen={showCreditModal}
          onClose={() => {
            setShowCreditModal(false);
            setFormData({ amount: '', description: '', notes: '' });
          }}
          title="Add Credit to Account"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="0.01"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="E.g., Promotional credit, Compensation, etc."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="Additional notes..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--gray-200)' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreditModal(false);
                  setFormData({ amount: '', description: '', notes: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCredit} disabled={loading}>
                {loading ? 'Adding...' : 'Add Credit'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Debit Account Modal */}
        <Modal
          isOpen={showDebitModal}
          onClose={() => {
            setShowDebitModal(false);
            setFormData({ amount: '', description: '', notes: '' });
          }}
          title="Debit Account"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Available Balance: {formatCurrency(accountData?.accountBalance || 0)}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Amount *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                max={accountData?.accountBalance || 0}
                step="0.01"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="E.g., Used for service payment"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)' }}
                placeholder="Additional notes..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--gray-200)' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDebitModal(false);
                  setFormData({ amount: '', description: '', notes: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleDebitAccount} disabled={loading}>
                {loading ? 'Processing...' : 'Debit Account'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* All Transactions Modal */}
        <Modal
          isOpen={showTransactionsModal}
          onClose={() => setShowTransactionsModal(false)}
          title="All Transactions"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '24rem', overflowY: 'auto' }}>
            {transactions.map((transaction) => {
              const isCredit = ['credit', 'refund', 'change_added', 'bonus'].includes(
                transaction.type
              );
              return (
                <div
                  key={transaction.transactionId}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                    <div
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: isCredit ? 'var(--success-light)' : 'var(--error-light)' }}
                    >
                      <div className={getTransactionTypeColor(transaction.type)}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{transaction.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {transaction.transactionId} •{' '}
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {transaction.reference && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{transaction.reference}</div>
                      )}
                      {transaction.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{transaction.notes}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 'var(--spacing-lg)' }}>
                    <div
                      style={{ fontWeight: '600', color: isCredit ? 'var(--success)' : 'var(--error)' }}
                    >
                      {isCredit ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      Bal: {formatCurrency(transaction.balanceAfter)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default CustomerAccounts;
