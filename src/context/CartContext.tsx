import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientApi, authApi } from '../api/client';

interface CartItem {
  cartKey: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  options?: string;
  itemData: any; // Raw data from API
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  quote: any;
  loadingQuote: boolean;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  session: { storeId: string; tableCode: string };
  setSession: (storeId: string, tableCode: string) => void;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getTranslation = (obj: any, lang = 'vi-VN') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['vi-VN'] || '';
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [session, setSessionState] = useState({ storeId: '', tableCode: '' });
  const [voucherCode, setVoucherCode] = useState<string>('');

  const setSession = (storeId: string, tableCode: string) => {
    setSessionState({ storeId, tableCode });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      fetchQuote();
    } else {
      setQuote(null);
    }
  }, [items, voucherCode]);

  const fetchInitialData = async () => {
    try {
      const userData = await authApi.getMe();
      if (userData?.favoriteIds) {
        setFavoriteIds(userData.favoriteIds);
      }
    } catch (error) {
      console.log('Fetch initial user data failed (likely no user yet):', error);
    }
  };

  const fetchQuote = async () => {
    try {
      setLoadingQuote(true);
      const quoteItems = items.map(item => ({
        itemId: item.id,
        quantity: item.quantity,
        toppings: item.itemData.selectedToppings || [],
        size: item.itemData.selectedSize || 'v',
        sweetness: item.itemData.selectedSweetness || '50%',
        ice: item.itemData.selectedIce || '50% đá'
      }));
      const data = await clientApi.getQuote(quoteItems, voucherCode);
      setQuote(data);
    } catch (error) {
      console.error('Fetch quote failed:', error);
    } finally {
      setLoadingQuote(false);
    }
  };

  const generateCartKey = (item: any) => {
    const toppings = (item.selectedToppings || []).sort().join(',');
    return `${item._id || item.id}-${item.selectedSize || 'v'}-${item.selectedSweetness || '50%'}-${item.selectedIce || '50% đá'}-${toppings}`;
  };

  const addItem = (item: any) => {
    const cartKey = generateCartKey(item);
    setItems(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i);
      }
      return [...prev, {
        cartKey,
        id: item._id || item.id,
        name: getTranslation(item.name),
        price: item.price,
        image: item.image,
        quantity: item.quantity || 1,
        options: item.options || '',
        itemData: item
      }];
    });
  };

  const removeItem = (cartKey: string) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.cartKey === cartKey) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const clearCart = () => setItems([]);

  const toggleFavorite = async (id: string) => {
    // Optimistic update
    const isFav = favoriteIds.includes(id);
    setFavoriteIds(prev => 
      isFav ? prev.filter(fid => fid !== id) : [...prev, id]
    );

    try {
      await authApi.toggleFavorite(id);
    } catch (error) {
      console.error('Toggle favorite API failed:', error);
      // Rollback on error
      setFavoriteIds(prev => 
        isFav ? [...prev, id] : prev.filter(fid => fid !== id)
      );
    }
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQuantity, clearCart, 
      quote, loadingQuote,
      favoriteIds, toggleFavorite, isFavorite,
      session, setSession,
      voucherCode, setVoucherCode
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
