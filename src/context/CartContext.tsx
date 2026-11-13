import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { apiFetch } from '../lib/staticFallback';

interface AppliedCoupon {
  code: string;
  description: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed_amount';
  calculated_discount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, storage?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  destinationCity: string;
  setDestinationCity: (city: string) => void;
  generateWhatsAppOrderUrl: (whatsappNumber?: string) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pkm_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('pkm_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [destinationCity, setDestinationCity] = useState<string>('Lahore');

  useEffect(() => {
    localStorage.setItem('pkm_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('pkm_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('pkm_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, quantity = 1, color?: string, storage?: string) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = Math.min(newQty, product.stock);
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(quantity, product.stock),
          selectedColor: color || product.color,
          selectedStorage: storage || product.storage
        }
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.min(quantity, item.product.stock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);

  // Delivery: Free over Rs. 50,000, otherwise standard Rs. 450
  const freeThreshold = 50000;
  const deliveryCharges = items.length === 0 || subtotal >= freeThreshold ? 0 : 450;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discount_value) / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const total = Math.max(0, subtotal + deliveryCharges - discountAmount);

  const applyCoupon = async (code: string) => {
    if (!code.trim()) return { success: false, message: 'Please enter a coupon code' };
    try {
      const res = await apiFetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), cart_amount: subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid coupon code' };
      }

      setAppliedCoupon({
        code: data.code,
        description: data.description,
        discount_value: data.discount_value,
        discount_type: data.discount_type,
        calculated_discount: data.calculated_discount
      });
      return { success: true, message: `Coupon ${data.code} applied successfully!` };
    } catch {
      return { success: false, message: 'Could not validate coupon at this time' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const generateWhatsAppOrderUrl = (whatsappNumber = '+923001234567') => {
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    const itemsText = items
      .map(
        i =>
          `• ${i.product.name} (${i.product.pta_status})\n  Qty: ${i.quantity}x | Price: Rs. ${(i.product.selling_price * i.quantity).toLocaleString('en-PK')}`
      )
      .join('\n\n');

    const msg = encodeURIComponent(
      `Salam iBs Slayer! I would like to order the following items from your store:\n\n` +
      `${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Subtotal: Rs. ${subtotal.toLocaleString('en-PK')}\n` +
      `Delivery to ${destinationCity}: ${deliveryCharges === 0 ? 'FREE' : `Rs. ${deliveryCharges}`}\n` +
      (discountAmount > 0 ? `Discount (${appliedCoupon?.code}): -Rs. ${discountAmount.toLocaleString('en-PK')}\n` : '') +
      `*Total Payable: Rs. ${total.toLocaleString('en-PK')}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Please let me know how to proceed with payment and delivery address confirmation. Thank you!`
    );

    return `https://wa.me/${cleanNum}?text=${msg}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryCharges,
        discountAmount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        destinationCity,
        setDestinationCity,
        generateWhatsAppOrderUrl
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
