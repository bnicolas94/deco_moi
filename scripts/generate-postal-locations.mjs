import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SOURCE_URL = 'https://raw.githubusercontent.com/XnachO/localidades-provincias-argentina/master/sql/structure_tables%2Bdata.sql';
const OUTPUT_PATH = resolve('src/lib/shipping/argentinePostalLocations.ts');

function titleCase(value) {
    return value
        .toLocaleLowerCase('es-AR')
        .replace(/(^|[\s-])([a-záéíóúüñ])/giu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase('es-AR')}`);
}

function normalizeProvince(value) {
    const normalized = value.trim().toLocaleLowerCase('es-AR');
    const names = {
        'capital federal': 'Ciudad Autónoma de Buenos Aires',
        'cordoba': 'Córdoba',
        'entre rios': 'Entre Ríos',
        'rio negro': 'Río Negro',
        'santa fe': 'Santa Fe',
        'tucuman': 'Tucumán',
    };
    return names[normalized] || titleCase(value.trim());
}

function candidateScore(city, province) {
    const normalizedCity = city.toLocaleUpperCase('es-AR');
    const normalizedProvince = province.toLocaleUpperCase('es-AR');
    if (normalizedProvince === 'CIUDAD AUTÓNOMA DE BUENOS AIRES') return -1_000;
    if (normalizedCity === normalizedProvince) return -900;

    const secondaryPrefixes = [
        'BARRIO ', 'VILLA ', 'CAMPO ', 'ESTACION ', 'ESTACIÓN ', 'KILOMETRO ',
        'KILÓMETRO ', 'COLONIA ', 'PARAJE ', 'BASE ', 'LAGUNA ', 'EL ', 'LA ',
        'LOS ', 'LAS ',
    ];
    return (secondaryPrefixes.some((prefix) => normalizedCity.startsWith(prefix)) ? 100 : 0) + city.length / 100;
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`No se pudo descargar la base postal: ${response.status}`);

const source = await response.text();
const candidates = new Map();
const rowPattern = /^\s*\(\d+,\s*(\d+),\s*'((?:\\'|[^'])*)',\s*'((?:\\'|[^'])*)'\),?$/gm;

for (const match of source.matchAll(rowPattern)) {
    const [, postalCode, cityRaw, provinceRaw] = match;
    if (!/^\d{4}$/.test(postalCode) || !provinceRaw || !cityRaw) continue;

    const province = normalizeProvince(provinceRaw);
    const city = province === 'Ciudad Autónoma de Buenos Aires'
        ? 'Ciudad Autónoma de Buenos Aires'
        : titleCase(cityRaw.trim());
    const candidate = { city, state: province, score: candidateScore(city, province) };
    const current = candidates.get(postalCode);
    if (!current || candidate.score < current.score) candidates.set(postalCode, candidate);
}

const locations = Object.fromEntries(
    [...candidates.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([postalCode, value]) => [postalCode, [value.city, value.state]]),
);

const output = `// Archivo generado por scripts/generate-postal-locations.mjs.\n`
    + `// Fuente MIT: XnachO/localidades-provincias-argentina.\n`
    + `export const ARGENTINE_POSTAL_LOCATIONS = ${JSON.stringify(locations)} as const;\n`;

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, output, 'utf8');
console.log(`Generadas ${Object.keys(locations).length} referencias postales en ${OUTPUT_PATH}`);
