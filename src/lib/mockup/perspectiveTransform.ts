// Implementación ligera de Perspective Transform (Homography)
// Basada en soluciones estándar de álgebra lineal para mapeo de 4 puntos.

export interface Point {
    x: number;
    y: number;
}

export class PerspectiveTransform {
    matrix: number[];
    matrixInv: number[];

    constructor(src: number[], dst: number[]) {
        // src y dst son arrays planos [x0, y0, x1, y1, x2, y2, x3, y3]
        // correspondientes a TopLeft, TopRight, BottomRight, BottomLeft (u orden consistente)

        // Calcular matriz directa (src -> dst)
        this.matrix = getHomographyMatrix(src, dst);
        // Calcular matriz inversa (dst -> src) para el mapeo inverso de píxeles
        this.matrixInv = getHomographyMatrix(dst, src);
    }

    transform(x: number, y: number): { x: number; y: number } {
        return applyTransform(x, y, this.matrix);
    }

    transformInverse(x: number, y: number): { x: number; y: number } {
        return applyTransform(x, y, this.matrixInv);
    }
}

function applyTransform(x: number, y: number, matrix: number[]) {
    const [a, b, c, d, e, f, g, h] = matrix;
    const w = g * x + h * y + 1;

    // Evitar división por cero
    if (Math.abs(w) < 0.000001) {
        return { x: x, y: y };
    }

    return {
        x: (a * x + b * y + c) / w,
        y: (d * x + e * y + f) / w
    };
}

// Resuelve Ax = b usando eliminación gaussiana para encontrar los coeficientes de la homografía
// Mapea (u, v) -> (x, y)
// x = (a*u + b*v + c) / (g*u + h*v + 1)
// y = (d*u + e*v + f) / (g*u + h*v + 1)
function getHomographyMatrix(src: number[], dst: number[]): number[] {
    const system: number[][] = [];
    const solution: number[] = [];

    for (let i = 0; i < 4; i++) {
        const u = src[2 * i];
        const v = src[2 * i + 1];
        const x = dst[2 * i];
        const y = dst[2 * i + 1];

        // Ecuación para x
        // a*u + b*v + c - g*u*x - h*v*x = x
        system.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
        solution.push(x);

        // Ecuación para y
        // d*u + e*v + f - g*u*y - h*v*y = y
        system.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
        solution.push(y);
    }

    const coeffs = gaussianElimination(system, solution);

    // Retorna [a, b, c, d, e, f, g, h]
    return coeffs;
}

function gaussianElimination(A: number[][], b: number[]): number[] {
    const n = A.length;

    // Forward elimination
    for (let i = 0; i < n; i++) {
        // Pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
                maxRow = k;
            }
        }

        // Swap rows
        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        [b[i], b[maxRow]] = [b[maxRow], b[i]];

        // Make triangular
        for (let k = i + 1; k < n; k++) {
            const factor = A[k][i] / A[i][i];
            b[k] -= factor * b[i];
            for (let j = i; j < n; j++) {
                A[k][j] -= factor * A[i][j];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        x[i] = (b[i] - sum) / A[i][i];
    }

    return x;
}

export default function createPerspectiveTransform(src: number[], dst: number[]) {
    return new PerspectiveTransform(src, dst);
}
