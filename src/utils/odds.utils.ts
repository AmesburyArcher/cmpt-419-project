export function americanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
        return (americanOdds / 100) + 1;
    } else {
        return (100 / Math.abs(americanOdds)) + 1;
    }
}

export function decimalToAmerican(decimalOdds: number): number {
    if (decimalOdds >= 2) {
        return Math.round((decimalOdds - 1) * 100);
    } else {
        return Math.round(-100 / (decimalOdds - 1));
    }
}

/**
 * Convert odds to implied probability
 */
export function oddsToImpliedProbability(odds: number, format: 'american' | 'decimal' = 'american'): number {
    let decimal = format === 'decimal' ? odds : americanToDecimal(odds);
    return 1 / decimal;
}

/**
 * Remove vig (bookmaker's margin) from odds
 * @param probabilities Array of implied probabilities from all outcomes
 */
export function deVig(probabilities: number[]): number[] {
    const totalProb = probabilities.reduce((sum, p) => sum + p, 0);
    return probabilities.map(p => p / totalProb);
}

/**
 * Calculate Expected Value (EV)
 * @param trueProbability Your model's probability
 * @param odds Market odds (American format)
 */
export function calculateEV(trueProbability: number, odds: number): number {
    const decimal = americanToDecimal(odds);
    const payout = decimal - 1; // Net payout multiplier
    return (trueProbability * payout) - ((1 - trueProbability));
}

/**
 * Calculate Kelly Criterion stake size
 * @param probability True probability of winning
 * @param odds Market odds (American format)
 * @param bankroll Current bankroll
 */
export function kellyStake(
    probability: number,
    odds: number,
    bankroll: number,
): number {
    const decimal = americanToDecimal(odds);
    const b = decimal - 1; // Net odds
    const q = 1 - probability;

    const kellyFraction = (b * probability - q) / b;
    return Math.max(0, kellyFraction) * bankroll;
}

/**
 * Get best odds from multiple bookmakers
 */
export function getBestOdds(
    bookmakers: any[],
    marketKey: string,
    outcomeName: string
): { bookmaker: string; odds: number } | null {
    let bestOdds = -Infinity;
    let bestBookmaker = '';

    bookmakers.forEach(bookmaker => {
        const market = bookmaker.markets.find((m: any) => m.key === marketKey);
        if (market) {
            const outcome = market.outcomes.find((o: any) => o.name === outcomeName);
            if (outcome && outcome.price > bestOdds) {
                bestOdds = outcome.price;
                bestBookmaker = bookmaker.title;
            }
        }
    });

    return bestOdds > -Infinity ? { bookmaker: bestBookmaker, odds: bestOdds } : null;
}