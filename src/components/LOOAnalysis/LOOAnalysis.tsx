import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import {
  getInfluentialGames,
  LOOResult,
  performLOOAnalysis,
} from "@/utils/LOO.utils.ts";

interface LOOAnalysisProps {
  historicalGames: NflGameInterface[];
  selectedFeatures: string[];
}

export function LOOAnalysis({
  historicalGames,
  selectedFeatures,
}: LOOAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    mostInfluential: LOOResult[];
    mostOutlier: LOOResult[];
  } | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(50);
  const [progress, setProgress] = useState<string>("");

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress("Starting LOO analysis...");

    try {
      const looResults = await performLOOAnalysis(
        historicalGames,
        selectedFeatures,
        sampleSize,
      );

      const { mostInfluential, mostOutlier } = getInfluentialGames(
        looResults,
        5,
      );

      setResults({ mostInfluential, mostOutlier });
      setProgress("Analysis complete!");
    } catch (error) {
      console.error("LOO analysis failed:", error);
      setProgress("Analysis failed. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Leave-One-Out (LOO) Analysis
      </h2>

      <p className="text-gray-600 mb-4">
        Identifies which data points are most influential (important) or most
        problematic (outliers) in your training data.
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Warning:</strong> LOO analysis is computationally
          expensive. For {historicalGames.length} games, this will train{" "}
          {Math.min(sampleSize, historicalGames.length)} models. Consider using
          a sample size of 50-100 games for initial testing.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sample Size
          </label>
          <input
            type="number"
            min="10"
            max={historicalGames.length}
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value))}
            className="border rounded px-3 py-2 w-24"
            disabled={isAnalyzing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Random sample from {historicalGames.length} total games
          </p>
        </div>

        <div className="flex-1">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || historicalGames.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? "Analyzing..." : "Run LOO Analysis"}
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="mb-6 flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>{progress}</span>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Most Influential Games */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-green-700">
              🎯 Top 5 Most Influential Games
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              These games are most important for model performance. Removing
              them makes the model significantly worse.
            </p>
            <div className="space-y-2">
              {results.mostInfluential.map((result, idx) => (
                <GameCard
                  key={result.gameIndex}
                  result={result}
                  rank={idx + 1}
                  type="influential"
                />
              ))}
            </div>
          </div>

          {/* Most Outlier Games */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-red-700">
              ⚠️ Top 5 Most Problematic Games (Outliers)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              These games hurt model performance. Removing them improves the
              model, suggesting they may be outliers or mislabeled.
            </p>
            <div className="space-y-2">
              {results.mostOutlier.map((result, idx) => (
                <GameCard
                  key={result.gameIndex}
                  result={result}
                  rank={idx + 1}
                  type="outlier"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface GameCardProps {
  result: LOOResult;
  rank: number;
  type: "influential" | "outlier";
}

function GameCard({ result, rank, type }: GameCardProps) {
  const game = result.game;
  const isInfluential = type === "influential";

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        isInfluential
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-lg ${
                isInfluential ? "text-green-700" : "text-red-700"
              }`}
            >
              #{rank}
            </span>
            <h4 className="font-semibold text-lg">
              {game.away_team} @ {game.home_team}
            </h4>
          </div>
          <p className="text-sm text-gray-600">
            {game.season} Week {game.week}
            {game.divisional && " • Divisional"}
            {game.thursday_game && " • Thursday"}
            {game.international && " • International"}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-mono font-bold ${
              isInfluential ? "text-green-700" : "text-red-700"
            }`}
          >
            {result.influence > 0 ? "+" : ""}
            {(result.influence * 1000).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Influence (×1000)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-white p-2 rounded">
          <div className="text-gray-600 text-xs">Result</div>
          <div className="font-semibold">
            {game.home_win ? "Home Win" : "Away Win"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-gray-600 text-xs">Spread</div>
          <div className="font-semibold font-mono">
            {(game.spread ?? 0 > 0) ? "+" : ""}
            {game.spread?.toFixed(1) ?? "N/A"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-gray-600 text-xs">Total</div>
          <div className="font-semibold font-mono">
            {game.total?.toFixed(1) ?? "N/A"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-gray-600 text-xs">Home Form</div>
          <div className="font-semibold font-mono">
            {game.rolling_form_home?.toFixed(3) ?? "N/A"}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-2 rounded">
          <span className="text-gray-600">Brier Score Impact:</span>
          <span className="font-mono font-semibold ml-2">
            {result.baselineBrierScore.toFixed(4)} →{" "}
            {result.looBrierScore.toFixed(4)}
          </span>
        </div>
        <div className="bg-white p-2 rounded">
          <span className="text-gray-600">Accuracy Impact:</span>
          <span className="font-mono font-semibold ml-2">
            {(result.accuracyDelta * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      <details className="mt-2">
        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
          View all features
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded">
          <div>Rest Home: {game.rest_days_home ?? "N/A"}</div>
          <div>Rest Away: {game.rest_days_away ?? "N/A"}</div>
          <div>Form Home: {game.rolling_form_home?.toFixed(3) ?? "N/A"}</div>
          <div>Form Away: {game.rolling_form_away?.toFixed(3) ?? "N/A"}</div>
          <div>Travel: {game.travel_miles?.toFixed(0) ?? "N/A"} mi</div>
        </div>
      </details>
    </div>
  );
}
