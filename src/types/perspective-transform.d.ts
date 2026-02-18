declare module 'perspective-transform' {
    interface PerspectiveTransform {
        transform(x: number, y: number): [number, number];
        transformInverse(x: number, y: number): [number, number];
        srcCor: number[][];
        dstCor: number[][];
        coeffs: number[];
        coeffsInv: number[];
    }

    function createPerspectiveTransform(
        srcCorners: number[],
        dstCorners: number[]
    ): PerspectiveTransform;

    export = createPerspectiveTransform;
}
