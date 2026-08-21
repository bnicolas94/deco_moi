import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const textExtensions = new Set([
    '', '.astro', '.cjs', '.css', '.env', '.example', '.html', '.js', '.json',
    '.jsx', '.md', '.mjs', '.sql', '.toml', '.ts', '.tsx', '.txt', '.xml',
    '.yaml', '.yml',
]);

const forbiddenNames = [
    { name: 'archivo de entorno', pattern: /(^|\/)\.env(?:\.|$)/i },
    { name: 'respaldo de base de datos', pattern: /(^|\/).*(?:backup.*\.sql|\.(?:dump|backup|bak|sql\.gz))$/i },
    { name: 'clave privada', pattern: /\.(?:pem|key|p12|pfx)$/i },
];

const secretPatterns = [
    { name: 'clave privada', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
    { name: 'URL de base de datos', pattern: /(?:postgres(?:ql)?|mysql):\/\/[^\s'"<>]+/i },
    { name: 'clave de AWS', pattern: /(?:^|[^A-Z0-9])(?:AKIA|ASIA)[A-Z0-9]{16}(?:$|[^A-Z0-9])/ },
    { name: 'token de GitHub', pattern: /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/ },
    { name: 'clave de Google', pattern: /AIza[0-9A-Za-z_-]{35}/ },
    { name: 'clave privada de Stripe', pattern: /sk_live_[0-9A-Za-z]{16,}/ },
    { name: 'token de Slack', pattern: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
];

const allowedNames = new Set(['.env.example']);
const findings = [];
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);

for (const file of trackedFiles) {
    let stats;
    try {
        stats = statSync(file);
    } catch {
        continue;
    }

    if (!allowedNames.has(file)) {
        for (const rule of forbiddenNames) {
            if (rule.pattern.test(file)) findings.push({ file, category: rule.name });
        }
    }

    if (stats.size > MAX_FILE_SIZE || !textExtensions.has(extname(file).toLowerCase())) continue;

    const content = readFileSync(file, 'utf8');
    if (content.includes('\0')) continue;

    for (const rule of secretPatterns) {
        if (rule.pattern.test(content)) findings.push({ file, category: rule.name });
    }
}

const uniqueFindings = [
    ...new Map(findings.map((finding) => [`${finding.file}:${finding.category}`, finding])).values(),
];

if (uniqueFindings.length > 0) {
    console.error('Se detectaron archivos o patrones sensibles:');
    for (const finding of uniqueFindings) {
        console.error(`- ${finding.file}: ${finding.category}`);
    }
    console.error('No se muestran los valores detectados para evitar una exposición adicional.');
    process.exit(1);
}

console.log(`Verificación completada: ${trackedFiles.length} archivos versionados sin secretos evidentes.`);
