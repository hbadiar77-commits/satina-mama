import React, { useState, useEffect } from "react";
import axios from "axios";
import PrintableReport from './PrintableReport';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [newMovement, setNewMovement] = useState({
    product_id: "",
    movement_type: "in",
    quantity: "",
    reason: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProducts(),
        fetchStockMovements(),
        fetchLowStockProducts()
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const response = await axios.get(`${API}/stock/movements`);
      setStockMovements(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des mouvements:", error);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await axios.get(`${API}/stock/low`);
      setLowStockProducts(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits en stock faible:", error);
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/stock/movements`, {
        ...newMovement,
        quantity: parseInt(newMovement.quantity)
      });

      setNewMovement({
        product_id: "",
        movement_type: "in",
        quantity: "",
        reason: ""
      });
      setShowMovementForm(false);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du mouvement:", error);
      alert("Erreur lors de l'enregistrement du mouvement");
    }
  };

  const handleQuickAdjustment = (productId, adjustment) => {
    setNewMovement({
      product_id: productId,
      movement_type: adjustment > 0 ? "in" : "out",
      quantity: Math.abs(adjustment).toString(),
      reason: adjustment > 0 ? "Réapprovisionnement rapide" : "Ajustement d'inventaire"
    });
    setShowMovementForm(true);
  };

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'in': return '📦';
      case 'out': return '📤';
      case 'adjustment': return '⚖️';
      default: return '📋';
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion du Stock</h1>
        <button
          onClick={() => setShowMovementForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          📋 Nouveau Mouvement
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("movements")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "movements"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Mouvements
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "alerts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Alertes Stock ({lowStockProducts.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Produits</p>
                  <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Stock</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {products.filter(p => p.stock_quantity > p.min_stock_level).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stock Faible</p>
                  <p className="text-2xl font-semibold text-gray-900">{lowStockProducts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <span className="text-2xl">🚫</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rupture</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {products.filter(p => p.stock_quantity === 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Products Stock Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">État des Stocks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Min</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                    const isLowStock = product.stock_quantity <= product.min_stock_level;
                    const isOutOfStock = product.stock_quantity === 0;
                    
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.min_stock_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Rupture
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              Stock Faible
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              OK
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleQuickAdjustment(product.id, 10)}
                              className="text-green-600 hover:text-green-900"
                              title="Ajouter 10"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleQuickAdjustment(product.id, -1)}
                              className="text-red-600 hover:text-red-900"
                              title="Retirer 1"
                            >
                              -1
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === "movements" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Historique des Mouvements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockMovements.map((movement) => {
                  const product = products.find(p => p.id === movement.product_id);
                  return (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product?.name || "Produit supprimé"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeIcon(movement.movement_type)} {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Alertes Stock Faible ({lowStockProducts.length})
            </h3>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Min</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map((product) => {
                    const urgency = product.stock_quantity === 0 ? 'Critique' : 
                                   product.stock_quantity <= product.min_stock_level / 2 ? 'Haute' : 'Moyenne';
                    const urgencyColor = urgency === 'Critique' ? 'bg-red-100 text-red-800' :
                                        urgency === 'Haute' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800';
                    
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-red-600">
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.min_stock_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${urgencyColor}`}>
                            {urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleQuickAdjustment(product.id, 20)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Réapprovisionner
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl">✅</span>
              <p className="text-gray-500 mt-2">Aucune alerte stock</p>
            </div>
          )}
        </div>
      )}

      {/* Movement Form Modal */}
      {showMovementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Nouveau Mouvement de Stock</h2>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select
                  required
                  value={newMovement.product_id}
                  onChange={(e) => setNewMovement({...newMovement, product_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  required
                  value={newMovement.movement_type}
                  onChange={(e) => setNewMovement({...newMovement, movement_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in">Entrée (+)</option>
                  <option value="out">Sortie (-)</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newMovement.quantity}
                  onChange={(e) => setNewMovement({...newMovement, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison *</label>
                <input
                  type="text"
                  required
                  value={newMovement.reason}
                  onChange={(e) => setNewMovement({...newMovement, reason: e.target.value})}
                  placeholder="Ex: Réapprovisionnement, Inventaire, Vente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementForm(false);
                    setNewMovement({
                      product_id: "",
                      movement_type: "in",
                      quantity: "",
                      reason: ""
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;