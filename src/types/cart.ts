export interface CartItem {
    productId: number;
    name: string;
    slug: string;
    sku: string | null;
    image: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    customization?: CartItemCustomization;
}

export interface CartItemCustomization {
    eventType?: string;
    eventDate?: string;
    honoredPerson?: string;
    design?: string;
    textColor?: string;
    phrase?: string;
    notes?: string;
}

export interface Cart {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    transferDiscount: number;
    total: number;
    totalWithTransfer: number;
}
