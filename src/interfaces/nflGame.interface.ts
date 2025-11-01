export interface NflGameInterface {
    season: number;
    week: number;
    date?: string;
    home_team: string;
    away_team: string;
    home_score?: number;
    away_score?: number;
    home_win: number; // 1 or 0

    // Market data
    spread?: number;
    total?: number;
    home_moneyline_open?: number;
    home_moneyline_close?: number;
    away_moneyline_open?: number;
    away_moneyline_close?: number;

    // Team features
    rest_days_home?: number;
    rest_days_away?: number;
    rolling_form_home?: number;
    rolling_form_away?: number;

    // Context features
    divisional?: number;
    thursday_game?: number;
    international?: number;
    travel_miles?: number;

    // Any other custom features
    [key: string]: string | number | undefined;
}