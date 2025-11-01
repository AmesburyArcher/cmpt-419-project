export const API_CONFIG = {
    ODDS_API: {
        BASE_URL: 'https://api.the-odds-api.com/v4',
        API_KEY: import.meta.env.VITE_SPORTS_ODDS_API_KEY || '',
    },
    // Rate limiting info for Odds API
    RATE_LIMIT: {
        REQUESTS_PER_MONTH: 500,
        REQUESTS_PER_SECOND: 1,
    }
} as const;

export const SPORTS = {
    NFL: 'americanfootball_nfl',
} as const;

export const REGIONS = {
    US: 'us',
    UK: 'uk',
    EU: 'eu',
    AU: 'au',
} as const;

export const MARKETS = {
    H2H: 'h2h',           // Head to head (moneyline)
    SPREADS: 'spreads',   // Point spreads
    TOTALS: 'totals',     // Over/under
} as const;

export const ODDS_FORMAT = {
    DECIMAL: 'decimal',
    AMERICAN: 'american',
} as const;