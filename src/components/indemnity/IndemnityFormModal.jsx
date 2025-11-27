import { useState } from 'react';
import Modal from '../common/Modal';
import IndemnityFormSigner from './IndemnityFormSigner';
import { indemnityAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const IndemnityFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  serviceType,
  customer,
  additionalData = {}
}) => {
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useNotification();

  const handleSign = async (formData) => {
    setLoading(true);
    try {
      // Extract customer ID properly - handle walk-in guests
      const customerId = typeof customer === 'string' ? customer : customer?._id;

      // Merge form data with additional service-specific data
      const completeFormData = {
        ...formData,
        ...additionalData,
        serviceType
      };

      // Only add customer if it exists (for registered customers, not walk-in guests)
      if (customerId) {
        completeFormData.customer = customerId;
      }

      // Call the appropriate API based on service type
      let response;
      switch (serviceType) {
        case 'gym':
          response = await indemnityAPI.createGymForm(completeFormData);
          break;
        case 'guest_pass':
          response = await indemnityAPI.createGuestPassForm(completeFormData);
          break;
        case 'childcare':
          response = await indemnityAPI.createChildcareForm(completeFormData);
          break;
        case 'spa':
          response = await indemnityAPI.createSpaForm(completeFormData);
          break;
        default:
          response = await indemnityAPI.create(completeFormData);
      }

      success('Indemnity form signed successfully!');

      if (onSuccess) {
        await onSuccess(response.data);
      }

      onClose();
    } catch (err) {
      console.error('Failed to sign indemnity form:', err);
      showError(err.message || 'Failed to sign indemnity form. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign Indemnity Form"
      size="large"
    >
      <IndemnityFormSigner
        serviceType={serviceType}
        customer={customer}
        onSign={handleSign}
        onCancel={onClose}
        loading={loading}
      />
    </Modal>
  );
};

export default IndemnityFormModal;
