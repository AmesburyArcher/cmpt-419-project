import { useState } from "react";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { parseCSV } from "@/utils/parsing.utils.ts";
import { trainModelUtil } from "@/utils/model.utils.ts";
import {
  TrainTestSettingsPanel,
  TrainTestSettings,
} from "@/components/TrainTestSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

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

      const games = await parseCSV(file);

      onDataLoaded(games);

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
    <Card className="bg-white rounded-lg shadow p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Step 1: Upload Historical Data
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <span className="text-text-secondary">
            Upload CSV file with historical NFL games
          </span>
          <div>
            <label className="block">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground hover:file:bg-primary/90
                cursor-pointer"
                disabled={isTraining}
              />
            </label>

            {fileName && (
              <p className="text-sm text-success">✓ Loaded: {fileName}</p>
            )}
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <TrainTestSettingsPanel
          settings={trainTestSettings}
          onSettingsChange={setTrainTestSettings}
          disabled={isTraining}
        />

        {isTraining && (
          <div className="flex items-center gap-2 text-text-accent">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
            <span>Training model...</span>
          </div>
        )}

        {error && (
          <div className="bg-error-background text-text-error p-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-accent-secondary p-4 rounded text-sm flex flex-col gap-2">
          <p className="font-semibold">Expected CSV format:</p>
          <code className="text-xs bg-white p-2 block rounded">
            season,week,home_team,away_team,home_win,spread,total,
            rest_days_home,rest_days_away,rolling_form_home,rolling_form_away,
            divisional,thursday_game,international,travel_miles
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
