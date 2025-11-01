import { useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { prepareFeatures } from "@/utils/features.utils.ts";
import { calculateCalibration } from "@/utils/model.utils.ts";

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
}

export function FeaturePanel({
  selectedFeatures,
  onFeaturesChange,
  historicalGames,
  onRetrain,
  isTraining,
  setIsTraining,
}: FeaturePanelProps) {
  const [autoRetrain, setAutoRetrain] = useState(true);

  const toggleFeature = async (featureKey: string) => {
    const newFeatures = selectedFeatures.includes(featureKey)
      ? selectedFeatures.filter((f) => f !== featureKey)
      : [...selectedFeatures, featureKey];

    // Need at least one feature
    if (newFeatures.length === 0) return;

    onFeaturesChange(newFeatures);

    // Auto-retrain if enabled
    if (autoRetrain) {
      await retrainModel(newFeatures);
    }
  };

  const retrainModel = async (features: string[]) => {
    setIsTraining(true);

    try {
      const { X, y, featureNames } = prepareFeatures(historicalGames, features);

      const model = new LogisticRegressionModel();
      await model.train(X, y, featureNames, 100);

      const predictions = model.predict(X) as tf.Tensor;
      const predData = Array.from(await predictions.data());
      const yData = Array.from(await y.data());

      const brierScore =
        predData.reduce(
          (sum, pred, i) => sum + Math.pow(pred - yData[i], 2),
          0,
        ) / predData.length;

      const accuracy =
        predData.filter((pred, i) => (pred > 0.5 ? 1 : 0) === yData[i]).length /
        predData.length;

      const calibrationData = calculateCalibration(predData, yData, 10);

      onRetrain(model, { brierScore, accuracy, calibrationData });

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
