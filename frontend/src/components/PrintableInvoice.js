import React from 'react';
import CurrencyAmount from './CurrencyAmount';

const PrintableInvoice = ({ order, customer, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('fr-FR');
  const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR');

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Screen-only header with buttons */}
      <div className="print:hidden bg-gray-100 p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Aperçu de la Facture</h2>
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
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-blue-600 print:text-black">Commerce Pro</h1>
          <p className="text-gray-600 print:text-black">Gestion de Magasin Professionnel</p>
          <div className="mt-4 text-sm text-gray-500 print:text-black">
            <p>123 Rue du Commerce, Conakry, Guinée</p>
            <p>Tél: +224 123 456 789 | Email: contact@commercepro.gn</p>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold print:text-xl">FACTURE</h2>
          <p className="text-gray-600 print:text-black">N° {order.id.substring(0, 8).toUpperCase()}</p>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-6">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-3 print:text-base">De :</h3>
            <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 p-4 rounded print:rounded-none">
              <p className="font-semibold">Commerce Pro</p>
              <p>123 Rue du Commerce</p>
              <p>Conakry, Guinée</p>
              <p>RC: 2024-B-123456</p>
              <p>NIF: 123456789</p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="font-bold text-lg mb-3 print:text-base">À :</h3>
            <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 p-4 rounded print:rounded-none">
              <p className="font-semibold">{order.customer_name || "Client"}</p>
              {customer && (
                <>
                  {customer.address && <p>{customer.address}</p>}
                  {customer.city && <p>{customer.city} {customer.postal_code}</p>}
                  {customer.phone && <p>Tél: {customer.phone}</p>}
                  {customer.email && <p>Email: {customer.email}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Date and Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:gap-2 print:mb-6">
          <div>
            <span className="font-semibold">Date de Facture:</span>
            <p>{currentDate}</p>
          </div>
          <div>
            <span className="font-semibold">Date de Commande:</span>
            <p>{orderDate}</p>
          </div>
          <div>
            <span className="font-semibold">Méthode de Paiement:</span>
            <p className="capitalize">{order.payment_method || "Non spécifiée"}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 print:mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-gray-300 px-4 py-3 text-left print:px-2 print:py-2">Description</th>
                <th className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">Qté</th>
                <th className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">Prix Unit.</th>
                <th className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-2">
                    <div className="font-medium">{item.product_name}</div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center print:px-2 print:py-2">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right print:px-2 print:py-2">
                    <CurrencyAmount amount={item.unit_price} />
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-medium print:px-2 print:py-2">
                    <CurrencyAmount amount={item.total_price} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8 print:mb-6">
          <div className="w-full md:w-1/2 print:w-1/2">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Sous-total:</span>
                <span><CurrencyAmount amount={order.subtotal} /></span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between py-2 border-b text-red-600">
                  <span>Remise:</span>
                  <span>-<CurrencyAmount amount={order.discount_amount} /></span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span>TVA (10%):</span>
                <span><CurrencyAmount amount={order.tax_amount} /></span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                <span>TOTAL À PAYER:</span>
                <span><CurrencyAmount amount={order.total_amount} /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-8 print:mb-6">
          <div className="bg-gray-100 print:bg-gray-200 print:border print:border-gray-300 p-4 rounded print:rounded-none">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Statut du Paiement:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold print:rounded-none ${
                order.payment_status === 'completed' 
                  ? 'bg-green-100 text-green-800 print:bg-green-200' 
                  : order.payment_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 print:bg-yellow-200'
                  : 'bg-red-100 text-red-800 print:bg-red-200'
              }`}>
                {order.payment_status === 'completed' ? 'PAYÉ' : 
                 order.payment_status === 'pending' ? 'EN ATTENTE' : 'ÉCHEC'}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8 print:mb-6">
            <h3 className="font-bold text-lg mb-3 print:text-base">Notes:</h3>
            <div className="bg-gray-50 print:bg-white print:border print:border-gray-300 p-4 rounded print:rounded-none">
              <p>{order.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-6 print:pt-4 text-center text-sm text-gray-600 print:text-black">
          <p className="mb-2">Merci pour votre confiance !</p>
          <p>En cas de questions, contactez-nous : +224 123 456 789</p>
          <div className="mt-4 print:mt-2">
            <p className="text-xs">
              Commerce Pro - Votre partenaire de confiance pour la gestion commerciale
            </p>
          </div>
        </div>

        {/* Print timestamp */}
        <div className="print:block hidden text-xs text-right mt-4 text-gray-500">
          Imprimé le {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;