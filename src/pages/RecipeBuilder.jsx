import { useState, useEffect, useMemo } from 'react';
import { Beaker, Plus, DollarSign, Package, Clock, RefreshCw, Edit, Trash2, AlertCircle, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import RecipeForm from '../components/manufacturing/RecipeForm';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { recipeAPI } from '../services/api';
import './RecipeBuilder.css';

const RecipeBuilder = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [deletingRecipe, setDeletingRecipe] = useState(null);

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await recipeAPI.getAll();
      if (response && response.data) {
        setRecipes(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
      showError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
    info('Recipes refreshed');
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowRecipeForm(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeForm(true);
  };

  const handleViewRecipe = (recipe) => {
    setViewingRecipe(recipe);
  };

  const handleDeleteRecipe = async () => {
    if (!deletingRecipe) return;

    try {
      await recipeAPI.delete(deletingRecipe._id);
      success('Recipe deleted successfully');
      setDeletingRecipe(null);
      await fetchRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      showError(err.error || 'Failed to delete recipe');
    }
  };

  const handleFormClose = () => {
    setShowRecipeForm(false);
    setEditingRecipe(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      draft: 'warning'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const stats = useMemo(() => {
    const totalRecipes = recipes.length;
    const activeRecipes = recipes.filter(r => r.status === 'active').length;
    const totalCost = recipes.reduce((sum, r) => sum + (r.costBreakdown?.totalCost || 0), 0);
    const avgCost = totalRecipes > 0 ? totalCost / totalRecipes : 0;
    const totalMaterials = recipes.reduce((sum, r) => sum + (r.materials?.length || 0), 0);

    return { totalRecipes, activeRecipes, avgCost, totalMaterials };
  }, [recipes]);

  const columns = [
    {
      key: 'productName',
      header: 'Product Name',
      render: (value, recipe) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1F6B7A', marginBottom: '0.25rem' }}>{value}</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>{recipe.sku}</div>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280' }}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'materials',
      header: 'Materials',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: '600', color: '#374151' }}>{value?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'productionTime',
      header: 'Time',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} style={{ color: '#9333ea' }} />
          <span style={{ fontWeight: '500', color: '#374151' }}>{value || 0} min</span>
        </div>
      )
    },
    {
      key: 'costBreakdown',
      header: 'Total Cost',
      render: (value) => (
        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>
          {formatCurrency(value?.totalCost || 0)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, recipe) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={() => handleViewRecipe(recipe)}
            title="View Recipe"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => handleEditRecipe(recipe)}
            title="Edit Recipe"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Trash2}
            onClick={() => setDeletingRecipe(recipe)}
            title="Delete Recipe"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Layout title="Recipe Builder" subtitle="Create and manage product recipes">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Recipe Builder" subtitle="Create and manage product recipes">
      <div className="recipe-builder-page">
        {/* Stats */}
        <div className="grid grid-4 mb-xl">
          <StatCard
            title="Total Recipes"
            value={stats.totalRecipes}
            icon={Beaker}
            color="var(--primary-color)"
          />
          <StatCard
            title="Active Recipes"
            value={stats.activeRecipes}
            icon={Package}
            color="var(--success)"
          />
          <StatCard
            title="Avg Recipe Cost"
            value={formatCurrency(stats.avgCost)}
            icon={DollarSign}
            color="var(--accent-gold)"
          />
          <StatCard
            title="Total Materials"
            value={stats.totalMaterials}
            icon={AlertCircle}
            color="var(--info)"
          />
        </div>

        {/* Recipes Table */}
        <Card
          title="All Recipes"
          icon={Beaker}
          action={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button
                icon={RefreshCw}
                variant="outline"
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
              <Button
                icon={Plus}
                variant="primary"
                onClick={handleCreateRecipe}
              >
                Create Recipe
              </Button>
            </div>
          }
        >
          <Table
            columns={columns}
            data={recipes}
            loading={loading}
            emptyMessage="No recipes found. Create your first recipe!"
          />
        </Card>

        {/* Recipe Form Modal */}
        <RecipeForm
          isOpen={showRecipeForm}
          onClose={handleFormClose}
          onSuccess={fetchRecipes}
          recipe={editingRecipe}
        />

        {/* View Recipe Modal */}
        {viewingRecipe && (
          <Modal
            isOpen={true}
            onClose={() => setViewingRecipe(null)}
            title={`Recipe: ${viewingRecipe.productName}`}
            size="lg"
          >
            <div className="recipe-view-modal">
              {/* Header Section */}
              <div className="recipe-view-header">
                <div className="recipe-view-meta">
                  <div className="recipe-view-sku">SKU: {viewingRecipe.sku}</div>
                  {getStatusBadge(viewingRecipe.status)}
                </div>
                {viewingRecipe.description && (
                  <p className="recipe-view-description">{viewingRecipe.description}</p>
                )}
              </div>

              {/* Details Grid */}
              <div className="recipe-view-grid">
                <div className="recipe-view-card">
                  <h4 className="recipe-view-card-title">Production Details</h4>
                  <div className="recipe-view-details">
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Production Time:</span>
                      <span className="recipe-view-detail-value">{viewingRecipe.productionTime || 0} minutes</span>
                    </div>
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Yield:</span>
                      <span className="recipe-view-detail-value">{viewingRecipe.yieldQuantity || 0} {viewingRecipe.yieldUnit || ''}</span>
                    </div>
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Materials Count:</span>
                      <span className="recipe-view-detail-value">{viewingRecipe.materials?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="recipe-view-card">
                  <h4 className="recipe-view-card-title">Cost Breakdown</h4>
                  <div className="recipe-view-details">
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Materials:</span>
                      <span className="recipe-view-detail-value">{formatCurrency(viewingRecipe.costBreakdown?.materialsCost || 0)}</span>
                    </div>
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Labor:</span>
                      <span className="recipe-view-detail-value">{formatCurrency(viewingRecipe.costBreakdown?.laborCost || 0)}</span>
                    </div>
                    <div className="recipe-view-detail-row">
                      <span className="recipe-view-detail-label">Overhead:</span>
                      <span className="recipe-view-detail-value">{formatCurrency(viewingRecipe.costBreakdown?.overheadCost || 0)}</span>
                    </div>
                    <div className="recipe-view-detail-row recipe-view-total">
                      <span className="recipe-view-detail-label">Total Cost:</span>
                      <span className="recipe-view-detail-value">{formatCurrency(viewingRecipe.costBreakdown?.totalCost || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials Section */}
              <div className="recipe-view-card">
                <h4 className="recipe-view-card-title">Materials</h4>
                <div className="recipe-materials-list">
                  {viewingRecipe.materials?.length ? (
                    viewingRecipe.materials.map((item, idx) => (
                      <div key={idx} className="recipe-material-item">
                        <div className="recipe-material-info">
                          <div className="recipe-material-name">{item.name}</div>
                          {item.sku && <div className="recipe-material-sku">{item.sku}</div>}
                        </div>
                        <div className="recipe-material-details">
                          <div className="recipe-material-quantity">{item.quantity} {item.unit}</div>
                          <div className="recipe-material-cost">{formatCurrency(item.cost || 0)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="recipe-empty-message">No materials listed.</p>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {deletingRecipe && (
          <Modal
            isOpen={true}
            onClose={() => setDeletingRecipe(null)}
            title="Delete Recipe"
          >
            <div className="recipe-delete-modal">
              <div className="recipe-delete-warning">
                <AlertCircle size={48} style={{ color: '#f59e0b' }} />
                <div>
                  <h4>Are you sure you want to delete this recipe?</h4>
                  <p>This action cannot be undone.</p>
                </div>
              </div>

              <div className="recipe-delete-info">
                <div className="recipe-delete-detail">
                  <span className="recipe-delete-label">Product Name:</span>
                  <span className="recipe-delete-value">{deletingRecipe.productName}</span>
                </div>
                <div className="recipe-delete-detail">
                  <span className="recipe-delete-label">SKU:</span>
                  <span className="recipe-delete-value">{deletingRecipe.sku}</span>
                </div>
                <div className="recipe-delete-detail">
                  <span className="recipe-delete-label">Total Cost:</span>
                  <span className="recipe-delete-value">{formatCurrency(deletingRecipe.costBreakdown?.totalCost || 0)}</span>
                </div>
              </div>

              <div className="recipe-delete-actions">
                <Button
                  variant="outline"
                  onClick={() => setDeletingRecipe(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  icon={Trash2}
                  onClick={handleDeleteRecipe}
                >
                  Delete Recipe
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default RecipeBuilder;
