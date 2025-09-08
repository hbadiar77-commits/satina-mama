import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  const [currentShop, setCurrentShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeShopContext();
  }, []);

  const initializeShopContext = async () => {
    try {
      // Load shops
      await fetchShops();
      
      // Load saved shop preference or default to first shop
      const savedShopId = localStorage.getItem('selectedShopId');
      if (savedShopId) {
        const savedShop = shops.find(shop => shop.id === savedShopId);
        if (savedShop) {
          setCurrentShop(savedShop);
        }
      }
      
      // For demo purposes, set a default user (in real app, this would come from authentication)
      setUser({
        id: 'demo-user',
        username: 'admin',
        full_name: 'Administrateur',
        role: 'owner',
        shop_id: null
      });
      
    } catch (error) {
      console.error('Error initializing shop context:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get(`${API}/shops?is_active=true`);
      setShops(response.data);
      
      // If no current shop and we have shops, select the first one
      if (!currentShop && response.data.length > 0) {
        setCurrentShop(response.data[0]);
        localStorage.setItem('selectedShopId', response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([]);
    }
  };

  const switchShop = (shop) => {
    setCurrentShop(shop);
    localStorage.setItem('selectedShopId', shop.id);
  };

  const createShop = async (shopData) => {
    try {
      const response = await axios.post(`${API}/shops`, shopData);
      await fetchShops();
      return response.data;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  };

  const updateShop = async (shopId, updateData) => {
    try {
      const response = await axios.put(`${API}/shops/${shopId}`, updateData);
      await fetchShops();
      
      // Update current shop if it was the one being updated
      if (currentShop && currentShop.id === shopId) {
        setCurrentShop(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  };

  const deleteShop = async (shopId) => {
    try {
      await axios.delete(`${API}/shops/${shopId}`);
      await fetchShops();
      
      // If the deleted shop was the current one, switch to another
      if (currentShop && currentShop.id === shopId) {
        const remainingShops = shops.filter(shop => shop.id !== shopId);
        if (remainingShops.length > 0) {
          switchShop(remainingShops[0]);
        } else {
          setCurrentShop(null);
          localStorage.removeItem('selectedShopId');
        }
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  };

  const getShopStats = async (shopId) => {
    try {
      const response = await axios.get(`${API}/shops/${shopId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shop stats:', error);
      throw error;
    }
  };

  const canAccessShop = (shopId) => {
    if (!user) return false;
    
    // Owner can access all shops
    if (user.role === 'owner') return true;
    
    // Others can only access their assigned shop
    return user.shop_id === shopId;
  };

  const canManageShops = () => {
    return user && user.role === 'owner';
  };

  const value = {
    currentShop,
    shops,
    loading,
    user,
    switchShop,
    createShop,
    updateShop,
    deleteShop,
    fetchShops,
    getShopStats,
    canAccessShop,
    canManageShops
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopProvider;