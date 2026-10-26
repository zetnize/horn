"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import { addCartItem, clearCart, getCartSnapshot, getServerCartSnapshot, removeCartItem, subscribeCart, type CartItem } from "@/lib/cart-store";
import type { Size } from "@/data/products";
type CartContextValue = { items: CartItem[]; ready: boolean; add: (slug:string,size:Size)=>void; remove:(slug:string,size:Size)=>void; clear:()=>void };
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({children}:{children:React.ReactNode}) {
 const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
 return <CartContext.Provider value={{...state,add:addCartItem,remove:removeCartItem,clear:clearCart}}>{children}</CartContext.Provider>;
}
export function useCart() { const value=useContext(CartContext); if(!value) throw new Error("CartProvider отсутствует"); return value; }

