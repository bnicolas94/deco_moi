export interface Order {
    id: string;
    orderNumber: string;
    userId: string | null;
    status: OrderStatus;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    shippingData: ShippingData | null;
    notes: string | null;
    customizationDetails: Record<string, any> | null;
    items: OrderItem[];
    createdAt: Date;
}

export interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    customization: Record<string, any> | null;
    variantId?: number | null;
    productionTime?: string | null;
}

export interface ShippingData {
    name: string;
    email: string;
    phone: string;
    address: {
        street: string;
        number: string;
        floor?: string;
        apartment?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum PaymentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REFUNDED = 'refunded',
}

export enum PaymentMethod {
    TRANSFER = 'transfer',
    MERCADOPAGO = 'mercadopago',
    CASH = 'cash',
}
