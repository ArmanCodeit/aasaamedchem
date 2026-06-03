export type UnitType = "g" | "kg" | "mL" | "L" | "items";

export interface UnitDimension {
  name: "Weight" | "Volume" | "Count";
  units: UnitType[];
}

export const DIMENSIONS: UnitDimension[] = [
  { name: "Weight", units: ["g", "kg"] },
  { name: "Volume", units: ["mL", "L"] },
  { name: "Count", units: ["items"] },
];

export function getUnitDimension(unit: string): "Weight" | "Volume" | "Count" | null {
  for (const dim of DIMENSIONS) {
    if (dim.units.includes(unit as UnitType)) {
      return dim.name;
    }
  }
  return null;
}

export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const dimA = getUnitDimension(unitA);
  const dimB = getUnitDimension(unitB);
  return dimA !== null && dimA === dimB;
}

export function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return 1;

  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(`Incompatible units: cannot convert ${fromUnit} to ${toUnit}`);
  }

  if (fromUnit === "kg" && toUnit === "g") return 1000;
  if (fromUnit === "g" && toUnit === "kg") return 0.001;

  if (fromUnit === "L" && toUnit === "mL") return 1000;
  if (fromUnit === "mL" && toUnit === "L") return 0.001;

  return 1;
}

export function calculateBaseQuantity(orderQuantity: number, orderUnit: string, baseUnit: string): number {
  const factor = getConversionFactor(orderUnit, baseUnit);
  return orderQuantity * factor;
}

export function calculateOrderUnitPrice(basePrice: number, baseUnit: string, orderUnit: string): number {
  const factor = getConversionFactor(baseUnit, orderUnit);
  return basePrice / factor;
}
