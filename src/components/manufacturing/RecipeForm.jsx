import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { recipeAPI, inventoryAPI } from '../../services/api';
import './RecipeForm.css';

const RecipeForm = ({ isOpen, onClose, onSuccess, recipe = null }) => {
  const [formData, setFormData] = useState({
    recipeName: '',
    productName: '',
    description: '',
    expectedYield: { quantity: '', unit: 'units' },
    estimatedLaborHours: '',
    status: 'active',
    ingredients: [],
    instructions: ['']
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const { success, error } = useNotification();
  const isEditMode = !!recipe;

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems();
      if (recipe) {
        setFormData({
          recipeName: recipe.recipeName || '',
          productName: recipe.productName || '',
          description: recipe.description || '',
          expectedYield: recipe.expectedYield || { quantity: '', unit: 'units' },
          estimatedLaborHours: recipe.estimatedLaborHours || '',
          status: recipe.status || 'active',
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions?.length > 0 ? recipe.instructions : ['']
        });
      }
    }
  }, [isOpen, recipe]);

  const fetchInventoryItems = async () => {
    setLoadingInventory(true);
    try {
      const response = await inventoryAPI.getItems();
      setInventoryItems(response.data?.items || response.items || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { material: '', quantity: '', unit: 'g' }]
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const removeInstruction = (index) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const updateInstruction = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recipeName || !formData.productName || formData.ingredients.length === 0) {
      error('Please fill in all required fields and add at least one ingredient');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        recipeId: isEditMode ? recipe.recipeId : `RCP-${Date.now()}`,
        recipeName: formData.recipeName,
        productName: formData.productName,
        description: formData.description,
        ingredients: formData.ingredients.map(ing => ({
          material: ing.material,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit
        })),
        expectedYield: {
          quantity: parseFloat(formData.expectedYield.quantity) || 0,
          unit: formData.expectedYield.unit
        },
        estimatedLaborHours: parseFloat(formData.estimatedLaborHours) || 0,
        instructions: formData.instructions.filter(inst => inst.trim() !== ''),
        status: formData.status
      };

      if (isEditMode) {
        await recipeAPI.update(recipe._id, payload);
        success('Recipe updated successfully!');
      } else {
        await recipeAPI.create(payload);
        success('Recipe created successfully!');
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err.error || `Failed to ${isEditMode ? 'update' : 'create'} recipe`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipeName: '',
      productName: '',
      description: '',
      expectedYield: { quantity: '', unit: 'units' },
      estimatedLaborHours: '',
      status: 'active',
      ingredients: [],
      instructions: ['']
    });
  };

  const handleClose = () => {
    if (!isEditMode) {
      resetForm();
    }
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {isEditMode ? 'Update Recipe' : 'Create Recipe'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipe Information */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Recipe Information
          </h4>

          <div className="grid grid-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Recipe Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Lavender Body Butter Recipe"
                value={formData.recipeName}
                onChange={(e) => setFormData({ ...formData, recipeName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Lavender Body Butter"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Brief description of the recipe..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Production Details */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Production Details
          </h4>

          <div className="grid grid-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expected Yield
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.expectedYield.quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedYield: { ...formData.expectedYield, quantity: e.target.value }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <select
                  value={formData.expectedYield.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedYield: { ...formData.expectedYield, unit: e.target.value }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="units">Units</option>
                  <option value="ml">ML</option>
                  <option value="g">Grams</option>
                  <option value="kg">Kilograms</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Labor Hours
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g., 2.5"
                value={formData.estimatedLaborHours}
                onChange={(e) => setFormData({ ...formData, estimatedLaborHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Ingredients <span className="text-red-500">*</span></h4>
              <p className="text-sm text-gray-600 mt-0.5">Add materials required for this recipe</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addIngredient}
            >
              Add Ingredient
            </Button>
          </div>

          {loadingInventory && <p className="text-sm text-gray-500">Loading inventory...</p>}

          {!loadingInventory && formData.ingredients.length === 0 && (
            <p className="text-sm text-gray-500">No ingredients added yet. Click &quot;Add Ingredient&quot; to start.</p>
          )}

          {!loadingInventory && formData.ingredients.length > 0 && (
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Material <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={ingredient.material}
                        onChange={(e) => updateIngredient(index, 'material', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Select material...</option>
                        {inventoryItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.itemCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                        <select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="kg">kg</option>
                          <option value="l">L</option>
                          <option value="units">units</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {formData.ingredients.length > 1 && (
                    <div className="flex justify-end mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => removeIngredient(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Instructions</h4>
              <p className="text-sm text-gray-600 mt-0.5">Step-by-step production instructions</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addInstruction}
            >
              Add Step
            </Button>
          </div>

          <div className="space-y-3">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full font-semibold text-sm flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter instruction step..."
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {formData.instructions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeInstruction(index)}
                  >
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RecipeForm;
