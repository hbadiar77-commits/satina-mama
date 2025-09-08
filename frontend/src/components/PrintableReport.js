import React from 'react';
import CurrencyAmount from './CurrencyAmount';

const PrintableReport = ({ type, data, title, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('fr-FR');
  const currentTime = new Date().toLocaleTimeString('fr-FR');

  const renderStockReport = () => (
    <div>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200">
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Produit</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">SKU</th>
            <th className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">Prix</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Stock</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Min</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, index) => {
            const isLowStock = product.stock_quantity <= product.min_stock_level;
            const isOutOfStock = product.stock_quantity === 0;
            
            return (
              <tr key={index} className={isOutOfStock ? 'bg-red-50 print:bg-red-100' : isLowStock ? 'bg-yellow-50 print:bg-yellow-100' : ''}>
                <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-sm text-gray-600 print:text-gray-800">{product.description}</div>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                  {product.sku || '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">
                  <CurrencyAmount amount={product.price} />
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                  <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                  {product.min_stock_level}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded print:rounded-none ${
                    isOutOfStock ? 'bg-red-100 text-red-800 print:bg-red-200' :
                    isLowStock ? 'bg-orange-100 text-orange-800 print:bg-orange-200' :
                    'bg-green-100 text-green-800 print:bg-green-200'
                  }`}>
                    {isOutOfStock ? 'Rupture' : isLowStock ? 'Stock Faible' : 'OK'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-green-50 print:bg-green-100 print:border print:border-green-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.filter(p => p.stock_quantity > p.min_stock_level).length}
          </div>
          <div className="text-sm text-green-800">En Stock</div>
        </div>
        <div className="bg-orange-50 print:bg-orange-100 print:border print:border-orange-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length}
          </div>
          <div className="text-sm text-orange-800">Stock Faible</div>
        </div>
        <div className="bg-red-50 print:bg-red-100 print:border print:border-red-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-red-600">
            {data.filter(p => p.stock_quantity === 0).length}
          </div>
          <div className="text-sm text-red-800">Rupture</div>
        </div>
      </div>
    </div>
  );

  const renderCustomersReport = () => (
    <div>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200">
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Client</th>
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Contact</th>
            <th className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">Achats Totaux</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Points Fidélité</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Date Inscription</th>
          </tr>
        </thead>
        <tbody>
          {data.map((customer, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                <div className="font-medium">{customer.name}</div>
                {customer.city && (
                  <div className="text-sm text-gray-600 print:text-gray-800">{customer.city}</div>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                {customer.phone && <div>{customer.phone}</div>}
                {customer.email && <div className="text-sm text-gray-600 print:text-gray-800">{customer.email}</div>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right font-medium print:px-2 print:py-2">
                <CurrencyAmount amount={customer.total_purchases || 0} />
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                <span className="font-semibold text-yellow-600">{customer.loyalty_points || 0} ⭐</span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                {new Date(customer.created_at).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 print:bg-blue-100 print:border print:border-blue-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          <div className="text-sm text-blue-800">Total Clients</div>
        </div>
        <div className="bg-green-50 print:bg-green-100 print:border print:border-green-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-green-600">
            <CurrencyAmount amount={data.reduce((sum, customer) => sum + (customer.total_purchases || 0), 0)} />
          </div>
          <div className="text-sm text-green-800">Total Achats</div>
        </div>
      </div>
    </div>
  );

  const renderSuppliersReport = () => (
    <div>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200">
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Fournisseur</th>
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Contact</th>
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Localisation</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Statut</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Date Création</th>
          </tr>
        </thead>
        <tbody>
          {data.map((supplier, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                <div className="font-medium">{supplier.name}</div>
                {supplier.company && (
                  <div className="text-sm text-gray-600 print:text-gray-800">{supplier.company}</div>
                )}
                {supplier.tax_id && (
                  <div className="text-xs text-gray-500 print:text-gray-700">N° Fiscal: {supplier.tax_id}</div>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                {supplier.contact_person && <div>{supplier.contact_person}</div>}
                {supplier.phone && <div className="text-sm">{supplier.phone}</div>}
                {supplier.email && <div className="text-sm text-gray-600 print:text-gray-800">{supplier.email}</div>}
              </td>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                {supplier.address && <div className="text-sm">{supplier.address}</div>}
                {supplier.city && <div>{supplier.city}</div>}
                {supplier.country && <div className="text-sm text-gray-600 print:text-gray-800">{supplier.country}</div>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded print:rounded-none ${
                  supplier.is_active ? 'bg-green-100 text-green-800 print:bg-green-200' : 'bg-red-100 text-red-800 print:bg-red-200'
                }`}>
                  {supplier.is_active ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 print:bg-blue-100 print:border print:border-blue-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          <div className="text-sm text-blue-800">Total Fournisseurs</div>
        </div>
        <div className="bg-green-50 print:bg-green-100 print:border print:border-green-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.filter(s => s.is_active).length}
          </div>
          <div className="text-sm text-green-800">Fournisseurs Actifs</div>
        </div>
      </div>
    </div>
  );

  const renderOrdersReport = () => (
    <div>
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-200">
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">ID Commande</th>
            <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Client</th>
            <th className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">Total</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Statut</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Paiement</th>
            <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((order, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 font-mono text-sm">
                {order.id.substring(0, 8)}...
              </td>
              <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                {order.customer_name || "Client anonyme"}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right font-medium print:px-2 print:py-2">
                <CurrencyAmount amount={order.total_amount || 0} />
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded print:rounded-none ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800 print:bg-green-200' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800 print:bg-blue-200' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 print:bg-yellow-200' :
                  'bg-red-100 text-red-800 print:bg-red-200'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded print:rounded-none ${
                  order.payment_status === 'completed' ? 'bg-green-100 text-green-800 print:bg-green-200' :
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 print:bg-yellow-200' :
                  'bg-red-100 text-red-800 print:bg-red-200'
                }`}>
                  {order.payment_status}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 print:bg-blue-100 print:border print:border-blue-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          <div className="text-sm text-blue-800">Total Commandes</div>
        </div>
        <div className="bg-green-50 print:bg-green-100 print:border print:border-green-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-green-600">
            <CurrencyAmount amount={data.reduce((sum, order) => sum + (order.total_amount || 0), 0)} />
          </div>
          <div className="text-sm text-green-800">Total Ventes</div>
        </div>
        <div className="bg-yellow-50 print:bg-yellow-100 print:border print:border-yellow-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {data.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-800">En Attente</div>
        </div>
        <div className="bg-purple-50 print:bg-purple-100 print:border print:border-purple-300 p-4 rounded print:rounded-none text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.filter(o => o.status === 'completed').length}
          </div>
          <div className="text-sm text-purple-800">Terminées</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Screen-only header with buttons */}
      <div className="print:hidden bg-gray-100 p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Aperçu du Rapport - {title}</h2>
        <div className="space-x-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            🖨️ Imprimer
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ❌ Fermer
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-6xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-blue-600 print:text-black">Commerce Pro</h1>
          <p className="text-gray-600 print:text-black">Gestion de Magasin Professionnel</p>
          <div className="mt-4">
            <h2 className="text-2xl font-bold print:text-xl">{title}</h2>
            <p className="text-gray-600 print:text-black">Généré le {currentDate} à {currentTime}</p>
          </div>
        </div>

        {/* Report Content */}
        {type === 'stock' && renderStockReport()}
        {type === 'customers' && renderCustomersReport()}
        {type === 'orders' && renderOrdersReport()}

        {/* Footer */}
        <div className="border-t pt-6 print:pt-4 text-center text-sm text-gray-600 print:text-black mt-8">
          <p>Commerce Pro - Rapport généré automatiquement</p>
          <div className="print:block hidden text-xs text-right mt-4 text-gray-500">
            Imprimé le {new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReport;