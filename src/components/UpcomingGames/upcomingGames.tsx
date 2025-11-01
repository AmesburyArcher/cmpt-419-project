import { useMemo } from "react";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { useOdds } from "@/services/queries/useOddsQueries.queries.ts";
import { MARKETS, ODDS_FORMAT, REGIONS, SPORTS } from "@/config/api.config.ts";
import { mapLiveGameToFeatures } from "@/utils/predictionMapper.utils.ts";
import {
  calculateEV,
  deVig,
  kellyStake,
  oddsToImpliedProbability,
} from "@/utils/odds.utils.ts";

interface UpcomingGamesProps {
  model: LogisticRegressionModel;
  selectedFeatures: string[];
  historicalGames: NflGameInterface[];
}

export function UpcomingGames({
  model,
  selectedFeatures,
  historicalGames,
}: UpcomingGamesProps) {
  const {
    data: liveEvents,
    isLoading,
    error,
  } = useOdds({
    sport: SPORTS.NFL,
    regions: REGIONS.US,
    markets: `${MARKETS.H2H},${MARKETS.SPREADS},${MARKETS.TOTALS}`,
    oddsFormat: ODDS_FORMAT.AMERICAN,
  });

  const predictions = useMemo(() => {
    if (!liveEvents || liveEvents.length === 0) return [];

    return liveEvents
      .map((event) => {
        // Map live event to model features
        const features = mapLiveGameToFeatures(
          event,
          selectedFeatures,
          historicalGames,
        );

        // Get model prediction
        const modelProbability = model.predictSingle(features);

        // Get market odds
        const h2hMarket = event.bookmakers[0]?.markets.find(
          (m) => m.key === "h2h",
        );
        const homeOutcome = h2hMarket?.outcomes.find(
          (o) => o.name === event.home_team,
        );
        const awayOutcome = h2hMarket?.outcomes.find(
          (o) => o.name === event.away_team,
        );

        if (!homeOutcome || !awayOutcome) return null;

        // Calculate market probabilities
        const homeMarketProb = oddsToImpliedProbability(homeOutcome.price);
        const awayMarketProb = oddsToImpliedProbability(awayOutcome.price);

        // De-vig
        const [homeDeVigProb, awayDeVigProb] = deVig([
          homeMarketProb,
          awayMarketProb,
        ]);

        // Calculate EV
        const homeEV = calculateEV(modelProbability, homeOutcome.price);
        const awayEV = calculateEV(1 - modelProbability, awayOutcome.price);

        // Kelly stake (for $1000 bankroll, quarter Kelly)
        const homeKelly = kellyStake(modelProbability, homeOutcome.price, 1000);
        const awayKelly = kellyStake(
          1 - modelProbability,
          awayOutcome.price,
          1000,
        );

        return {
          event,
          modelProbability,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          homeOdds: homeOutcome.price,
          awayOdds: awayOutcome.price,
          homeMarketProb,
          awayMarketProb,
          homeDeVigProb,
          awayDeVigProb,
          homeEV,
          awayEV,
          homeKelly,
          awayKelly,
          commenceTime: event.commence_time,
          features,
        };
      })
      .filter((p) => p !== null);
  }, [liveEvents, model, selectedFeatures, historicalGames]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Loading upcoming games...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded">
          Error loading odds: {error.message}
        </div>
      </div>
    );
  }

  // Filter for +EV opportunities
  const positiveEVBets = predictions.filter(
    (p) => p.homeEV > 0.02 || p.awayEV > 0.02, // At least 2% edge
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Step 3: Live Predictions
        </h2>
        <p className="text-gray-600 mb-4">
          Model predictions vs current market odds. Positive EV bets are
          highlighted.
        </p>

        {positiveEVBets.length > 0 && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 rounded p-4">
            <p className="font-semibold text-green-800">
              🎯 Found {positiveEVBets.length} potential +EV opportunities
            </p>
          </div>
        )}

        <div className="space-y-4">
          {predictions.map((pred, idx) => {
            const hasEdge = pred.homeEV > 0.02 || pred.awayEV > 0.02;

            return (
              <div
                key={idx}
                className={`border-2 rounded-lg p-4 ${
                  hasEdge ? "border-green-300 bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold">
                      {pred.awayTeam} @ {pred.homeTeam}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(pred.commenceTime).toLocaleString()}
                    </p>
                  </div>
                  {hasEdge && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">
                      +EV
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Home Team */}
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold mb-2">{pred.homeTeam}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-mono font-bold">
                          {(pred.modelProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market:</span>
                        <span className="font-mono">
                          {(pred.homeMarketProb * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">De-vig:</span>
                        <span className="font-mono">
                          {(pred.homeDeVigProb * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-gray-600">Odds:</span>
                        <span className="font-mono font-bold">
                          {pred.homeOdds > 0 ? "+" : ""}
                          {pred.homeOdds}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">EV:</span>
                        <span
                          className={`font-mono font-bold ${
                            pred.homeEV > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {(pred.homeEV * 100).toFixed(2)}%
                        </span>
                      </div>
                      {pred.homeEV > 0 && (
                        <div className="flex justify-between bg-blue-50 p-1 rounded">
                          <span className="text-gray-600">Kelly (¼):</span>
                          <span className="font-mono font-bold text-blue-600">
                            ${pred.homeKelly.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold mb-2">{pred.awayTeam}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-mono font-bold">
                          {((1 - pred.modelProbability) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market:</span>
                        <span className="font-mono">
                          {(pred.awayMarketProb * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">De-vig:</span>
                        <span className="font-mono">
                          {(pred.awayDeVigProb * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-gray-600">Odds:</span>
                        <span className="font-mono font-bold">
                          {pred.awayOdds > 0 ? "+" : ""}
                          {pred.awayOdds}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">EV:</span>
                        <span
                          className={`font-mono font-bold ${
                            pred.awayEV > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {(pred.awayEV * 100).toFixed(2)}%
                        </span>
                      </div>
                      {pred.awayEV > 0 && (
                        <div className="flex justify-between bg-blue-50 p-1 rounded">
                          <span className="text-gray-600">Kelly (¼):</span>
                          <span className="font-mono font-bold text-blue-600">
                            ${pred.awayKelly.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
