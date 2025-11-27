import { useState, useEffect, useMemo } from 'react';
import { Beaker, Plus, DollarSign, Package, Clock, RefreshCw, Edit, Trash2, AlertCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import RecipeForm from '../components/manufacturing/RecipeForm';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { recipeAPI } from '../services/api';

const RecipeBuilder = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

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

  const handleDeleteRecipe = async (recipe) => {
    if (!window.confirm(`Are you sure you want to delete the recipe "${recipe.recipeName}"?`)) {
      return;
    }

    try {
      await recipeAPI.delete(recipe._id);
      success('Recipe deleted successfully');
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

  if (loading) {
    return (
      <Layout title="Recipe Builder" subtitle="Create and manage product recipes">
        <div className="flex items-center justify-center h-64">
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

        {/* Header Actions */}
        <Card>
          <div className="flex justify-end gap-2">
            <Button
              icon={Plus}
              variant="primary"
              onClick={handleCreateRecipe}
            >
              Create Recipe
            </Button>
            <Button
              icon={RefreshCw}
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {recipes.map((recipe) => (
            <Card key={recipe._id}>
              <div className="h-full flex flex-col">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 -m-4 mb-0 p-4 rounded-t-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{recipe.productName}</h3>
                      <p className="text-xs text-gray-600 font-mono bg-white/60 px-2 py-0.5 rounded inline-block">
                        {recipe.sku}
                      </p>
                    </div>
                    <div className="ml-2">
                      {getStatusBadge(recipe.status)}
                    </div>
                  </div>
                  {recipe.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-2">{recipe.description}</p>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-4 pt-4">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-900 uppercase">Materials</span>
                      </div>
                      <p className="text-xl font-bold text-blue-700">{recipe.materials?.length || 0}</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-purple-600" />
                        <span className="text-xs font-medium text-purple-900 uppercase">Time</span>
                      </div>
                      <p className="text-xl font-bold text-purple-700">{recipe.productionTime || 0}<span className="text-sm font-normal ml-1">min</span></p>
                    </div>
                  </div>

                  {/* Total Cost Highlight */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign size={16} className="text-green-700" />
                          <span className="text-xs font-semibold text-green-900 uppercase tracking-wide">Total Cost</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(recipe.costBreakdown?.totalCost || 0)}
                        </p>
                      </div>
                      <Beaker size={32} className="text-green-300" />
                    </div>
                  </div>

                  {/* Cost Breakdown - Compact */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <div className="w-1 h-3 bg-primary-500 rounded"></div>
                      Cost Details
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Materials
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(recipe.costBreakdown?.materialsCost || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          Labor
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(recipe.costBreakdown?.laborCost || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          Overhead
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(recipe.costBreakdown?.overheadCost || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions - Sticky at bottom */}
                <div className="grid grid-2 gap-2 pt-4 mt-4 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit}
                    onClick={() => handleEditRecipe(recipe)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="error"
                    icon={Trash2}
                    onClick={() => handleDeleteRecipe(recipe)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {recipes.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Beaker className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500">No recipes found. Create your first recipe!</p>
            </div>
          </Card>
        )}

        <RecipeForm
          isOpen={showRecipeForm}
          onClose={handleFormClose}
          onSuccess={fetchRecipes}
          recipe={editingRecipe}
        />
      </div>
    </Layout>
  );
};

export default RecipeBuilder;
