import { useState, useEffect } from 'react';
import { User, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { customerAPI } from '../../services/api';
import './IndemnityFormCreator.css';

const IndemnityFormCreator = ({ isOpen, onClose, onProceed }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('gym');
  const [expiryMonths, setExpiryMonths] = useState(12);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll({ limit: 1000 });
      console.log('Customer API response:', response);
      setCustomers(response.customers || response.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm)
    );
  });

  const handleProceed = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(expiryMonths));

    onProceed({
      customer: selectedCustomer._id, // Send only the customer ID, not the whole object
      serviceType: selectedServiceType,
      expiryDate
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Indemnity Form"
      size="medium"
    >
      <div className="indemnity-form-creator">
        {/* Service Type Selection */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={16} />
            Service Type *
          </label>
          <select
            className="form-select"
            value={selectedServiceType}
            onChange={(e) => setSelectedServiceType(e.target.value)}
          >
            <option value="gym">Gym Membership</option>
            <option value="guest_pass">Guest Pass</option>
            <option value="childcare">Childcare</option>
            <option value="spa">Spa Services</option>
          </select>
        </div>

        {/* Expiry Duration */}
        <div className="form-group">
          <label className="form-label">Form Validity Period</label>
          <select
            className="form-select"
            value={expiryMonths}
            onChange={(e) => setExpiryMonths(e.target.value)}
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months (Recommended)</option>
            <option value="24">24 Months</option>
            <option value="0">No Expiry</option>
          </select>
        </div>

        {/* Customer Selection */}
        <div className="form-group">
          <label className="form-label">
            <User size={16} />
            Select Customer *
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Customer List */}
        <div className="customer-list">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No customers found
            </div>
          ) : (
            filteredCustomers.slice(0, 50).map((customer) => (
              <div
                key={customer._id}
                className={`customer-item ${selectedCustomer?._id === customer._id ? 'selected' : ''}`}
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="customer-avatar">
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </div>
                <div className="customer-info">
                  <div className="customer-name">
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div className="customer-details">
                    {customer.email} • {customer.phone}
                  </div>
                </div>
                {selectedCustomer?._id === customer._id && (
                  <div className="customer-selected-icon">✓</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleProceed}
            disabled={!selectedCustomer}
          >
            Proceed to Form
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IndemnityFormCreator;
