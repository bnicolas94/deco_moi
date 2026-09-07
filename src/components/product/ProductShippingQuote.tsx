import { useEffect, useRef, useState } from 'react';

interface QuoteResult {
    id: string;
    carrierName: string;
    serviceTypeName: string;
    price: number;
    estimatedDelivery: string;
}

interface QuoteResponse {
    results: QuoteResult[];
    location: { city: string; state: string; postalCode: string };
    quantity: number;
    error?: string;
}

interface Props {
    productId: number;
    minimumQuantity: number;
}

const formatPrice = (value: number) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
}).format(value);

const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
};

export default function ProductShippingQuote({ productId, minimumQuantity }: Props) {
    const [postalCode, setPostalCode] = useState('');
    const [quantity, setQuantity] = useState(minimumQuantity);
    const [data, setData] = useState<QuoteResponse | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const requestId = useRef(0);

    useEffect(() => {
        const input = document.getElementById('qty-input') as HTMLInputElement | null;
        const syncQuantity = () => setQuantity(Math.max(minimumQuantity, Number(input?.value) || minimumQuantity));
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('#qty-minus, #qty-plus')) setTimeout(syncQuantity, 0);
        };

        syncQuantity();
        input?.addEventListener('change', syncQuantity);
        document.addEventListener('click', handleDocumentClick);
        return () => {
            input?.removeEventListener('change', syncQuantity);
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [minimumQuantity]);

    const requestQuote = async (requestedQuantity = quantity) => {
        const normalized = postalCode.trim().toUpperCase();
        if (!/^[A-Z]?\d{4}[A-Z]{0,3}$/.test(normalized)) {
            setData(null);
            setError('Ingresá un código postal válido, por ejemplo 1414.');
            return;
        }

        const currentRequest = ++requestId.current;
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/shipping/product-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, postalCode: normalized, quantity: requestedQuantity }),
            });
            const payload = await response.json();
            if (currentRequest !== requestId.current) return;
            if (!response.ok) throw new Error(payload?.error || 'No pudimos cotizar el envío.');
            setData(payload);
        } catch (quoteError) {
            if (currentRequest !== requestId.current) return;
            setData(null);
            setError(quoteError instanceof Error ? quoteError.message : 'No pudimos cotizar el envío.');
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    };

    useEffect(() => {
        if (!data || !postalCode) return;
        const timer = window.setTimeout(() => requestQuote(quantity), 450);
        return () => window.clearTimeout(timer);
    }, [quantity]);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5" aria-labelledby="shipping-quote-title">
            <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-accent">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 17h4V5H2v12h3" /><path d="M14 9h4l4 4v4h-3" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <h2 id="shipping-quote-title" className="font-heading text-base font-semibold text-brand-black">
                        Calculá tu envío
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        Precio estimado para {quantity} {quantity === 1 ? 'unidad' : 'unidades'} de este producto.
                    </p>
                </div>
            </div>

            <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); requestQuote(); }}>
                <label className="sr-only" htmlFor={`product-postal-code-${productId}`}>Código postal</label>
                <div className="relative min-w-0 flex-1">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                        id={`product-postal-code-${productId}`}
                        value={postalCode}
                        onInput={(event) => setPostalCode((event.currentTarget as HTMLInputElement).value)}
                        inputMode="text"
                        autoComplete="postal-code"
                        maxLength={8}
                        placeholder="Código postal"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-black px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
                >
                    {loading ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin" aria-label="Cotizando">
                            <path d="M21 12a9 9 0 1 1-6.2-8.6" />
                        </svg>
                    ) : 'Calcular'}
                </button>
            </form>

            {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

            {data && (
                <div className="mt-4 space-y-2" aria-live="polite">
                    <p className="text-xs font-medium text-gray-500">
                        Entrega a {data.location.city}, {data.location.state}
                    </p>
                    {data.results.map((result) => (
                        <div key={result.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-off-white px-3 py-2.5">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-brand-black">{result.carrierName}</p>
                                <p className="truncate text-[11px] text-gray-500">
                                    {result.serviceTypeName}{formatDate(result.estimatedDelivery) ? ` · Llega aprox. ${formatDate(result.estimatedDelivery)}` : ''}
                                </p>
                            </div>
                            <span className="whitespace-nowrap text-sm font-bold text-brand-black">{formatPrice(result.price)}</span>
                        </div>
                    ))}
                    <p className="pt-1 text-[10px] leading-relaxed text-gray-400">
                        La opción y el importe final se confirman en el checkout según el carrito y la dirección completa.
                    </p>
                </div>
            )}
        </section>
    );
}
