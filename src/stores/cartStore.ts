import { atom, computed } from 'nanostores';

export interface CartItem {
    id: number;
    name: string;
    slug: string;
    sku: string;
    basePrice: number;
    price: number;
    image: string;
    quantity: number;
    customization?: string;
    variantId?: number;
    variantName?: string;
    priceRules?: any[];
}

// Estado del carrito
export const $cartItems = atom<CartItem[]>([]);
export const $isCartOpen = atom(false);

// Helper para calcular precio con descuento
export function calculateDiscountedPrice(basePrice: number, quantity: number, rules?: any[]): number {
    if (!rules || rules.length === 0) return basePrice;
    
    const applicableRule = rules
        .filter((r) => quantity >= r.minQuantity && (r.maxQuantity === null || quantity <= r.maxQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];
        
    if (applicableRule) {
        const discount = parseFloat(applicableRule.discountPercentage) || 0;
        return basePrice * (1 - discount / 100);
    }
    return basePrice;
}

// Computados
export const $cartCount = computed($cartItems, (items) =>
    items.reduce((sum, item) => sum + item.quantity, 0)
);

export const $cartTotal = computed($cartItems, (items) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const $cartTransferTotal = computed($cartTotal, (total) =>
    total * 0.9
);

// Acciones
export function addToCart(item: Omit<CartItem, 'quantity' | 'price'> & { price?: number }, quantity = 1, openCart = true) {
    const current = $cartItems.get();
    const existingIndex = current.findIndex((i) =>
        i.id === item.id &&
        i.variantId === item.variantId &&
        i.customization === item.customization
    );

    if (existingIndex >= 0) {
        const updated = [...current];
        const newQuantity = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQuantity,
            price: calculateDiscountedPrice(updated[existingIndex].basePrice, newQuantity, updated[existingIndex].priceRules)
        };
        $cartItems.set(updated);
    } else {
        const basePrice = item.basePrice || item.price || 0;
        const initialPrice = calculateDiscountedPrice(basePrice, quantity, item.priceRules);
        $cartItems.set([...current, { ...item, basePrice, price: initialPrice, quantity } as CartItem]);
    }

    saveToLocalStorage();
    if (openCart) $isCartOpen.set(true);
}

// Generar una clave única para cada item (Producto + Variante + Personalización)
export function getItemKey(item: CartItem): string {
    return `${item.id}-${item.variantId || 'base'}-${item.customization || 'none'}`;
}

export function removeFromCart(id: number | string) {
    const current = $cartItems.get();
    // Soporte para ID numérico antiguo o clave de item
    $cartItems.set(current.filter((i) => {
        const key = `${i.id}-${i.variantId || 'base'}-${i.customization || 'none'}`;
        return i.id !== id && key !== id;
    }));
    saveToLocalStorage();
}

export function updateQuantity(id: number | string, quantity: number) {
    if (quantity <= 0) {
        removeFromCart(id);
        return;
    }

    const current = $cartItems.get();
    const updated = current.map((item) => {
        const key = `${item.id}-${item.variantId || 'base'}-${item.customization || 'none'}`;
        if (item.id === id || key === id) {
            return {
                ...item,
                quantity,
                price: calculateDiscountedPrice(item.basePrice, quantity, item.priceRules)
            };
        }
        return item;
    });
    $cartItems.set(updated);
    saveToLocalStorage();
}

export function clearCart() {
    $cartItems.set([]);
    saveToLocalStorage();
}

export function toggleCart() {
    $isCartOpen.set(!$isCartOpen.get());
}

// Persistencia en localStorage
function saveToLocalStorage() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('decomoi_cart', JSON.stringify($cartItems.get()));
    }
}

export function loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('decomoi_cart');
            if (saved) {
                const items: CartItem[] = JSON.parse(saved);
                $cartItems.set(items);
            }
        } catch {
            // ignore
        }
    }
}
