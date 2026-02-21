export interface MeliPricingConfigType {
    commissionPct: string | number;
    fixedCostThreshold1?: string | number | null;
    fixedCostAmount1?: string | number | null;
    fixedCostThreshold2?: string | number | null;
    fixedCostAmount2?: string | number | null;
    fixedCostThreshold3?: string | number | null;
    fixedCostAmount3?: string | number | null;
    extraMarginPct?: string | number | null;
    installmentsCostPct?: string | number | null;
    roundingStrategy?: string | null;
}

export function getFixedCostForPrice(basePrice: number, config: MeliPricingConfigType): number {
    const threshold1 = Number(config.fixedCostThreshold1 || 0);
    const amount1 = Number(config.fixedCostAmount1 || 0);

    const threshold2 = Number(config.fixedCostThreshold2 || 0);
    const amount2 = Number(config.fixedCostAmount2 || 0);

    const threshold3 = Number(config.fixedCostThreshold3 || 0);
    const amount3 = Number(config.fixedCostAmount3 || 0);

    if (threshold1 > 0 && basePrice <= threshold1) {
        return amount1;
    }
    if (threshold2 > 0 && basePrice <= threshold2) {
        return amount2;
    }
    if (threshold3 > 0 && basePrice <= threshold3) {
        return amount3;
    }

    // Si supera el threshold 3, no hay costo fijo (según configuración default de ML)
    return 0;
}

export function calculateMeliPrice(basePrice: number, config: MeliPricingConfigType): number {
    const fixedCost = getFixedCostForPrice(basePrice, config);

    const commissionPct = Number(config.commissionPct || 0) / 100;
    const extraMarginPct = Number(config.extraMarginPct || 0) / 100;
    const installmentsCostPct = Number(config.installmentsCostPct || 0) / 100;

    const totalDeductionRate = commissionPct + extraMarginPct + installmentsCostPct;

    // Evitar división por cero o negativa
    if (totalDeductionRate >= 1) {
        throw new Error('Deduction rate over 100%, cannot calculate price');
    }

    let finalPrice = (basePrice + fixedCost) / (1 - totalDeductionRate);

    const strategy = config.roundingStrategy || 'round';
    if (strategy === 'ceil') {
        return Math.ceil(finalPrice);
    } else if (strategy === 'floor') {
        return Math.floor(finalPrice);
    }
    return Math.round(finalPrice);
}

export function calculateNetReceived(meliPrice: number, config: MeliPricingConfigType, basePrice: number): number {
    const fixedCost = getFixedCostForPrice(basePrice, config);
    const commissionPct = Number(config.commissionPct || 0) / 100;
    const installmentsCostPct = Number(config.installmentsCostPct || 0) / 100;

    // Total deducciones ML reales (no incluimos nuestro extraMargin aquí porque queremos calcular el NETO real recibido de ML)
    const totalMlCommission = meliPrice * (commissionPct + installmentsCostPct);

    return meliPrice - totalMlCommission - fixedCost;
}

export function getPriceBreakdown(basePrice: number, config: MeliPricingConfigType) {
    const fixedCost = getFixedCostForPrice(basePrice, config);
    const meliPrice = calculateMeliPrice(basePrice, config);

    const commissionPct = Number(config.commissionPct || 0) / 100;
    const extraMarginPct = Number(config.extraMarginPct || 0) / 100;
    const installmentsCostPct = Number(config.installmentsCostPct || 0) / 100;

    const mlCommissionAmount = meliPrice * commissionPct;
    const extraMarginAmount = meliPrice * extraMarginPct;
    const installmentsCostAmount = meliPrice * installmentsCostPct;

    const netReceived = calculateNetReceived(meliPrice, config, basePrice);

    const effectiveMarginPct = basePrice > 0 ? ((netReceived - basePrice) / basePrice) * 100 : 0;

    return {
        basePrice,
        fixedCost: Number(fixedCost.toFixed(2)),
        mlCommissionAmount: Number(mlCommissionAmount.toFixed(2)),
        extraMarginAmount: Number(extraMarginAmount.toFixed(2)),
        installmentsCostAmount: Number(installmentsCostAmount.toFixed(2)),
        meliPrice,
        netReceived: Number(netReceived.toFixed(2)),
        effectiveMarginPct: Number(effectiveMarginPct.toFixed(2)),
    };
}
