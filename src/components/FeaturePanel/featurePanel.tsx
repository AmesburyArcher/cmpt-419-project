import { useState } from "react";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { trainModelUtil } from "@/utils/model.utils.ts";
import { TrainTestSettings } from "@/components/TrainTestSettings";

const AVAILABLE_FEATURES = [
  { key: "spread", label: "Point Spread", category: "Market" },
  { key: "total", label: "Over/Under Total", category: "Market" },
  { key: "rest_days_home", label: "Home Rest Days", category: "Rest" },
  { key: "rest_days_away", label: "Away Rest Days", category: "Rest" },
  { key: "rolling_form_home", label: "Home Form (Rolling)", category: "Form" },
  { key: "rolling_form_away", label: "Away Form (Rolling)", category: "Form" },
  { key: "divisional", label: "Divisional Game", category: "Context" },
  { key: "thursday_game", label: "Thursday Game", category: "Context" },
  { key: "international", label: "International Game", category: "Context" },
  { key: "travel_miles", label: "Travel Distance", category: "Context" },
];

interface FeaturePanelProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  historicalGames: NflGameInterface[];
  onRetrain: (model: LogisticRegressionModel, metrics: any) => void;
  isTraining: boolean;
  setIsTraining: (training: boolean) => void;
  trainTestSettings: TrainTestSettings;
}

export function FeaturePanel({
  selectedFeatures,
  onFeaturesChange,
  historicalGames,
  onRetrain,
  isTraining,
  setIsTraining,
  trainTestSettings,
}: FeaturePanelProps) {
  const [autoRetrain, setAutoRetrain] = useState(true);

  const toggleFeature = async (featureKey: string) => {
    const newFeatures = selectedFeatures.includes(featureKey)
      ? selectedFeatures.filter((f) => f !== featureKey)
      : [...selectedFeatures, featureKey];

    if (newFeatures.length === 0) return;

    // Update features first
    onFeaturesChange(newFeatures);

    // Then retrain if auto-retrain is enabled
    if (autoRetrain && historicalGames.length > 0) {
      await retrainModel(newFeatures);
    }
  };

  const retrainModel = async (features: string[]) => {
    if (historicalGames.length === 0) {
      console.warn("No historical games available for training");
      return;
    }

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
        historicalGames,
        features,
        trainTestSettings.testSize,
        trainTestSettings.splitMethod,
        trainTestSettings.randomSeed,
      );

      onRetrain(model, {
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
    } finally {
      setIsTraining(false);
    }
  };

  const categories = [...new Set(AVAILABLE_FEATURES.map((f) => f.category))];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Step 2: Feature Selection</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoRetrain}
            onChange={(e) => setAutoRetrain(e.target.checked)}
            className="rounded"
          />
          <span>Auto-retrain on change</span>
        </label>
      </div>

      <p className="text-gray-600 mb-4">
        Select which features to include in the model. Changes will retrain the
        model automatically.
      </p>

      {isTraining && (
        <div className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Retraining model with new features...</span>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_FEATURES.filter((f) => f.category === category).map(
                (feature) => (
                  <label
                    key={feature.key}
                    className={`
                      flex items-center gap-2 p-3 rounded border-2 cursor-pointer
                      transition-colors
                      ${
                        selectedFeatures.includes(feature.key)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }
                      ${isTraining ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.key)}
                      onChange={() => toggleFeature(feature.key)}
                      disabled={isTraining}
                      className="rounded"
                    />
                    <span className="text-sm">{feature.label}</span>
                  </label>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <span className="font-semibold">Selected:</span>
        <span>{selectedFeatures.length} features</span>
      </div>
    </div>
  );
}
