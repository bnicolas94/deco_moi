export enum PaymentMethod {
    MERCADOPAGO = 'mercadopago',
    TRANSFER = 'transfer',
}

export interface PaymentInfo {
    method: PaymentMethod;
    transactionId?: string;
    status: string;
    amount: number;
    metadata?: Record<string, any>;
}

export interface BankTransferData {
    cbu: string;
    alias: string;
    holder: string;
    bank: string;
    cuit: string;
}

export const TRANSFER_DISCOUNT_PERCENTAGE = 10;
