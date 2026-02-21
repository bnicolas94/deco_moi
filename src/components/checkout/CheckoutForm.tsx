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

interface ShippingQuoteResult {
    id: string;
    serviceType: string;
    serviceTypeName: string;
    logisticType: string;
    logisticTypeName: string;
    carrierName: string;
    carrierId: number;
    price: number;
    priceInclTax: number;
    estimatedDelivery: string;
    deliveryTimeHours: number | null;
}

interface ShippingConfig {
    enabled: boolean;
    pickupEnabled: boolean;
    pickupLabel: string;
    pickupAddress: string;
    flatRateEnabled: boolean;
    flatRate: number;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
}

interface Props {
    fields: CheckoutField[];
    shippingConfig?: ShippingConfig;
    bankConfig?: {
        holder: string;
        cvu: string;
        discount: number;
    }
}

export default function CheckoutForm({ fields, shippingConfig, bankConfig }: Props) {
    const items = useStore($cartItems);
    const total = useStore($cartTotal);
    const transferTotal = useStore($cartTransferTotal);
    const cartCount = useStore($cartCount);

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'mercadopago'>('transfer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string, total: number } | null>(null);

    // Estado de envío
    const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
    const [shippingOptions, setShippingOptions] = useState<ShippingQuoteResult[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingQuoteResult | null>(null);
    const [isQuoting, setIsQuoting] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [hasQuoted, setHasQuoted] = useState(false);

    // Determinar si el envío está habilitado
    const shippingEnabled = shippingConfig?.enabled ?? true;
    const pickupEnabled = shippingConfig?.pickupEnabled ?? true;

    // Calcular costo de envío actual
    const shippingCost = deliveryMethod === 'delivery' && selectedShipping
        ? selectedShipping.price
        : 0;

    // Calcular totales con envío
    const subtotalForPayment = paymentMethod === 'transfer' ? transferTotal : total;
    const grandTotal = subtotalForPayment + shippingCost;

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Cotizar envío cuando se cambia a delivery y hay CP
    const handleQuoteShipping = async () => {
        const city = formData.city || '';
        const state = formData.state || '';
        const postalCode = formData.postal_code || '';

        if (!postalCode) {
            setQuoteError('Ingresá tu código postal para cotizar el envío');
            return;
        }

        setIsQuoting(true);
        setQuoteError(null);
        setShippingOptions([]);
        setSelectedShipping(null);

        try {
            const quoteItems = items.map(item => ({
                sku: item.sku || `SKU-${item.id}`,
                description: item.name,
                weight: 0, // Se usan los defaults del servidor
                height: 0,
                width: 0,
                length: 0,
                quantity: item.quantity,
            }));

            const res = await fetch('/api/shipping/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: quoteItems,
                    destination: {
                        city: city,
                        state: state,
                        zipcode: postalCode,
                    },
                    declaredValue: total,
                }),
            });

            if (!res.ok) {
                throw new Error('No se pudo cotizar el envío');
            }

            const data = await res.json();

            if (data.results && data.results.length > 0) {
                setShippingOptions(data.results);
                setSelectedShipping(data.results[0]); // Seleccionar la primera opción por defecto
                setHasQuoted(true);
            } else {
                setQuoteError('No hay opciones de envío disponibles para tu zona. Probá con retiro en local.');
            }
        } catch (err) {
            console.error(err);
            setQuoteError('Error al cotizar el envío. Verificá tu dirección e intentá de nuevo.');
        } finally {
            setIsQuoting(false);
        }
    };

    // Auto-cotizar cuando se selecciona delivery y hay CP
    useEffect(() => {
        if (deliveryMethod === 'pickup') {
            setShippingOptions([]);
            setSelectedShipping(null);
            setQuoteError(null);
            setHasQuoted(false);
            return;
        }

        // Cotizar automáticamente cuando hay CP de al menos 4 caracteres
        const postalCode = formData.postal_code || '';
        if (deliveryMethod === 'delivery' && postalCode.length >= 4) {
            const timer = setTimeout(() => {
                handleQuoteShipping();
            }, 800); // Debounce de 800ms
            return () => clearTimeout(timer);
        }
    }, [deliveryMethod, formData.postal_code, formData.city, formData.state]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // Validar que se haya cotizado si eligió delivery
        if (deliveryMethod === 'delivery' && !selectedShipping) {
            alert('Por favor cotizá el envío antes de continuar.');
            return;
        }

        setIsSubmitting(true);

        const orderData = {
            items,
            subtotal: total,
            total: grandTotal,
            shippingCost: shippingCost,
            shippingData: formData,
            shippingMethod: deliveryMethod,
            selectedShipping: selectedShipping || null,
            paymentMethod,
            notes: formData.additional_notes || '',
        };

        try {
            if (paymentMethod === 'mercadopago') {
                const response = await fetch('/api/checkout/preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.init_point) {
                        clearCart();
                        window.location.href = data.init_point;
                        return;
                    }
                } else {
                    const errData = await response.json();
                    throw new Error(errData.details || errData.error || 'No se pudo iniciar el pago con Mercado Pago');
                }
            } else {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const data = await response.json();
                    setOrderSuccess({ id: data.orderId, number: data.orderNumber, total: grandTotal });
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        } catch {
            return dateStr;
        }
    };

    if (orderSuccess) {
        if (paymentMethod === 'transfer') {
            return (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-heading font-medium text-gray-500 mb-2">Pedido #{orderSuccess.number}</h2>
                    <h3 className="text-3xl font-bold text-brand-black mb-6">¡Realizá tu transferencia!</h3>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                            <div>
                                <p className="text-gray-500 mb-1">Titular de la cuenta</p>
                                <p className="font-bold text-lg text-brand-black">{bankConfig?.holder || 'No configurado'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">CVU / Alias</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-lg text-brand-black">{bankConfig?.cvu || 'No configurado'}</p>
                                    <button type="button" onClick={() => navigator.clipboard.writeText(bankConfig?.cvu || '')} className="text-primary hover:text-accent transition-colors" title="Copiar CVU">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-primary/20 rounded-lg p-5 text-center">
                            <p className="text-gray-500 text-sm font-medium mb-1">Monto exacto a transferir</p>
                            <div className="flex items-center justify-center gap-3">
                                <p className="text-4xl font-black text-brand-black">{formatPrice(orderSuccess.total)}</p>
                                <button type="button" onClick={() => navigator.clipboard.writeText(orderSuccess.total.toString())} className="text-primary hover:text-accent transition-colors" title="Copiar Monto">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left flex gap-3">
                        <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            <strong>Atención:</strong> Realizá la transferencia desde la cuenta registrada a nombre del <strong>DNI {formData.transfer_dni}</strong>.
                            Nuestro sistema confirmará automáticamente el pago al detectar tu transferencia.
                        </p>
                    </div>

                    <a href="/productos" className="btn btn-primary inline-flex px-8">
                        Volver a la tienda
                    </a>
                </div>
            );
        }

        return (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-success">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-heading font-bold text-brand-black mb-4">¡Pedido procesado con éxito!</h2>
                <p className="text-dark-gray mb-6">Tu número de orden en Deco Moi es <span className="font-bold text-primary">#{orderSuccess.number}</span></p>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                    Te hemos enviado un correo con los detalles de tu compra y los pasos a seguir.
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
                        Datos de Contacto y Dirección
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

                {/* Método de Entrega */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                        Método de Entrega
                    </h2>

                    <div className="space-y-3">
                        {/* Retiro en local */}
                        {pickupEnabled && (
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <input
                                    type="radio"
                                    name="delivery"
                                    checked={deliveryMethod === 'pickup'}
                                    onChange={() => setDeliveryMethod('pickup')}
                                    className="w-4 h-4 text-primary"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-brand-black flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {shippingConfig?.pickupLabel || 'Retiro en local'}
                                    </p>
                                    {shippingConfig?.pickupAddress && (
                                        <p className="text-xs text-gray-500 mt-1">{shippingConfig.pickupAddress}</p>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-success">GRATIS</span>
                            </label>
                        )}

                        {/* Envío a domicilio */}
                        {shippingEnabled && (
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <input
                                    type="radio"
                                    name="delivery"
                                    checked={deliveryMethod === 'delivery'}
                                    onChange={() => setDeliveryMethod('delivery')}
                                    className="w-4 h-4 text-primary"
                                />
                                <div className="flex-1">
                                    <p className="font-bold text-brand-black flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                        </svg>
                                        Envío a domicilio
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Te lo llevamos a tu puerta</p>
                                </div>
                                {selectedShipping ? (
                                    <span className="text-sm font-bold text-brand-black">{formatPrice(selectedShipping.price)}</span>
                                ) : (
                                    <span className="text-xs italic text-gray-400">Cotizar</span>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Sección de cotización de envío */}
                    {deliveryMethod === 'delivery' && (
                        <div className="mt-6 space-y-4">
                            {/* Spinner de cotización automática */}
                            {isQuoting && (
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-sm text-blue-700">Cotizando opciones de envío...</p>
                                </div>
                            )}

                            {/* Mensaje si falta CP */}
                            {!isQuoting && !hasQuoted && !quoteError && !(formData.postal_code && formData.postal_code.length >= 4) && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-700">
                                        Completá tu código postal arriba para ver las opciones de envío.
                                    </p>
                                </div>
                            )}

                            {quoteError && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                    <p className="text-sm text-red-700">{quoteError}</p>
                                    <button
                                        type="button"
                                        onClick={handleQuoteShipping}
                                        className="text-xs text-red-600 font-bold hover:underline ml-3 whitespace-nowrap"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}

                            {/* Opciones de envío */}
                            {shippingOptions.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-dark-gray">Opciones de envío disponibles:</p>
                                    {shippingOptions.map(option => (
                                        <label
                                            key={option.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedShipping?.id === option.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="shippingOption"
                                                checked={selectedShipping?.id === option.id}
                                                onChange={() => setSelectedShipping(option)}
                                                className="w-4 h-4 text-primary flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-brand-black">
                                                    {option.carrierName} — {option.serviceTypeName}
                                                </p>
                                                {option.estimatedDelivery && (
                                                    <p className="text-xs text-gray-500">
                                                        Llega el {formatDate(option.estimatedDelivery)}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-brand-black whitespace-nowrap">
                                                {option.price === 0 ? 'GRATIS' : formatPrice(option.price)}
                                            </span>
                                        </label>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleQuoteShipping}
                                        className="text-xs text-primary hover:underline mt-1"
                                    >
                                        Volver a cotizar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Método de Pago */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
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

                        {/* Campo adicional para transferencia */}
                        {paymentMethod === 'transfer' && (
                            <div className="ml-8 mt-2 mb-4 animate-fade-in">
                                <label className="block text-sm font-semibold text-dark-gray mb-1">
                                    DNI del titular que transferirá <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    className="input w-full md:w-2/3 border-gray-200"
                                    placeholder="Sin puntos ni espacios (Ej: 30123456)"
                                    value={formData.transfer_dni || ''}
                                    onChange={(e) => handleInputChange('transfer_dni', (e.target as HTMLInputElement).value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Necesario para validar y confirmar tu pago automáticamente.
                                </p>
                            </div>
                        )}

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
                            {deliveryMethod === 'pickup' ? (
                                <span className="text-success font-semibold text-sm">Retiro gratis</span>
                            ) : selectedShipping ? (
                                <span className="font-semibold">
                                    {selectedShipping.price === 0 ? (
                                        <span className="text-success">GRATIS</span>
                                    ) : (
                                        formatPrice(selectedShipping.price)
                                    )}
                                </span>
                            ) : (
                                <span className="italic text-xs text-gray-400">Cotizar arriba</span>
                            )}
                        </div>
                        <div className="flex justify-between text-xl font-heading font-bold text-brand-black pt-2">
                            <span>Total</span>
                            <span>{formatPrice(grandTotal)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || (deliveryMethod === 'delivery' && !selectedShipping)}
                        className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

                    {deliveryMethod === 'delivery' && !selectedShipping && (
                        <p className="text-center text-xs text-amber-600 mt-3 font-medium">
                            ⚠️ Cotizá el envío antes de finalizar
                        </p>
                    )}

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
                                            total: grandTotal,
                                            shippingCost: shippingCost,
                                            shippingData: formData,
                                            shippingMethod: deliveryMethod,
                                            selectedShipping: selectedShipping || null,
                                            paymentMethod: 'mock_payment',
                                            notes: 'Simulación de pago local'
                                        })
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setOrderSuccess({ id: data.orderId, number: data.orderNumber, total: grandTotal });
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
