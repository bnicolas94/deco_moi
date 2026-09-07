import { ARGENTINE_POSTAL_LOCATIONS } from './argentinePostalLocations.ts';

export interface ArgentinePostalLocation {
    city: string;
    state: string;
    postalCode: string;
}

export function lookupArgentinePostalCode(postalCode: string): ArgentinePostalLocation | null {
    const location = ARGENTINE_POSTAL_LOCATIONS[postalCode as keyof typeof ARGENTINE_POSTAL_LOCATIONS];
    if (!location) return null;

    return {
        city: location[0],
        state: location[1],
        postalCode,
    };
}

export function normalizeArgentinePostalCode(value: unknown): string | null {
    const normalized = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const match = normalized.match(/^[A-Z]?(\d{4})[A-Z]{0,3}$/);
    return match?.[1] || null;
}

export async function resolveArgentinePostalCode(postalCode: string): Promise<ArgentinePostalLocation | null> {
    const localLocation = lookupArgentinePostalCode(postalCode);
    if (localLocation) return localLocation;

    const response = await fetch(`https://api.zippopotam.us/AR/${encodeURIComponent(postalCode)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6_000),
    });

    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`No se pudo resolver el código postal (${response.status})`);
    }

    const payload = await response.json();
    const place = Array.isArray(payload?.places) ? payload.places[0] : null;
    if (!place?.['place name'] || !place?.state) return null;

    return {
        city: String(place['place name']),
        state: String(place.state),
        postalCode,
    };
}
