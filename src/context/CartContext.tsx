import {
    createContext,
    useContext,
    useState,
  } from "react";
  
  type CartItem = any;
  
  type CartContextType = {
    cart: CartItem[];
    setCart: React.Dispatch<
      React.SetStateAction<CartItem[]>
    >;
  };
  
  const CartContext =
    createContext<CartContextType | null>(
      null
    );
  
  export function CartProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
  
    const [cart, setCart] =
      useState<CartItem[]>([]);
  
    return (
      <CartContext.Provider
        value={{
          cart,
          setCart,
        }}
      >
        {children}
      </CartContext.Provider>
    );
  }
  
  export function useCart() {
  
    const context =
      useContext(CartContext);
  
    if (!context) {
  
      throw new Error(
        "useCart must be used inside CartProvider"
      );
  
    }
  
    return context;
  }