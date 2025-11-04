import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { FileUpload } from "@/components/FileUpload";
import { FeaturePanel } from "@/components/FeaturePanel";
import { ModelMetrics } from "@/components/ModelMetrics/modelMetrics.tsx";
import { CalibrationChart } from "@/components/CalibrationCharts";
import { UpcomingGames } from "@/components/UpcomingGames";
import { DataBuilder } from "@/components/DataBuilder";
import { LOOAnalysis } from "@/components/LOOAnalysis";
import { TrainTestSettings } from "@/components/TrainTestSettings";

export function NFLAnalyzer() {
  // Historical data state
  const [historicalGames, setHistoricalGames] = useState<NflGameInterface[]>(
    [],
  );

  // Model state
  const [model, setModel] = useState<LogisticRegressionModel | null>(null);
  const [modelVersion, setModelVersion] = useState<number>(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "spread",
    "total",
    "rest_days_home",
    "rest_days_away",
    "rolling_form_home",
    "rolling_form_away",
  ]);
  const [isTraining, setIsTraining] = useState(false);

  // Train/Test settings state
  const [trainTestSettings, setTrainTestSettings] = useState<TrainTestSettings>(
    {
      splitMethod: "time-based",
      testSize: 0.2,
      randomSeed: undefined,
    },
  );

  // Metrics state
  const [metrics, setMetrics] = useState<{
    brierScore: number;
    accuracy: number;
    trainBrierScore?: number;
    trainAccuracy?: number;
    valBrierScore?: number;
    valAccuracy?: number;
    calibrationData: Array<{
      predictedProb: number;
      actualProb: number;
      count: number;
    }>;
  } | null>(null);

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6">
        <section className="mb-8">
          <DataBuilder />
        </section>

        {/* Step 1: Upload Historical Data */}
        <section className="mb-8">
          <FileUpload
            onDataLoaded={setHistoricalGames}
            onModelTrained={(trainedModel, trainingMetrics) => {
              setModel(trainedModel);
              setMetrics(trainingMetrics);
              setModelVersion((v) => v + 1);
            }}
            selectedFeatures={selectedFeatures}
            isTraining={isTraining}
            setIsTraining={setIsTraining}
          />
        </section>

        {historicalGames.length > 0 && (
          <>
            {/* Step 2: Feature Selection */}
            <section className="mb-8">
              <FeaturePanel
                selectedFeatures={selectedFeatures}
                onFeaturesChange={setSelectedFeatures}
                historicalGames={historicalGames}
                onRetrain={(trainedModel, trainingMetrics) => {
                  setModel(trainedModel);
                  setMetrics(trainingMetrics);
                  setModelVersion((v) => v + 1);
                }}
                isTraining={isTraining}
                setIsTraining={setIsTraining}
                trainTestSettings={trainTestSettings}
              />
            </section>

            {/* Step 3: Model Performance */}
            {metrics && (
              <section className="mb-8">
                <ModelMetrics metrics={metrics} />
                <CalibrationChart calibrationData={metrics.calibrationData} />
              </section>
            )}

            {/* Step 3.5: Data Quality Analysis */}
            <section className="mb-8">
              <LOOAnalysis
                historicalGames={historicalGames}
                selectedFeatures={selectedFeatures}
              />
            </section>

            {/* Step 4: Live Predictions */}
            {model && (
              <section className="mb-8">
                <UpcomingGames
                  model={model}
                  selectedFeatures={selectedFeatures}
                  historicalGames={historicalGames}
                  modelVersion={modelVersion}
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
