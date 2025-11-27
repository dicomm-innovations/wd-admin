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
  const [initialCustomers, setInitialCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [profileSummary, setProfileSummary] = useState(null);
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
    loadInitialCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers();
    } else if (initialCustomers.length > 0) {
      setCustomers(initialCustomers);
    }
  }, [searchTerm, initialCustomers]);

  const loadInitialCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll({ limit: 20 });
      if (response.success) {
        const list = response.customers || response.data?.customers || [];
        setInitialCustomers(list);
        setCustomers(list);
      }
    } catch (err) {
      showError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

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

      const [accountRes, transactionsRes, summaryRes] = await Promise.all([
        paymentRecordsAPI.getCustomerAccount(customer._id),
        paymentRecordsAPI.getTransactions(customer._id, { limit: 50 }),
        customerAPI.getProfileSummary(customer._id)
      ]);

      if (accountRes.success) {
        setAccountData(accountRes.data);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data.transactions);
      }

      if (summaryRes?.success) {
        setProfileSummary(summaryRes.summary || summaryRes.data?.summary || null);
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
      credit: 'txn-type-credit',
      debit: 'txn-type-debit',
      refund: 'txn-type-refund',
      change_added: 'txn-type-change',
      bonus: 'txn-type-bonus',
      adjustment: 'txn-type-adjustment'
    };
    return colors[type] || 'txn-type-default';
  };

  const getTransactionIcon = (type) => {
    const isCredit = ['credit', 'refund', 'change_added', 'bonus'].includes(type);
    return isCredit ? <TrendingUp className="txn-icon" /> : <TrendingDown className="txn-icon" />;
  };

  const totalCredits = transactions
    .filter(txn => ['credit', 'refund', 'change_added', 'bonus'].includes(txn.type))
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalDebits = transactions
    .filter(txn => txn.type === 'debit')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const businessUnits = profileSummary?.businessUnits || [];
  const membership = profileSummary?.membership;
  const vouchers = profileSummary?.vouchers;
  const children = profileSummary?.children || [];

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
                  className="customer-card"
                  style={{ padding: 'var(--spacing-lg)', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', background: 'var(--white)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-base)' }}
                >
                  <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>{customer.email}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{customer.phone}</div>
                  <div className="customer-card-hint" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.8125rem', color: '#298ca3', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Click to view account</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {customers.length === 0 && !selectedCustomer && (
            <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--gray-500)' }}>
              {loading ? 'Loading customers...' : 'No customers yet. Start typing to search.'}
            </div>
          )}
        </Card>

        {/* Customer Account Details */}
        {selectedCustomer && accountData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            {/* Customer Snapshot */}
            <div className="grid grid-3" style={{ gap: 'var(--spacing-lg)' }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Account Balance</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(accountData.accountBalance || 0)}</h3>
                  </div>
                  <Badge variant="success">Wallet</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Credits: <span style={{ color: 'var(--success)' }}>{formatCurrency(totalCredits)}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Debits: <span style={{ color: 'var(--error)' }}>{formatCurrency(totalDebits)}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Customer Overview</p>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {profileSummary?.customer?.name || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  <div>Customer ID: <span style={{ fontWeight: '500' }}>{profileSummary?.customer?.customerId || selectedCustomer.customerId}</span></div>
                  <div>Loyalty Points: <span style={{ fontWeight: '500' }}>{profileSummary?.loyaltyPoints ?? 0}</span></div>
                  <div>Children: <span style={{ fontWeight: '500' }}>{children.length}</span></div>
                  <div>Vouchers: <span style={{ fontWeight: '500' }}>{vouchers?.total ?? 0}</span></div>
                </div>
                {businessUnits.length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {businessUnits.map((unit) => (
                      <Badge key={unit.unit || unit} variant="info">
                        {unit.unit || unit}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Membership</p>
                {membership ? (
                  <>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>{membership.membershipNumber || membership.membershipId || 'Active membership'}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-700)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <Badge variant="success">{(membership.type || 'standard').toUpperCase()}</Badge>
                      <span>Started: {membership.startDate ? format(new Date(membership.startDate), 'MMM dd, yyyy') : 'N/A'}</span>
                      <span>Status: {membership.status || 'active'}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.95rem', color: 'var(--gray-600)' }}>No active membership on file</div>
                )}
                {vouchers?.total > 0 && (
                  <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                    Vouchers: {vouchers.total} (Spa: {vouchers.spa || 0}, Childcare: {vouchers.childcare || 0})
                  </div>
                )}
              </Card>
            </div>

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
                    setProfileSummary(null);
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
