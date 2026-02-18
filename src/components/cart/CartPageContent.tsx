import { useStore } from '@nanostores/preact';
import {
    $cartItems,
    $cartTotal,
    $cartTransferTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemKey
} from '@/stores/cartStore';
import { useEffect, useState } from 'preact/hooks';

export default function CartPageContent() {
    const items = useStore($cartItems);
    const total = useStore($cartTotal);
    const transferTotal = useStore($cartTransferTotal);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(price);
    };

    if (!mounted) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-light-gray mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-heading font-bold text-brand-black mb-4">Tu carrito está vacío</h2>
                <p className="text-dark-gray/70 mb-8">Parece que aún no has añadido ningún producto a tu carrito.</p>
                <a href="/productos" className="btn btn-primary btn-lg">
                    Explorar productos
                </a>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Lista de Items */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-light-gray/30 border-b border-gray-100 text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Producto</div>
                        <div className="text-center">Precio</div>
                        <div className="text-center">Cantidad</div>
                        <div className="text-right">Subtotal</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <div key={getItemKey(item)} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                                {/* Info Producto */}
                                <div className="col-span-1 md:col-span-3 flex gap-4">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-light-gray flex-shrink-0 border border-gray-100">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-heading font-bold text-brand-black hover:text-accent transition-colors">
                                            <a href={`/producto/${item.slug}`}>{item.name}</a>
                                        </h3>
                                        {item.variantName && (
                                            <p className="text-sm text-accent font-medium mt-1 inline-flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-accent"></span>
                                                {item.variantName}
                                            </p>
                                        )}
                                        {item.customization && (
                                            <div className="mt-2 p-2 bg-off-white rounded-lg border border-gray-100">
                                                <p className="text-2xs uppercase text-gray-400 font-bold tracking-wider mb-1">Personalización:</p>
                                                <p className="text-xs text-dark-gray">{item.customization}</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeFromCart(getItemKey(item))}
                                            className="mt-3 text-xs text-error hover:underline flex items-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>

                                {/* Precio (Móvil alternativo) */}
                                <div className="md:text-center">
                                    <span className="md:hidden text-xs text-gray-400 uppercase font-bold mr-2">Precio:</span>
                                    <span className="text-sm font-semibold text-brand-black">{formatPrice(item.price)}</span>
                                </div>

                                {/* Cantidad */}
                                <div className="flex justify-center">
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                                        <button
                                            onClick={() => updateQuantity(getItemKey(item), item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-dark-gray hover:bg-light-gray transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(getItemKey(item), item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-dark-gray hover:bg-light-gray transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="text-right">
                                    <span className="md:hidden text-xs text-gray-400 uppercase font-bold mr-2">Subtotal:</span>
                                    <span className="text-base font-bold text-brand-black">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-light-gray/20 border-t border-gray-100 flex justify-between items-center">
                        <button
                            onClick={clearCart}
                            className="text-sm text-gray-400 hover:text-error transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Vaciar carrito
                        </button>
                        <a href="/productos" className="text-sm text-primary font-bold hover:underline">
                            ← Seguir comprando
                        </a>
                    </div>
                </div>
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6">Resumen de compra</h2>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-dark-gray">
                            <span>Subtotal</span>
                            <span className="font-semibold text-brand-black">{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-sm text-success font-bold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pago por Transferencia
                                </p>
                                <p className="text-xs text-gray-400">10% de descuento aplicado</p>
                            </div>
                            <span className="text-xl font-bold text-success">{formatPrice(transferTotal)}</span>
                        </div>
                    </div>

                    <a href="/checkout" className="btn btn-primary btn-lg w-full mb-4">
                        Iniciar Compra
                    </a>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-off-white rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-brand-black">Compra protegida</p>
                                <p className="text-2xs text-gray-400">Tus datos están seguros con nosotros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
