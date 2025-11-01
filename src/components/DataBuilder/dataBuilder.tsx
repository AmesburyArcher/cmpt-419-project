import { useState } from "react";
import {
  buildHistoricalCSV,
  exportToCSV,
} from "@/utils/buildHistoricalData.ts";

export function DataBuilder() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleBuildCSV = async () => {
    setIsBuilding(true);
    setError("");
    setProgress("Starting...");

    try {
      // Build dataset for 2024 season, weeks 1-18
      const season = 2023;
      const startWeek = 1;
      const endWeek = 18;

      setProgress(
        `Fetching data for ${season} season (weeks ${startWeek}-${endWeek})...`,
      );

      const games = await buildHistoricalCSV(season, startWeek, endWeek);

      setProgress(
        `Successfully fetched ${games.length} games. Generating CSV...`,
      );

      // Export to CSV
      exportToCSV(
        games,
        `nfl_data_${season}_weeks_${startWeek}-${endWeek}.csv`,
      );

      setProgress(`✓ CSV downloaded successfully! (${games.length} games)`);

      // Clear progress after 5 seconds
      setTimeout(() => {
        setProgress("");
        setIsBuilding(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build CSV");
      setIsBuilding(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📥</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need Historical Data?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Automatically fetch real NFL game data from ESPN's API. This will
            download a CSV with scores, teams, and calculated features for the
            entire 2024 season.
          </p>

          <button
            onClick={handleBuildCSV}
            disabled={isBuilding}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm
              transition-all duration-200
              ${
                isBuilding
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }
            `}
          >
            {isBuilding ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Building CSV...
              </span>
            ) : (
              "Build CSV from ESPN Data"
            )}
          </button>

          {progress && (
            <div className="mt-3 text-sm">
              {progress.includes("✓") ? (
                <p className="text-green-600 font-medium">{progress}</p>
              ) : (
                <p className="text-blue-600">{progress}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm bg-red-50 text-red-600 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>
              <strong>Note:</strong> The generated CSV will include:
            </p>
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              <li>Real game results and scores from ESPN</li>
              <li>Automatically calculated rolling form and rest days</li>
              <li>Divisional game flags and Thursday game indicators</li>
              <li>
                ⚠️ Spread and total will be 0 (you'll need to add these manually
                or use historical odds data)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
