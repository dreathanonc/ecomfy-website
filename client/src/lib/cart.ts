import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      total: 0,
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(i => i.id === item.id);
        
        let newItems;
        if (existingItem) {
          newItems = items.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          newItems = [...items, { ...item, quantity: 1 }];
        }
        
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        set({ items: newItems, itemCount, total });
      },
      removeItem: (id) => {
        const newItems = get().items.filter(item => item.id !== id);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        set({ items: newItems, itemCount, total });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        const newItems = get().items.map(item =>
          item.id === id ? { ...item, quantity } : item
        );
        
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        set({ items: newItems, itemCount, total });
      },
      clearCart: () => set({ items: [], itemCount: 0, total: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
