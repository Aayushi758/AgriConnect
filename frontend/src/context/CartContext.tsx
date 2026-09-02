import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../components/ProductCard';

export interface CartItem extends Product {
  cart_quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  subtotal: 0,
  totalItems: 0,
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('kisansetu_cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart data from local storage", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('kisansetu_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, cart_quantity: item.cart_quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, cart_quantity: quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, cart_quantity: quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.cart_quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.cart_quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
