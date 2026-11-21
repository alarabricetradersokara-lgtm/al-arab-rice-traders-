import Decimal from 'decimal.js';

// Configure Decimal.js precision for financial & commodity math
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export class RiceCalculator {
  /**
   * Convert bag count to kilograms based on bag unit weight
   */
  static bagsToKg(bagCount: number, bagWeightKg: number | string | Decimal): Decimal {
    return new Decimal(bagCount).times(new Decimal(bagWeightKg.toString()));
  }

  /**
   * Convert kilograms to 40kg Maunds (standard South Asian grain measure)
   */
  static kgToMaunds(weightKg: number | string | Decimal, maundStandardKg = 40): Decimal {
    return new Decimal(weightKg.toString()).dividedBy(new Decimal(maundStandardKg));
  }

  /**
   * Convert 40kg Maunds to kilograms
   */
  static maundsToKg(maunds: number | string | Decimal, maundStandardKg = 40): Decimal {
    return new Decimal(maunds.toString()).times(new Decimal(maundStandardKg));
  }

  /**
   * Calculate empty bag tare deduction (Bardana)
   */
  static calculateBardanaTare(bagCount: number, tarePerBagKg: number | string | Decimal): Decimal {
    return new Decimal(bagCount).times(new Decimal(tarePerBagKg.toString()));
  }

  /**
   * Calculate moisture deduction weight (Karda)
   * Formula: Weight * (TestedMoisture - BaseStandardMoisture) / 100
   */
  static calculateMoistureCut(
    scaleNetWeightKg: number | string | Decimal,
    testedMoisturePct: number | string | Decimal,
    baseStandardMoisturePct = 14.0
  ): Decimal {
    const moisture = new Decimal(testedMoisturePct.toString());
    const base = new Decimal(baseStandardMoisturePct);
    if (moisture.lessThanOrEqualTo(base)) {
      return new Decimal(0);
    }
    const diffPct = moisture.minus(base);
    return new Decimal(scaleNetWeightKg.toString()).times(diffPct).dividedBy(100);
  }

  /**
   * Calculate commission amount
   * Formula: Amount * (RatePct / 100)
   */
  static calculateCommission(amount: number | string | Decimal, ratePercent: number | string | Decimal): Decimal {
    return new Decimal(amount.toString()).times(new Decimal(ratePercent.toString())).dividedBy(100);
  }

  /**
   * Add multiple values with absolute precision
   */
  static add(...values: (number | string | Decimal)[]): Decimal {
    return values.reduce<Decimal>((acc, val) => acc.plus(new Decimal(val.toString())), new Decimal(0));
  }

  /**
   * Subtract values with absolute precision (val1 - val2 - val3 ...)
   */
  static subtract(first: number | string | Decimal, ...rest: (number | string | Decimal)[]): Decimal {
    return rest.reduce<Decimal>((acc, val) => acc.minus(new Decimal(val.toString())), new Decimal(first.toString()));
  }

  /**
   * Multiply values with absolute precision
   */
  static multiply(...values: (number | string | Decimal)[]): Decimal {
    return values.reduce<Decimal>((acc, val) => acc.times(new Decimal(val.toString())), new Decimal(1));
  }

  /**
   * Format to exact standard decimal string (default: 4 decimals for weights/rates, 2 for display currency)
   */
  static format(val: number | string | Decimal, decimalPlaces = 4): string {
    return new Decimal(val.toString()).toFixed(decimalPlaces);
  }
}

export default RiceCalculator;
