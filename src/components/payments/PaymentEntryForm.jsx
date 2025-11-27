import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { paymentRecordsAPI, customerAPI } from '../../services/api';

const PaymentEntryForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    customer: '',
    businessUnit: '',
    paymentType: 'service',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    taxRate: 15,
    discount: 0,
    discountReason: '',
    paymentMethod: 'cash',
    amountPaid: 0,
    changeHandling: 'returned',
    splitPayments: [],
    paymentReference: '',
    notes: ''
  });

  const [recentCustomers, setRecentCustomers] = useState([]);
  const [customerResults, setCustomerResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
    change: 0
  });
  const [loading, setLoading] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const dropdownBlurTimeout = useRef(null);

  const { error: showError } = useNotification();

  const selectedCustomerIsMember = Boolean(
    selectedCustomer?.gymMembership ||
    selectedCustomer?.membership ||
    selectedCustomer?.membershipId
  );

  const outstandingAmount = Math.max(0, calculations.total - formData.amountPaid);

  // Search customers
  const searchCustomers = async (term) => {
    if (!term || term.length < 2) {
      setCustomerResults(recentCustomers);
      return;
    }

    try {
      setSearching(true);
      const response = await customerAPI.getAll({ search: term, limit: 10 });
      if (response.success) {
        const results = response.data?.customers || response.customers || [];
        setCustomerResults(results);
      } else {
        setCustomerResults([]);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const loadRecentCustomers = async () => {
      try {
        setSearching(true);
        const response = await customerAPI.getAll({ limit: 10 });
        if (response.success) {
          const list = response.data?.customers || response.customers || [];
          setRecentCustomers(list);
          setCustomerResults(list);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setSearching(false);
      }
    };

    loadRecentCustomers();
    return () => {
      if (dropdownBlurTimeout.current) {
        clearTimeout(dropdownBlurTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setCustomerResults(recentCustomers);
        return;
      }
      searchCustomers(searchTerm.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, recentCustomers]);

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = (subtotal * formData.taxRate) / 100;
    const total = subtotal + tax - formData.discount;
    const change = Math.max(0, formData.amountPaid - total);

    setCalculations({ subtotal, tax, total, change });
  }, [formData.items, formData.taxRate, formData.discount, formData.amountPaid]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...formData, customer: customer._id });
    setSearchTerm(`${customer.firstName} ${customer.lastName}`);
    setIsDropdownOpen(false);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;

    // Recalculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddSplitPayment = () => {
    setFormData({
      ...formData,
      splitPayments: [
        ...formData.splitPayments,
        { method: 'cash', amount: 0, reference: '' }
      ]
    });
  };

  const handleSplitPaymentChange = (index, field, value) => {
    const newSplitPayments = [...formData.splitPayments];
    newSplitPayments[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, splitPayments: newSplitPayments });
  };

  const removeSplitPayment = (index) => {
    setFormData({
      ...formData,
      splitPayments: formData.splitPayments.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer) {
      showError('Please select a customer');
      return;
    }

    if (formData.items.some(item => !item.description || item.unitPrice <= 0)) {
      showError('Please fill in all item details');
      return;
    }

    if (formData.amountPaid < calculations.total && !selectedCustomerIsMember) {
      showError('Amount paid is less than total amount. Only members can carry a balance.');
      return;
    }

    try {
      setLoading(true);

      const paymentData = {
        ...formData,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        totalAmount: calculations.total
      };

      const response = await paymentRecordsAPI.recordPayment(paymentData);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      showError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--gray-700)',
    marginBottom: 'var(--spacing-sm)'
  };

  const inputStyle = {
    width: '100%',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '0.9375rem',
    transition: 'all var(--transition-base)',
    outline: 'none'
  };

  const sectionStyle = {
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--gray-200)',
    background: 'var(--white)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: 'var(--spacing-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
      {/* Step 1: Customer & Payment Context */}
      <section style={sectionStyle}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
            Step 1
          </p>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginTop: 'var(--spacing-xs)' }}>
            Customer & Payment Context
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
            Search for the customer and capture the payment basics.
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            Customer *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (dropdownBlurTimeout.current) {
                  clearTimeout(dropdownBlurTimeout.current);
                }
                setIsDropdownOpen(true);
              }}
              onBlur={() => {
                dropdownBlurTimeout.current = setTimeout(() => setIsDropdownOpen(false), 150);
              }}
              placeholder="Search customer by name, email, or phone..."
              style={{ ...inputStyle, paddingRight: '3rem' }}
              required
            />
            <div style={{ position: 'absolute', right: 'var(--spacing-md)', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--gray-400)', pointerEvents: 'none' }}>
              {searching && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
              <Search size={20} />
            </div>

            {isDropdownOpen && (
              <div
                style={{ position: 'absolute', zIndex: 20, marginTop: 'var(--spacing-sm)', width: '100%', maxHeight: '288px', overflowY: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', background: 'var(--white)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {searching ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xl)', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Searching customers...
                  </div>
                ) : customerResults.length === 0 ? (
                  <div style={{ padding: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    {searchTerm.trim().length >= 2
                      ? `No matches for "${searchTerm}"`
                      : 'No customers available yet'}
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'var(--gray-50)', padding: 'var(--spacing-sm) var(--spacing-lg)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>
                      {searchTerm.trim().length >= 2 ? 'Search results' : 'Recent customers'}
                    </div>
                    <div>
                      {customerResults.map((customer) => (
                        <button
                          type="button"
                          key={customer._id}
                          onClick={() => handleCustomerSelect(customer)}
                          style={{ width: '100%', padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'left', transition: 'background var(--transition-base)', border: 'none', borderTop: '1px solid var(--gray-100)', background: 'transparent', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9f5ff'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                            {customer.email} • {customer.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            Start typing a name, email, or phone number. Recent customers appear automatically.
          </p>

          {selectedCustomer && (
            <div style={{ marginTop: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', background: '#dcfce7', padding: 'var(--spacing-lg)', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ fontWeight: '500', color: '#166534' }}>
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '2px' }}>
                {selectedCustomer.email} • {selectedCustomer.phone}
              </div>
              {selectedCustomerIsMember && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 'var(--spacing-sm)', padding: '6px 10px', background: '#ecfdf3', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Member • Eligible to carry a balance
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div>
            <label style={labelStyle}>
              Business Unit *
            </label>
            <select
              value={formData.businessUnit}
              onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="">Select Business Unit</option>
              <option value="gym">The Ring (Gym)</option>
              <option value="spa">The Olive Room (Spa)</option>
              <option value="manufacturing">The Edit Collection</option>
              <option value="childcare">Childcare</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Payment Type *
            </label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              style={inputStyle}
              required
            >
              <option value="subscription">Subscription</option>
              <option value="service">Service</option>
              <option value="product">Product</option>
              <option value="membership">Membership</option>
              <option value="class">Class</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            Description *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={inputStyle}
            placeholder="E.g., Monthly Gym Membership"
            required
          />
        </div>
      </section>

      {/* Step 2: Items & Pricing */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              Step 2
            </p>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginTop: 'var(--spacing-xs)' }}>
              Items & Pricing
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
              Build out the line items and confirm totals before payment.
            </p>
          </div>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {formData.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', padding: 'var(--spacing-lg)' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
                  style={inputStyle}
                  required
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  placeholder="Qty"
                  min="1"
                  style={inputStyle}
                  required
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  placeholder="Unit Price"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-md)' }}>
                <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-300)', background: 'var(--white)', padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right', fontWeight: '500' }}>
                  ${item.totalPrice.toFixed(2)}
                </div>
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div>
            <label style={labelStyle}>
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.1"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Discount Amount ($)
            </label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
        </div>

        {formData.discount > 0 && (
          <div>
            <label style={labelStyle}>
              Discount Reason
            </label>
            <input
              type="text"
              value={formData.discountReason}
              onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
              style={inputStyle}
              placeholder="E.g., Loyalty discount"
            />
          </div>
        )}

        <div style={{ borderRadius: 'var(--radius-lg)', border: '2px solid #e9d5ff', background: '#f3e8ff', padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--gray-700)' }}>Subtotal:</span>
            <span style={{ fontWeight: '500' }}>${calculations.subtotal.toFixed(2)}</span>
          </div>
          {formData.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#15803d' }}>
              <span>Discount:</span>
              <span style={{ fontWeight: '500' }}>-${formData.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--gray-700)' }}>Tax ({formData.taxRate}%):</span>
            <span style={{ fontWeight: '500' }}>${calculations.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e9d5ff', paddingTop: 'var(--spacing-sm)', fontSize: '1.125rem', fontWeight: '700', color: '#7c3aed' }}>
            <span>Total:</span>
            <span>${calculations.total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Step 3: Payment & Notes */}
      <section style={sectionStyle}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
            Step 3
          </p>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginTop: 'var(--spacing-xs)' }}>
            Payment & Notes
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
            Choose how the customer paid and log any supporting notes.
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            Payment Method *
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => {
              setFormData({ ...formData, paymentMethod: e.target.value });
              if (e.target.value !== 'split') {
                setShowSplitPayment(false);
                setFormData(prev => ({ ...prev, splitPayments: [] }));
              } else {
                setShowSplitPayment(true);
              }
            }}
            style={inputStyle}
            required
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="account_balance">Account Balance</option>
            <option value="split">Split Payment</option>
          </select>
        </div>

        {showSplitPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Split Payment Methods
              </label>
              <Button type="button" size="sm" onClick={handleAddSplitPayment}>
                <Plus className="w-4 h-4 mr-1" />
                Add Method
              </Button>
            </div>

            {formData.splitPayments.map((split, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                  <select
                    value={split.method}
                    onChange={(e) => handleSplitPaymentChange(index, 'method', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="account_balance">Account Balance</option>
                  </select>
                  <input
                    type="number"
                    value={split.amount}
                    onChange={(e) => handleSplitPaymentChange(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={split.reference}
                    onChange={(e) => handleSplitPaymentChange(index, 'reference', e.target.value)}
                    placeholder="Reference (optional)"
                    style={inputStyle}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeSplitPayment(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Total split: ${formData.splitPayments.reduce((sum, s) => sum + s.amount, 0).toFixed(2)} / ${calculations.total.toFixed(2)}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div>
            <label style={labelStyle}>
              Amount Paid * {formData.paymentMethod === 'split' && '(Total of splits)'}
            </label>
            <input
              type="number"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              style={inputStyle}
              required
            />
            {formData.paymentMethod === 'split' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
                onClick={() => {
                  const total = formData.splitPayments.reduce((sum, s) => sum + s.amount, 0);
                  setFormData({ ...formData, amountPaid: total });
                }}
              >
                Auto-fill from splits
              </Button>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Change Handling
            </label>
            <select
              value={formData.changeHandling}
              onChange={(e) => setFormData({ ...formData, changeHandling: e.target.value })}
              style={inputStyle}
            >
              <option value="returned">Return to Customer</option>
              <option value="added_to_account">Add to Account Balance</option>
              <option value="donated">Donated</option>
            </select>
          </div>
        </div>

        {outstandingAmount > 0 && (
          <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid #fef08a', background: '#fffbeb', padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#854d0e' }}>Outstanding Balance:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#854d0e' }}>
                ${outstandingAmount.toFixed(2)}
              </span>
            </div>
            <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem', color: '#854d0e' }}>
              {selectedCustomerIsMember
                ? 'Will be added to the member account to clear later.'
                : 'Collect the full amount for non-members before recording.'}
            </div>
          </div>
        )}

        {calculations.change > 0 && (
          <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', background: '#dcfce7', padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500', color: '#166534' }}>Change Amount:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d' }}>
                ${calculations.change.toFixed(2)}
              </span>
            </div>
            <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem', color: '#15803d' }}>
              {formData.changeHandling === 'added_to_account'
                ? 'Will be added to customer account balance'
                : formData.changeHandling === 'returned'
                ? 'Will be returned to customer'
                : 'Will be recorded as donation'}
            </div>
          </div>
        )}

        {formData.paymentMethod !== 'cash' && (
          <div>
            <label style={labelStyle}>
              Payment Reference
            </label>
            <input
              type="text"
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              style={inputStyle}
              placeholder="Transaction ID, Receipt number, etc."
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            placeholder="Additional notes about this payment..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', borderTop: '1px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            Double-check the totals before recording the payment.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.customer}>
              {loading ? 'Recording Payment...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </section>
    </form>
  );
};

export default PaymentEntryForm;
