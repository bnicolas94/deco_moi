import { atom, computed } from 'nanostores';

export interface CartItem {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    image: string;
    quantity: number;
    customization?: string;
    variantId?: number;
    variantName?: string;
}

// Estado del carrito
export const $cartItems = atom<CartItem[]>([]);
export const $isCartOpen = atom(false);

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
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1, openCart = true) {
    const current = $cartItems.get();
    const existingIndex = current.findIndex((i) =>
        i.id === item.id &&
        i.variantId === item.variantId &&
        i.customization === item.customization
    );

    if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
        };
        $cartItems.set(updated);
    } else {
        $cartItems.set([...current, { ...item, quantity }]);
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
        return (item.id === id || key === id) ? { ...item, quantity } : item;
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
