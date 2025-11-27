import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { manufacturingAPI, recipeAPI } from '../../services/api';
import './BatchForm.css';

const BatchForm = ({ isOpen, onClose, onSuccess, batch = null }) => {
  const [formData, setFormData] = useState({
    productName: '',
    recipeId: '',
    quantityPlanned: '',
    notes: ''
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const { success, error } = useNotification();
  const isEditMode = !!batch;

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
      if (batch) {
        setFormData({
          productName: batch.productName || '',
          recipeId: batch.recipe?._id || batch.recipe || '',
          quantityPlanned: batch.quantityPlanned || '',
          notes: batch.notes || ''
        });
      }
    }
  }, [isOpen, batch]);

  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const response = await recipeAPI.getAll();
      setRecipes(response.recipes || []);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.productName || !formData.quantityPlanned) {
      error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName,
        recipeId: formData.recipeId || null,
        quantityPlanned: parseInt(formData.quantityPlanned),
        notes: formData.notes
      };

      if (isEditMode) {
        await manufacturingAPI.updateBatch(batch._id || batch.id, payload);
        success('Batch updated successfully!');
      } else {
        await manufacturingAPI.createBatch(payload);
        success('Batch created successfully!');
      }

      setFormData({
        productName: '',
        recipeId: '',
        quantityPlanned: '',
        notes: ''
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.error || `Failed to ${isEditMode ? 'update' : 'create'} batch`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isEditMode) {
      setFormData({
        productName: '',
        recipeId: '',
        quantityPlanned: '',
        notes: ''
      });
    }
    onClose();
  };

  const footer = (
    <div className="modal-footer-actions">
      <Button variant="secondary" onClick={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {isEditMode ? 'Update Batch' : 'Create Batch'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Batch' : 'Create New Batch'}
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="batch-form">
        <div className="form-group">
          <label htmlFor="productName">Product Name *</label>
          <input
            type="text"
            id="productName"
            placeholder="Enter product name"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="recipe">Recipe (Optional)</label>
          <select
            id="recipe"
            value={formData.recipeId}
            onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
            disabled={loadingRecipes}
          >
            <option value="">Select a recipe (or use custom)</option>
            {recipes.map((recipe) => (
              <option key={recipe._id} value={recipe._id}>
                {recipe.name}
              </option>
            ))}
          </select>
          {loadingRecipes && <small className="form-hint">Loading recipes...</small>}
        </div>

        <div className="form-group">
          <label htmlFor="quantityPlanned">Quantity Planned *</label>
          <input
            type="number"
            id="quantityPlanned"
            min="1"
            placeholder="Enter planned quantity"
            value={formData.quantityPlanned}
            onChange={(e) => setFormData({ ...formData, quantityPlanned: e.target.value })}
            required
          />
          <small className="form-hint">Number of units to produce</small>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            rows="4"
            placeholder="Add any additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {isEditMode && batch?.status !== 'planned' && (
          <div className="alert alert-info">
            Note: This batch is {batch.status}. Only planned batches can be edited.
          </div>
        )}
      </form>
    </Modal>
  );
};

export default BatchForm;
