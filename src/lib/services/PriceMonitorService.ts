import { db } from '../db/connection';
import { supplies } from '../db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { getMeliItem } from '../integrations/mercadolibre/items';

export class PriceMonitorService {

    static async scanAllPrices(): Promise<{ scanned: number, updated: number, errors: number }> {
        const list = await db.select().from(supplies).where(
            and(
                isNotNull(supplies.link),
                eq(supplies.isActive, true)
            )
        );

        let scanned = 0;
        let updated = 0;
        let errors = 0;

        for (const item of list) {
            try {
                if (!item.link) continue;
                scanned++;

                const detectedPrice = await this.scrapePrice(item.link);

                if (detectedPrice !== null) {
                    await db.update(supplies).set({
                        lastScrapedPrice: detectedPrice.toString(),
                        lastScrapedAt: new Date(),
                    }).where(eq(supplies.id, item.id));
                    updated++;
                } else {
                    errors++;
                }
            } catch (err) {
                console.error(`Error scanning price for ${item.name}:`, err);
                errors++;
            }
        }

        return { scanned, updated, errors };
    }

    private static async scrapePrice(url: string): Promise<number | null> {
        try {
            // 1. Mercado Libre Case
            if (url.includes('mercadolibre.com')) {
                try {
                    // Try to extract Item ID or Product ID
                    const itemMatch = url.match(/MLA-?(\d+)/i);
                    const productMatch = url.match(/\/p\/(MLA\d+)/i);

                    if (itemMatch || productMatch) {
                        const id = productMatch ? productMatch[1] : `MLA${itemMatch![1]}`;
                        const isProduct = !!productMatch;

                        // If it's a product (/p/), we should ideally use the products endpoint,
                        // but getMeliItem uses /items/. Let's try to get price from site if API fails.
                        const data = await getMeliItem(id);
                        if (data && data.price) return data.price;
                    }
                } catch (err) {
                    console.warn(`Meli API failed for ${url}, falling back to generic scraper...`);
                }
                // If API fails or doesn't return price, FALL THROUGH to generic scraper
            }

            // 2. Generic Web Scraper (Meta Tags)
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) return null;

            const html = await response.text();

            // 1. Try specialized platform meta tags (TiendaNube gold standard)
            const specializedMatch = html.match(/property="tiendanube:price" content="([^"]+)"/i);
            if (specializedMatch) {
                const p = parseFloat(specializedMatch[1]);
                if (!isNaN(p) && p > 0) return p;
            }

            // 2. Try JSON-LD (Search for "price" in application/ld+json)
            try {
                const ldJsonMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
                if (ldJsonMatches) {
                    const priceCandidates: { price: number; isMain: boolean }[] = [];

                    for (const script of ldJsonMatches) {
                        const content = script.replace(/<script[^>]*>|<\/script>/gi, '').trim();
                        try {
                            const data = JSON.parse(content);

                            const traverse = (obj: any) => {
                                if (!obj || typeof obj !== 'object') return;

                                if (obj['@type'] === 'Product' || obj.type === 'Product') {
                                    let price: number | null = null;
                                    if (obj.price && !isNaN(parseFloat(obj.price))) {
                                        price = parseFloat(obj.price);
                                    } else if (obj.offers) {
                                        const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
                                        for (const offer of offers) {
                                            if (offer.price && !isNaN(parseFloat(offer.price))) {
                                                price = parseFloat(offer.price);
                                                break;
                                            }
                                        }
                                    }

                                    if (price && price > 0) {
                                        // Heuristic to detect if it's the main product
                                        // Usually main product JSON-LD doesn't have "position" or is part of a BreadcrumbList
                                        const isMain = !obj.position && !!obj.image && !!obj.description;
                                        priceCandidates.push({ price, isMain });
                                    }
                                }

                                if (Array.isArray(obj)) {
                                    obj.forEach(traverse);
                                } else {
                                    Object.values(obj).forEach(traverse);
                                }
                            };

                            traverse(data);
                        } catch (e) { }
                    }

                    if (priceCandidates.length > 0) {
                        // Prioritize candidates marked as main product
                        const mainCandidate = priceCandidates.find(c => c.isMain);
                        if (mainCandidate) return mainCandidate.price;
                        return priceCandidates[0].price;
                    }
                }
            } catch (err) { }

            // 3. Try to find og:price:amount or standard meta tags
            const ogPriceMatch = html.match(/property="og:price:amount" content="([^"]+)"/i) ||
                html.match(/name="price" content="([^"]+)"/i) ||
                html.match(/itemprop="price" content="([^"]+)"/i);

            if (ogPriceMatch) {
                const p = parseFloat(ogPriceMatch[1].replace(',', '.'));
                if (!isNaN(p) && p > 0) return p;
            }

            // 3. Fallback: look for common patterns in meta tags or script json
            const pricePattern = /"price":\s*"?([\d.,]+)"?/i;
            const priceMatch = html.match(pricePattern);
            if (priceMatch) {
                const p = parseFloat(priceMatch[1].replace(',', '.'));
                if (!isNaN(p) && p > 0) return p;
            }

            return null;
        } catch (err) {
            console.error('Scrape error:', err);
            return null;
        }
    }
}
