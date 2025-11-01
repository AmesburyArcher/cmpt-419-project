export interface OddsApiBookmaker {
    key: string;
    title: string;
    last_update: string;
    markets: OddsApiMarket[];
}

export interface OddsApiMarket {
    key: 'h2h' | 'spreads' | 'totals';
    last_update: string;
    outcomes: OddsApiOutcome[];
}

export interface OddsApiOutcome {
    name: string;
    price: number; // American odds (e.g., -110, +150) or decimal
    point?: number; // For spreads/totals
}

export interface OddsApiEvent {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: OddsApiBookmaker[];
}

export interface OddsApiSport {
    key: string;
    group: string;
    title: string;
    description: string;
    active: boolean;
    has_outrights: boolean;
}

export interface OddsApiResponse<T> {
    data: T;
    remaining_requests?: number;
    used_requests?: number;
}

// Params for API calls
export interface GetOddsParams {
    sport: string;
    regions?: string;
    markets?: string;
    oddsFormat?: string;
    dateFormat?: string;
    eventIds?: string;
    bookmakers?: string;
}

export interface GetScoresParams {
    sport: string;
    daysFrom?: number;
    dateFormat?: string;
}