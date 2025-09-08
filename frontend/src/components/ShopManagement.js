import React, { useState, useEffect } from "react";
import { useShop } from './ShopContext';
import CurrencyAmount from './CurrencyAmount';

const ShopManagement = () => {
  const { 
    shops, 
    currentShop, 
    createShop, 
    updateShop, 
    deleteShop, 
    fetchShops, 
    getShopStats,
    canManageShops 
  } = useShop();

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [shopStats, setShopStats] = useState({});

  const [newShop, setNewShop] = useState({
    name: "",
    business_name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Guinée",
    registration_number: "",
    tax_id: "",
    vat_number: "",
    default_currency: "GNF",
    tax_rate: "0.1"
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await fetchShops();
      await loadShopStats();
    } catch (error) {
      console.error("Error initializing shop management:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadShopStats = async () => {
    const stats = {};
    for (const shop of shops) {
      try {
        const shopStat = await getShopStats(shop.id);
        stats[shop.id] = shopStat;
      } catch (error) {
        console.error(`Error loading stats for shop ${shop.id}:`, error);
        stats[shop.id] = {
          total_sales_today: 0,
          total_orders_today: 0,
          total_customers: 0,
          total_products: 0,
          low_stock_products: 0
        };
      }
    }
    setShopStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shopData = {
        ...newShop,
        tax_rate: parseFloat(newShop.tax_rate)
      };

      if (editingShop) {
        await updateShop(editingShop.id, shopData);
      } else {
        await createShop(shopData);
      }

      resetForm();
      await loadShopStats();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la boutique:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setNewShop({
      name: "",
      business_name: "",
      description: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Guinée",
      registration_number: "",
      tax_id: "",
      vat_number: "",
      default_currency: "GNF",
      tax_rate: "0.1"
    });
    setShowAddForm(false);
    setEditingShop(null);
  };

  const handleEdit = (shop) => {
    setNewShop({
      name: shop.name,
      business_name: shop.business_name || "",
      description: shop.description || "",
      email: shop.email || "",
      phone: shop.phone || "",
      website: shop.website || "",
      address: shop.address || "",
      city: shop.city || "",
      postal_code: shop.postal_code || "",
      country: shop.country || "Guinée",
      registration_number: shop.registration_number || "",
      tax_id: shop.tax_id || "",
      vat_number: shop.vat_number || "",
      default_currency: shop.default_currency || "GNF",
      tax_rate: shop.tax_rate?.toString() || "0.1"
    });
    setEditingShop(shop);
    setShowAddForm(true);
  };

  const handleDelete = async (shopId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette boutique ? Toutes les données associées seront perdues.")) {
      try {
        await deleteShop(shopId);
        await loadShopStats();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        if (error.response?.status === 400) {
          alert(error.response.data.detail);
        } else {
          alert("Erreur lors de la suppression");
        }
      }
    }
  };

  if (!canManageShops()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Accès Refusé</h2>
          <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour gérer les boutiques.</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Boutiques</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          ➕ Créer Boutique
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingShop ? "Modifier Boutique" : "Créer Boutique"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Boutique *</label>
                  <input
                    type="text"
                    required
                    value={newShop.name}
                    onChange={(e) => setNewShop({...newShop, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raison Sociale</label>
                  <input
                    type="text"
                    value={newShop.business_name}
                    onChange={(e) => setNewShop({...newShop, business_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newShop.email}
                    onChange={(e) => setNewShop({...newShop, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newShop.phone}
                    onChange={(e) => setNewShop({...newShop, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newShop.city}
                    onChange={(e) => setNewShop({...newShop, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code Postal</label>
                  <input
                    type="text"
                    value={newShop.postal_code}
                    onChange={(e) => setNewShop({...newShop, postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={newShop.country}
                    onChange={(e) => setNewShop({...newShop, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <textarea
                  value={newShop.address}
                  onChange={(e) => setNewShop({...newShop, address: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Legal Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
                  <input
                    type="text"
                    value={newShop.registration_number}
                    onChange={(e) => setNewShop({...newShop, registration_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                  <input
                    type="text"
                    value={newShop.tax_id}
                    onChange={(e) => setNewShop({...newShop, tax_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux de Taxe (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newShop.tax_rate}
                    onChange={(e) => setNewShop({...newShop, tax_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newShop.description}
                  onChange={(e) => setNewShop({...newShop, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingShop ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => {
          const stats = shopStats[shop.id] || {};
          return (
            <div key={shop.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{shop.name}</h3>
                  {shop.business_name && (
                    <p className="text-sm text-gray-600">{shop.business_name}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(shop)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Shop Info */}
              <div className="space-y-2 mb-4">
                {shop.city && (
                  <p className="text-sm text-gray-600">📍 {shop.city}, {shop.country}</p>
                )}
                {shop.phone && (
                  <p className="text-sm text-gray-600">📞 {shop.phone}</p>
                )}
                {shop.email && (
                  <p className="text-sm text-gray-600">✉️ {shop.email}</p>
                )}
              </div>

              {/* Statistics */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-3">Statistiques Aujourd'hui</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      <CurrencyAmount amount={stats.total_sales_today || 0} />
                    </div>
                    <div className="text-xs text-gray-600">Ventes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_orders_today || 0}</div>
                    <div className="text-xs text-gray-600">Commandes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.total_customers || 0}</div>
                    <div className="text-xs text-gray-600">Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.total_products || 0}</div>
                    <div className="text-xs text-gray-600">Produits</div>
                  </div>
                </div>
                
                {(stats.low_stock_products || 0) > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠️ {stats.low_stock_products} produit(s) en stock faible
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune boutique</h3>
          <p className="text-gray-600 mb-4">Créez votre première boutique pour commencer</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            ➕ Créer ma première boutique
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;