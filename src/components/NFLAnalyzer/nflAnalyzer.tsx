import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { FileUpload } from "@/components/FileUpload";
import { FeaturePanel } from "@/components/FeaturePanel";
import { ModelMetrics } from "@/components/ModelMetrics/modelMetrics.tsx";
import { CalibrationChart } from "@/components/CalibrationCharts";
import { UpcomingGames } from "@/components/UpcomingGames";
import { DataBuilder } from "@/components/DataBuilder";

export function NFLAnalyzer() {
  // Historical data state
  const [historicalGames, setHistoricalGames] = useState<NflGameInterface[]>(
    [],
  );

  // Model state
  const [model, setModel] = useState<LogisticRegressionModel | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "spread",
    "total",
    "rest_days_home",
    "rest_days_away",
    "rolling_form_home",
    "rolling_form_away",
  ]);
  const [isTraining, setIsTraining] = useState(false);

  // Metrics state
  const [metrics, setMetrics] = useState<{
    brierScore: number;
    accuracy: number;
    calibrationData: Array<{
      predictedProb: number;
      actualProb: number;
      count: number;
    }>;
  } | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            NFL Market vs Model Analyzer
          </h1>
          <p className="text-gray-600 mt-2">
            Train a model on historical data, then compare predictions to live
            odds
          </p>
          <section className="mb-8">
            <DataBuilder />
          </section>
        </header>

        {/* Step 1: Upload Historical Data */}
        <section className="mb-8">
          <FileUpload
            onDataLoaded={setHistoricalGames}
            onModelTrained={(trainedModel, trainingMetrics) => {
              setModel(trainedModel);
              setMetrics(trainingMetrics);
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
                }}
                isTraining={isTraining}
                setIsTraining={setIsTraining}
              />
            </section>

            {/* Step 3: Model Performance */}
            {metrics && (
              <section className="mb-8">
                <ModelMetrics metrics={metrics} />
                <CalibrationChart calibrationData={metrics.calibrationData} />
              </section>
            )}

            {/* Step 4: Live Predictions */}
            {model && (
              <section className="mb-8">
                <UpcomingGames
                  model={model}
                  selectedFeatures={selectedFeatures}
                  historicalGames={historicalGames}
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
