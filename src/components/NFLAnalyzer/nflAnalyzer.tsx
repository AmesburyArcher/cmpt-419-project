import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { SavedModelMetadata } from "@/interfaces/savedModel.interface";
import { FileUpload } from "@/components/FileUpload";
import { FeaturePanel } from "@/components/FeaturePanel";
import { ModelMetrics } from "@/components/ModelMetrics/modelMetrics.tsx";
import { CalibrationChart } from "@/components/CalibrationCharts";
import { UpcomingGames } from "@/components/UpcomingGames";
import { DataBuilder } from "@/components/DataBuilder";
import { LOOAnalysis } from "@/components/LOOAnalysis";
import { ModelManager } from "@/components/ModelManager";
import { TrainTestSettings } from "@/components/TrainTestSettings";
import { FeatureImportance } from "@/components/FeatureImportance";

export function NFLAnalyzer() {
  const [historicalGames, setHistoricalGames] = useState<NflGameInterface[]>(
    [],
  );
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
  const [loadedModelMetadata, setLoadedModelMetadata] =
    useState<SavedModelMetadata | null>(null);

  const [trainTestSettings, setTrainTestSettings] = useState<TrainTestSettings>(
    {
      splitMethod: "time-based",
      testSize: 0.2,
      randomSeed: undefined,
    },
  );

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

  const handleLoadSavedModel = (
    loadedModel: LogisticRegressionModel,
    metadata: SavedModelMetadata,
  ) => {
    setModel(loadedModel);
    setSelectedFeatures(metadata.features);
    setTrainTestSettings(metadata.trainTestSettings);
    setLoadedModelMetadata(metadata);
    setModelVersion((v) => v + 1);

    setMetrics({
      accuracy: metadata.metrics.testAccuracy,
      brierScore: metadata.metrics.testBrierScore,
      trainAccuracy: metadata.metrics.trainAccuracy,
      valAccuracy: metadata.metrics.valAccuracy,
      calibrationData: metadata.calibrationData,
    });
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8">
        <section>
          <DataBuilder />
        </section>

        <section>
          <ModelManager
            currentModel={model}
            currentMetrics={metrics}
            selectedFeatures={selectedFeatures}
            trainTestSettings={trainTestSettings}
            historicalGames={historicalGames}
            onLoadModel={handleLoadSavedModel}
            onHistoricalGamesLoad={setHistoricalGames}
          />
        </section>

        <section>
          <FileUpload
            onDataLoaded={setHistoricalGames}
            onModelTrained={(trainedModel, trainingMetrics) => {
              setModel(trainedModel);
              setMetrics(trainingMetrics);
              setModelVersion((v) => v + 1);
              setLoadedModelMetadata(null);
            }}
            selectedFeatures={selectedFeatures}
            isTraining={isTraining}
            setIsTraining={setIsTraining}
          />
        </section>

        {historicalGames.length > 0 && (
          <>
            <section>
              <FeaturePanel
                selectedFeatures={selectedFeatures}
                onFeaturesChange={setSelectedFeatures}
                historicalGames={historicalGames}
                onRetrain={(trainedModel, trainingMetrics) => {
                  setModel(trainedModel);
                  setMetrics(trainingMetrics);
                  setModelVersion((v) => v + 1);
                  setLoadedModelMetadata(null);
                }}
                isTraining={isTraining}
                setIsTraining={setIsTraining}
                trainTestSettings={trainTestSettings}
              />
            </section>

            {metrics && (
              <section className="flex flex-col gap-6">
                <ModelMetrics metrics={metrics} />
                {metrics.calibrationData.length > 0 && (
                  <CalibrationChart calibrationData={metrics.calibrationData} />
                )}
                <FeatureImportance model={model} />
                <LOOAnalysis
                  historicalGames={historicalGames}
                  selectedFeatures={selectedFeatures}
                />
              </section>
            )}

            {model && (
              <section>
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
