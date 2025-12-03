import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price_cents: number;
  quantity: number;
  thumbnail_url: string;
  variantName?: string;
}

const CART_STORAGE_KEY = 'velvet_hollow_cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCents = items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalCents,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}
