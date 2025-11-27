import { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, Building2, Tag, User } from 'lucide-react';
import Button from '../common/Button';
import './ExpenseForm.css';

const ExpenseForm = ({ expense = null, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    category: 'supplies',
    businessUnit: 'all',
    amount: '',
    description: '',
    vendor: '',
    invoiceNumber: '',
    status: 'pending',
    dueDate: '',
    paymentMethod: '',
    notes: '',
    recurring: {
      isRecurring: false,
      frequency: 'monthly'
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || 'supplies',
        businessUnit: expense.businessUnit || 'all',
        amount: expense.amount || '',
        description: expense.description || '',
        vendor: expense.vendor || '',
        invoiceNumber: expense.invoiceNumber || '',
        status: expense.status || 'pending',
        dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
        paymentMethod: expense.paymentMethod || '',
        notes: expense.notes || '',
        recurring: {
          isRecurring: expense.recurring?.isRecurring || false,
          frequency: expense.recurring?.frequency || 'monthly'
        }
      });
    }
  }, [expense]);

  const validate = () => {
    const newErrors = {};

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.businessUnit) newErrors.businessUnit = 'Business unit is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.description) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('recurring.')) {
      const recurringField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurring: {
          ...prev.recurring,
          [recurringField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-grid">
        {/* Category */}
        <div className="form-group">
          <label className="form-label">
            <Tag size={16} />
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-select ${errors.category ? 'error' : ''}`}
          >
            <option value="payroll">Payroll</option>
            <option value="utilities">Utilities</option>
            <option value="supplies">Supplies</option>
            <option value="marketing">Marketing</option>
            <option value="rent">Rent</option>
            <option value="insurance">Insurance</option>
            <option value="maintenance">Maintenance</option>
            <option value="equipment">Equipment</option>
            <option value="professional_services">Professional Services</option>
            <option value="other">Other</option>
          </select>
          {errors.category && <span className="error-text">{errors.category}</span>}
        </div>

        {/* Business Unit */}
        <div className="form-group">
          <label className="form-label">
            <Building2 size={16} />
            Business Unit *
          </label>
          <select
            name="businessUnit"
            value={formData.businessUnit}
            onChange={handleChange}
            className={`form-select ${errors.businessUnit ? 'error' : ''}`}
          >
            <option value="all">All Units</option>
            <option value="gym">Gym</option>
            <option value="spa">Spa</option>
            <option value="childcare">Childcare</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="marketing">Marketing</option>
          </select>
          {errors.businessUnit && <span className="error-text">{errors.businessUnit}</span>}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">
            <DollarSign size={16} />
            Amount *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`form-input ${errors.amount ? 'error' : ''}`}
          />
          {errors.amount && <span className="error-text">{errors.amount}</span>}
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={16} />
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Description */}
        <div className="form-group full-width">
          <label className="form-label">
            <FileText size={16} />
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter expense description..."
            rows="3"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        {/* Vendor */}
        <div className="form-group">
          <label className="form-label">
            <User size={16} />
            Vendor
          </label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            placeholder="Vendor name"
            className="form-input"
          />
        </div>

        {/* Invoice Number */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={16} />
            Invoice Number
          </label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="INV-12345"
            className="form-input"
          />
        </div>

        {/* Due Date */}
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} />
            Due Date
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Payment Method */}
        <div className="form-group">
          <label className="form-label">
            <DollarSign size={16} />
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Notes */}
        <div className="form-group full-width">
          <label className="form-label">
            <FileText size={16} />
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows="2"
            className="form-textarea"
          />
        </div>

        {/* Recurring Expense */}
        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="recurring.isRecurring"
              checked={formData.recurring.isRecurring}
              onChange={handleChange}
            />
            <span>This is a recurring expense</span>
          </label>
        </div>

        {formData.recurring.isRecurring && (
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} />
              Frequency
            </label>
            <select
              name="recurring.frequency"
              value={formData.recurring.frequency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
