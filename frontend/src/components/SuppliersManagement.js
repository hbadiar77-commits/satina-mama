import React, { useState, useEffect } from "react";
import axios from "axios";
import CurrencyAmount from './CurrencyAmount';
import PrintableReport from './PrintableReport';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SuppliersManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    company: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    tax_id: "",
    payment_terms: "",
    notes: "",
    is_active: true
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error);
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async (supplierId) => {
    try {
      const response = await axios.get(`${API}/suppliers/${supplierId}/products`);
      setProducts(prev => ({ ...prev, [supplierId]: response.data }));
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${API}/suppliers/${editingSupplier.id}`, newSupplier);
      } else {
        await axios.post(`${API}/suppliers`, newSupplier);
      }

      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du fournisseur:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setNewSupplier({
      name: "",
      company: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      country: "",
      tax_id: "",
      payment_terms: "",
      notes: "",
      is_active: true
    });
    setShowAddForm(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier) => {
    setNewSupplier({
      name: supplier.name,
      company: supplier.company || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      postal_code: supplier.postal_code || "",
      country: supplier.country || "",
      tax_id: supplier.tax_id || "",
      payment_terms: supplier.payment_terms || "",
      notes: supplier.notes || "",
      is_active: supplier.is_active
    });
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      try {
        await axios.delete(`${API}/suppliers/${supplierId}`);
        fetchSuppliers();
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

  const viewSupplierDetails = async (supplier) => {
    setSelectedSupplier(supplier);
    await fetchSupplierProducts(supplier.id);
    setShowSupplierDetails(true);
  };

  const printSuppliersReport = () => {
    setShowReport(true);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm)
  );

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
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Fournisseurs</h1>
        <div className="space-x-2">
          <button
            onClick={printSuppliersReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            🖨️ Rapport Fournisseurs
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ➕ Ajouter Fournisseur
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom, entreprise, contact, email ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingSupplier ? "Modifier Fournisseur" : "Ajouter Fournisseur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                  <input
                    type="text"
                    value={newSupplier.company}
                    onChange={(e) => setNewSupplier({...newSupplier, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personne de Contact</label>
                  <input
                    type="text"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Fiscal</label>
                  <input
                    type="text"
                    value={newSupplier.tax_id}
                    onChange={(e) => setNewSupplier({...newSupplier, tax_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code Postal</label>
                  <input
                    type="text"
                    value={newSupplier.postal_code}
                    onChange={(e) => setNewSupplier({...newSupplier, postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={newSupplier.country}
                    onChange={(e) => setNewSupplier({...newSupplier, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de Paiement</label>
                <input
                  type="text"
                  value={newSupplier.payment_terms}
                  onChange={(e) => setNewSupplier({...newSupplier, payment_terms: e.target.value})}
                  placeholder="Ex: 30 jours, Net 15, 2/10 Net 30..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newSupplier.is_active}
                  onChange={(e) => setNewSupplier({...newSupplier, is_active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Fournisseur actif
                </label>
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
                  {editingSupplier ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      {supplier.company && (
                        <div className="text-sm text-gray-500">{supplier.company}</div>
                      )}
                      {supplier.tax_id && (
                        <div className="text-xs text-gray-400">N° Fiscal: {supplier.tax_id}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {supplier.contact_person && (
                        <div className="text-sm text-gray-900">{supplier.contact_person}</div>
                      )}
                      {supplier.phone && (
                        <div className="text-sm text-gray-500">{supplier.phone}</div>
                      )}
                      {supplier.email && (
                        <div className="text-sm text-gray-500">{supplier.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {supplier.city && (
                        <div className="text-sm text-gray-900">{supplier.city}</div>
                      )}
                      {supplier.country && (
                        <div className="text-sm text-gray-500">{supplier.country}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewSupplierDetails(supplier)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Details Modal */}
      {showSupplierDetails && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Détails Fournisseur</h2>
              <button
                onClick={() => setShowSupplierDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Informations Générales</h3>
                <div className="space-y-2">
                  <p><strong>Nom:</strong> {selectedSupplier.name}</p>
                  {selectedSupplier.company && (
                    <p><strong>Entreprise:</strong> {selectedSupplier.company}</p>
                  )}
                  {selectedSupplier.contact_person && (
                    <p><strong>Contact:</strong> {selectedSupplier.contact_person}</p>
                  )}
                  {selectedSupplier.email && (
                    <p><strong>Email:</strong> {selectedSupplier.email}</p>
                  )}
                  {selectedSupplier.phone && (
                    <p><strong>Téléphone:</strong> {selectedSupplier.phone}</p>
                  )}
                  {selectedSupplier.tax_id && (
                    <p><strong>N° Fiscal:</strong> {selectedSupplier.tax_id}</p>
                  )}
                  <p><strong>Créé le:</strong> {new Date(selectedSupplier.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Adresse</h3>
                <div className="space-y-2">
                  {selectedSupplier.address && (
                    <p><strong>Adresse:</strong> {selectedSupplier.address}</p>
                  )}
                  {selectedSupplier.city && (
                    <p><strong>Ville:</strong> {selectedSupplier.city}</p>
                  )}
                  {selectedSupplier.postal_code && (
                    <p><strong>Code Postal:</strong> {selectedSupplier.postal_code}</p>
                  )}
                  {selectedSupplier.country && (
                    <p><strong>Pays:</strong> {selectedSupplier.country}</p>
                  )}
                  {selectedSupplier.payment_terms && (
                    <p><strong>Conditions de Paiement:</strong> {selectedSupplier.payment_terms}</p>
                  )}
                </div>
              </div>
            </div>

            {selectedSupplier.notes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700">{selectedSupplier.notes}</p>
                </div>
              </div>
            )}

            {/* Supplier Products */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Produits Fournis</h3>
              {products[selectedSupplier.id] && products[selectedSupplier.id].length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Vente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products[selectedSupplier.id].slice(0, 10).map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500">{product.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <CurrencyAmount amount={product.price} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.stock_quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun produit trouvé pour ce fournisseur</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Report */}
      {showReport && (
        <PrintableReport
          type="suppliers"
          data={suppliers}
          title="Rapport des Fournisseurs"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default SuppliersManagement;