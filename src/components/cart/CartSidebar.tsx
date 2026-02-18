import { useStore } from '@nanostores/preact';
import {
    $cartItems,
    $isCartOpen,
    $cartCount,
    $cartTotal,
    $cartTransferTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    loadFromLocalStorage,
    getItemKey,
} from '@/stores/cartStore';
import * as preactHooks from 'preact/hooks';
import { useEffect } from 'preact/hooks';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(price);
}

export default function CartSidebar() {
    const items = useStore($cartItems);
    const isOpen = useStore($isCartOpen);
    const count = useStore($cartCount);
    const total = useStore($cartTotal);
    const transferTotal = useStore($cartTransferTotal);

    const [mounted, setMounted] = preactHooks.useState(false);

    // Cargar carrito del localStorage
    useEffect(() => {
        setMounted(true);
        loadFromLocalStorage();
    }, []);

    // Actualizar badge del header
    useEffect(() => {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = String(count);
                badge.classList.remove('opacity-0', 'scale-0');
                badge.classList.add('opacity-100', 'scale-100');
            } else {
                badge.classList.add('opacity-0', 'scale-0');
                badge.classList.remove('opacity-100', 'scale-100');
            }
        }
    }, [count]);

    if (!isOpen || !mounted) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                onClick={toggleCart}
            />

            {/* Sidebar */}
            <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <h2 className="font-heading font-bold text-lg text-brand-black">
                            Mi Carrito ({count})
                        </h2>
                    </div>
                    <button
                        onClick={toggleCart}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Cerrar carrito"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="font-heading font-semibold text-brand-black mb-1">Tu carrito está vacío</p>
                            <p className="text-sm text-gray-400 mb-4">¡Descubrí nuestros productos!</p>
                            <a
                                href="/productos"
                                onClick={toggleCart}
                                className="btn btn-primary btn-sm"
                            >
                                Ver productos
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={getItemKey(item)} className="flex gap-3 p-3 rounded-xl bg-light-gray/50">
                                    {/* Imagen */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-light-gray flex-shrink-0">
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

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <a href={`/producto/${item.slug}`} className="font-heading font-semibold text-sm text-brand-black line-clamp-2 hover:text-accent transition-colors">
                                            {item.name}
                                        </a>
                                        <p className="text-sm font-semibold text-brand-black mt-1">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                        {item.variantName && (
                                            <p className="text-xs text-accent font-medium mt-0.5">Opción: {item.variantName}</p>
                                        )}
                                        {item.customization && (
                                            <p className="text-2xs text-gray-400 mt-0.5">{item.customization}</p>
                                        )}

                                        <div className="flex items-center justify-between mt-2">
                                            {/* Cantidad */}
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(getItemKey(item), item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-dark-gray hover:bg-gray-100 transition-colors text-sm"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(getItemKey(item), item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-dark-gray hover:bg-gray-100 transition-colors text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Eliminar */}
                                            <button
                                                onClick={() => removeFromCart(getItemKey(item))}
                                                className="p-1 text-gray-400 hover:text-error transition-colors"
                                                aria-label="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                        {/* Totales */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Subtotal</span>
                                <span className="text-sm font-semibold text-brand-black">{formatPrice(total)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-success flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Con transferencia
                                </span>
                                <span className="text-sm font-semibold text-success">{formatPrice(transferTotal)}</span>
                            </div>
                        </div>

                        {/* Acciones */}
                        <a
                            href="/carrito"
                            onClick={toggleCart}
                            className="btn btn-primary w-full"
                        >
                            Ver carrito completo
                        </a>

                        <button
                            onClick={clearCart}
                            className="w-full text-center text-xs text-gray-400 hover:text-error transition-colors py-1"
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
        </>
    );
}
