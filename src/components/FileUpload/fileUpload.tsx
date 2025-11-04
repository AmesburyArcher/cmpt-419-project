import { useState } from "react";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { parseCSV } from "@/utils/parsing.utils.ts";
import { trainModelUtil } from "@/utils/model.utils.ts";
import {
  TrainTestSettingsPanel,
  TrainTestSettings,
} from "@/components/TrainTestSettings";

interface FileUploadProps {
  onDataLoaded: (games: NflGameInterface[]) => void;
  onModelTrained: (model: LogisticRegressionModel, metrics: any) => void;
  selectedFeatures: string[];
  isTraining: boolean;
  setIsTraining: (training: boolean) => void;
}

export function FileUpload({
  onDataLoaded,
  onModelTrained,
  selectedFeatures,
  isTraining,
  setIsTraining,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [trainTestSettings, setTrainTestSettings] = useState<TrainTestSettings>(
    {
      splitMethod: "time-based",
      testSize: 0.2,
      randomSeed: undefined,
    },
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setFileName(file.name);

      // Parse CSV
      const games = await parseCSV(file);
      console.log(`Loaded ${games.length} games`);

      onDataLoaded(games);

      // Auto-train model
      await trainModel(games);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    }
  };

  const trainModel = async (games: NflGameInterface[]) => {
    setIsTraining(true);

    try {
      const {
        brierScore,
        accuracy,
        calibrationData,
        model,
        X,
        y,
        predictions,
        trainBrierScore,
        trainAccuracy,
        valBrierScore,
        valAccuracy,
      } = await trainModelUtil(
        games,
        selectedFeatures,
        trainTestSettings.testSize,
        trainTestSettings.splitMethod,
        trainTestSettings.randomSeed,
      );

      onModelTrained(model, {
        brierScore,
        accuracy,
        trainBrierScore,
        trainAccuracy,
        valBrierScore,
        valAccuracy,
        calibrationData,
      });

      X.dispose();
      y.dispose();
      predictions.dispose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Step 1: Upload Historical Data
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-2">
            <span className="text-gray-700">
              Upload CSV file with historical NFL games
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              disabled={isTraining}
            />
          </label>

          {fileName && (
            <p className="text-sm text-green-600 mt-2">✓ Loaded: {fileName}</p>
          )}
        </div>

        {/* Train/Test Settings */}
        <TrainTestSettingsPanel
          settings={trainTestSettings}
          onSettingsChange={setTrainTestSettings}
          disabled={isTraining}
        />

        {isTraining && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Training model...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        <div className="bg-blue-50 p-4 rounded text-sm">
          <p className="font-semibold mb-2">Expected CSV format:</p>
          <code className="text-xs bg-white p-2 block rounded">
            season,week,home_team,away_team,home_win,spread,total,
            rest_days_home,rest_days_away,rolling_form_home,rolling_form_away,
            divisional,thursday_game,international,travel_miles
          </code>
        </div>
      </div>
    </div>
  );
}
