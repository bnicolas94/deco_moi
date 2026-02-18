import { useState, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
    $cartItems,
    $cartTotal,
    $cartTransferTotal,
    clearCart,
    $cartCount
} from '@/stores/cartStore';
import type { CheckoutField } from '@/lib/services/ConfigService';

interface Props {
    fields: CheckoutField[];
}

export default function CheckoutForm({ fields }: Props) {
    const items = useStore($cartItems);
    const total = useStore($cartTotal);
    const transferTotal = useStore($cartTransferTotal);
    const cartCount = useStore($cartCount);

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'mercadopago'>('transfer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string } | null>(null);

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);

        const orderData = {
            items,
            subtotal: total,
            total: (paymentMethod === 'transfer' ? transferTotal : total),
            shippingData: formData,
            paymentMethod,
            notes: formData.additional_notes || '',
        };

        try {
            if (paymentMethod === 'mercadopago') {
                // Flujo Mercado Pago: Crear preferencia y redirigir
                const response = await fetch('/api/checkout/preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.init_point) {
                        // Limpiar el carrito antes de irnos para que al volver esté vacío
                        clearCart();
                        window.location.href = data.init_point;
                        return;
                    }
                } else {
                    const errData = await response.json();
                    throw new Error(errData.details || errData.error || 'No se pudo iniciar el pago con Mercado Pago');
                }
            } else {
                // Flujo Transferencia: Crear orden directamente (como antes)
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const data = await response.json();
                    setOrderSuccess({ id: data.orderId, number: data.orderNumber });
                    clearCart();
                } else {
                    const err = await response.json();
                    alert(err.error || 'Hubo un error al procesar tu pedido.');
                }
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error al procesar el pedido. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (orderSuccess) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-success">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-heading font-bold text-brand-black mb-4">¡Pedido realizado con éxito!</h2>
                <p className="text-dark-gray mb-6">Tu número de orden es <span className="font-bold text-primary">#{orderSuccess.number}</span></p>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                    Te hemos enviado un correo con los detalles de tu compra y los pasos a seguir.
                    {paymentMethod === 'transfer' && " Recordá enviar el comprobante de transferencia al WhatsApp de la tienda."}
                </p>
                <a href="/productos" className="btn btn-primary inline-flex">
                    Seguir comprando
                </a>
            </div>
        );
    }

    if (cartCount === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-heading font-bold mb-4">Tu carrito está vacío</h2>
                <a href="/productos" className="btn btn-primary">Ver productos</a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Formulario de Envío */}
            <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                        Datos de Envío y Contacto
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {[...fields].sort((a, b) => a.order - b.order).map(field => (
                            <div key={field.id} className={field.width === 'full' ? 'col-span-2' : 'col-span-2 md:col-span-1'}>
                                <label className="block text-sm font-semibold text-dark-gray mb-2">
                                    {field.label} {field.required && <span className="text-error">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        required={field.required}
                                        className="input w-full min-h-[100px]"
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.id, (e.target as HTMLTextAreaElement).value)}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        required={field.required}
                                        className="input w-full"
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.id, (e.target as HTMLInputElement).value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                        Método de Pago
                    </h2>

                    <div className="space-y-3">
                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}>
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentMethod === 'transfer'}
                                onChange={() => setPaymentMethod('transfer')}
                                className="w-4 h-4 text-primary"
                            />
                            <div className="flex-1">
                                <p className="font-bold text-brand-black">Transferencia Bancaria</p>
                                <p className="text-xs text-success font-bold">10% DE DESCUENTO ADICIONAL</p>
                            </div>
                            <div className="text-success">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'mercadopago' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}>
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentMethod === 'mercadopago'}
                                onChange={() => setPaymentMethod('mercadopago')}
                                className="w-4 h-4 text-primary"
                            />
                            <div className="flex-1">
                                <p className="font-bold text-brand-black">Mercado Pago</p>
                                <p className="text-xs text-gray-400">Tarjetas de Débito, Crédito o Saldo en cuenta</p>
                            </div>
                            <div className="w-12 h-6 bg-light-gray rounded flex items-center justify-center text-[8px] font-bold text-gray-400">MP</div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Resumen de Compra */}
            <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6">Tu Pedido</h2>

                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                        {items.map(item => (
                            <div key={`${item.id}-${item.variantId || 'base'}`} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-light-gray flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-brand-black truncate">{item.name}</p>
                                    {item.variantName && <p className="text-xs text-accent font-medium">{item.variantName}</p>}
                                    <p className="text-xs text-gray-400">Cantidad: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-brand-black whitespace-nowrap">
                                    {formatPrice(item.price * item.quantity)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 py-6 border-y border-gray-100 mb-6">
                        <div className="flex justify-between text-dark-gray">
                            <span>Subtotal</span>
                            <span className="font-semibold">{formatPrice(total)}</span>
                        </div>
                        {paymentMethod === 'transfer' && (
                            <div className="flex justify-between text-success">
                                <span>Descuento Transferencia (10%)</span>
                                <span className="font-semibold">-{formatPrice(total * 0.1)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-dark-gray">
                            <span>Envío</span>
                            <span className="italic text-xs">Calculado luego</span>
                        </div>
                        <div className="flex justify-between text-xl font-heading font-bold text-brand-black pt-2">
                            <span>Total</span>
                            <span>{formatPrice(paymentMethod === 'transfer' ? transferTotal : total)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {paymentMethod === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Finalizar Pedido'}
                            </>
                        )}
                    </button>

                    {/* Botón de Simulación (Solo Local/Debug) */}
                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (!confirm('¿Simular un pago exitoso (bypass MP)?')) return;
                                setIsSubmitting(true);
                                try {
                                    const res = await fetch('/api/orders/mock-success', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            items,
                                            subtotal: total,
                                            total: (paymentMethod === 'transfer' ? transferTotal : total),
                                            shippingData: formData,
                                            paymentMethod: 'mock_payment',
                                            notes: 'Simulación de pago local'
                                        })
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setOrderSuccess({ id: data.orderId, number: data.orderNumber });
                                        clearCart();
                                    } else {
                                        alert('Error en la simulación');
                                    }
                                } catch (e) {
                                    alert('Error de conexión');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            ⚡ Simular Pago Exitoso (Local Debug)
                        </button>
                    )}

                    <p className="text-center text-2xs text-gray-400 mt-4 px-4 uppercase tracking-wider font-bold">
                        Al finalizar, aceptas nuestros términos y condiciones de compra.
                    </p>
                </div>
            </div>
        </form>
    );
}
