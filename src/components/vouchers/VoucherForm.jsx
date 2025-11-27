import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { voucherAPI, customerAPI } from '../../services/api';
import './VoucherForm.css';

const VoucherForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    customerSearch: '',
    type: 'spa',
    value: '',
    expiryDate: ''
  });
  const [customers, setCustomers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const { success, error } = useNotification();

  const handleCustomerSearch = async (searchTerm) => {
    setFormData({ ...formData, customerSearch: searchTerm });

    if (searchTerm.length < 2) {
      setCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const response = await customerAPI.getAll({ search: searchTerm, limit: 10 });
      setCustomers(response.data?.customers || []);
      setShowCustomerDropdown(true);
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customerId: customer._id,
      customerSearch: `${customer.firstName} ${customer.lastName} (${customer.email})`
    });
    setShowCustomerDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId || !formData.type || !formData.value || !formData.expiryDate) {
      error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await voucherAPI.createVoucher({
        customerId: formData.customerId,
        type: formData.type,
        value: parseFloat(formData.value),
        expiryDate: formData.expiryDate
      });

      success('Voucher created successfully!');
      setFormData({
        customerId: '',
        customerSearch: '',
        type: 'spa',
        value: '',
        expiryDate: ''
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.error || 'Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="modal-footer-actions">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        Create Voucher
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Voucher"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="voucher-form">
        <div className="form-group">
          <label htmlFor="customer">Customer *</label>
          <div className="customer-search-wrapper">
            <input
              type="text"
              id="customer"
              placeholder="Search customer by name or email..."
              value={formData.customerSearch}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              required
            />
            {searching && <span className="search-loading">Searching...</span>}
            {showCustomerDropdown && customers.length > 0 && (
              <div className="customer-dropdown">
                {customers.map((customer) => (
                  <div
                    key={customer._id}
                    className="customer-option"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="customer-name">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="customer-email">{customer.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="type">Voucher Type *</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="spa">Spa ($50)</option>
            <option value="childcare">Childcare (1 hour)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="value">Value *</label>
          <input
            type="number"
            id="value"
            min="0"
            step="0.01"
            placeholder={formData.type === 'spa' ? 'Enter dollar amount' : 'Enter hours'}
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
          <small className="form-hint">
            {formData.type === 'spa' ? 'Dollar amount (e.g., 50)' : 'Number of hours (e.g., 1)'}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Expiry Date *</label>
          <input
            type="date"
            id="expiryDate"
            min={new Date().toISOString().split('T')[0]}
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default VoucherForm;
