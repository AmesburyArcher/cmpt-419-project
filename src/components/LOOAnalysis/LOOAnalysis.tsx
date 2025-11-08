import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import {
  getInfluentialGames,
  LOOResult,
  performLOOAnalysis,
} from "@/utils/LOO.utils.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";

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
      setProgress("Performing LOO analysis...");
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
    <Card className="bg-white rounded-lg shadow p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Leave-One-Out (LOO) Analysis
        </CardTitle>

        <CardDescription className="text-text-secondary">
          Identifies which data points are most influential (important) or most
          problematic (outliers) in your training data.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="bg-info-background border border-info-border rounded p-4">
          <p className="text-sm text-text-info">
            LOO analysis is computationally expensive. For{" "}
            {historicalGames.length} games, this will train{" "}
            {Math.min(sampleSize, historicalGames.length)} models.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-medium text-text-secondary">
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
            <p className="text-xs text-text-secondary">
              Random sample from {historicalGames.length} total games
            </p>
          </div>

          <div className="flex-1">
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing || historicalGames.length === 0}
              variant="outline"
            >
              {isAnalyzing ? "Analyzing..." : "Run LOO Analysis"}
            </Button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-text-accent">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-accent"></div>
            <span>{progress}</span>
          </div>
        )}

        {results && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold mb-3 text-success">
                Top 5 Most Influential Games
              </h3>
              <p className="text-sm text-text-secondary">
                These games are most important for model performance. Removing
                them makes the model significantly worse.
              </p>
              <div className="flex flex-col gap-2">
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

            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold text-text-error">
                Top 5 Most Problematic Games (Outliers)
              </h3>
              <p className="text-sm text-text-secondary">
                These games hurt model performance. Removing them improves the
                model, suggesting they may be outliers or mislabeled.
              </p>
              <div className="flex flex-col gap-2">
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
      </CardContent>
    </Card>
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
      className={`border-2 rounded-lg p-4 flex flex-col gap-2 ${
        isInfluential
          ? "border-success-border bg-success-background"
          : "border-error-border bg-error-background"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-lg ${
                isInfluential ? "text-success" : "text-text-error"
              }`}
            >
              #{rank}
            </span>
            <h4 className="font-semibold text-lg">
              {game.away_team} @ {game.home_team}
            </h4>
          </div>
          <p className="text-sm text-text-secondary">
            {game.season} Week {game.week}
            {!!game.divisional && " • Divisional"}
            {!!game.thursday_game && " • Thursday"}
            {!!game.international && " • International"}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-mono font-bold ${
              isInfluential ? "text-success" : "text-text-error"
            }`}
          >
            {(result.influence * 1000).toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary">Influence (×1000)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-white p-2 rounded">
          <div className="text-text-secondary text-xs">Result</div>
          <div className="font-semibold">
            {game.home_win ? "Home Win" : "Away Win"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-text-secondary text-xs">Spread</div>
          <div className="font-semibold font-mono">
            {(game.spread ?? 0 > 0) ? "+" : ""}
            {game.spread?.toFixed(1) ?? "N/A"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-text-secondary text-xs">Total</div>
          <div className="font-semibold font-mono">
            {game.total?.toFixed(1) ?? "N/A"}
          </div>
        </div>

        <div className="bg-white p-2 rounded">
          <div className="text-text-secondary text-xs">Home Form</div>
          <div className="font-semibold font-mono">
            {game.rolling_form_home?.toFixed(3) ?? "N/A"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-2 rounded flex gap-2">
          <span className="text-text-secondary">Brier Score Impact:</span>
          <span className="font-mono font-semibold">
            {result.baselineBrierScore.toFixed(4)} →{" "}
            {result.looBrierScore.toFixed(4)}
          </span>
        </div>
        <div className="bg-white p-2 rounded flex gap-2">
          <span className="text-text-secondary">Accuracy Impact:</span>
          <span className="font-mono font-semibold">
            {(result.accuracyDelta * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      <details className="flex flex-col gap-2">
        <summary className="text-xs text-text-secondary cursor-pointer hover:text-gray-800">
          View all features
        </summary>
        <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2 rounded">
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
