export interface ModelMetrics {
    brierScore: number;
    accuracy: number;
    calibrationData: Array<{
        predictedProb: number;
        actualProb: number;
        count: number;
    }>;
}

export interface Prediction {
    event: any;
    modelProbability: number;
    homeTeam: string;
    awayTeam: string;
    homeOdds: number;
    awayOdds: number;
    homeMarketProb: number;
    awayMarketProb: number;
    homeDeVigProb: number;
    awayDeVigProb: number;
    homeEV: number;
    awayEV: number;
    homeKelly: number;
    awayKelly: number;
    commenceTime: string;
    features: number[];
}