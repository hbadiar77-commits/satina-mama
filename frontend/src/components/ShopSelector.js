import React from 'react';
import { useShop } from './ShopContext';

const ShopSelector = ({ className = "" }) => {
  const { currentShop, shops, switchShop, canAccessShop, loading } = useShop();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-400">Chargement...</span>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-red-400">Aucune boutique</span>
      </div>
    );
  }

  if (shops.length === 1) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm font-medium text-gray-700">🏪 {currentShop?.name}</span>
      </div>
    );
  }

  const accessibleShops = shops.filter(shop => canAccessShop(shop.id));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Boutique:</span>
      <select
        value={currentShop?.id || ""}
        onChange={(e) => {
          const selectedShop = shops.find(shop => shop.id === e.target.value);
          if (selectedShop) {
            switchShop(selectedShop);
          }
        }}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {accessibleShops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            🏪 {shop.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ShopSelector;