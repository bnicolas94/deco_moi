export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parentId: number | null;
    order: number;
    isActive: boolean;
    children?: Category[];
    productCount?: number;
}

export interface ProductVariant {
    id: number;
    productId: number;
    name: string;
    sku: string | null;
    price: number | null;
    stock: number;
    isActive: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    sku: string | null;
    basePrice: number;
    categoryId: number;
    images: string[];
    specifications: Record<string, string>;
    customizationOptions: Record<string, any>;
    minOrder: number;
    productionTime: string | null;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    isOnSale: boolean;
    salePrice: number | null;
    tags: string[];
    category?: Category;
    priceRules?: PriceRule[];
    variants?: ProductVariant[];
}

export interface PriceRule {
    id: number;
    productId: number;
    minQuantity: number;
    maxQuantity: number | null;
    discountPercentage: number | null;
    fixedPrice: number | null;
}

export interface ProductFilters {
    categorySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    tags?: string[];
    isFeatured?: boolean;
    isOnSale?: boolean;
    sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'name';
    page?: number;
    perPage?: number;
}
