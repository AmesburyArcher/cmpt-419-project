import { useState, useEffect } from "react";
import { SavedModelMetadata } from "@/interfaces/savedModel.interface";
import { modelStorage } from "@/services/modelStorage.service";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model";
import { NflGameInterface } from "@/interfaces/nflGame.interface";
import { TrainTestSettings } from "@/components/TrainTestSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModelManagerProps {
  currentModel: LogisticRegressionModel | null;
  currentMetrics: {
    accuracy: number;
    brierScore: number;
    trainAccuracy?: number;
    valAccuracy?: number;
    calibrationData: Array<{
      predictedProb: number;
      actualProb: number;
      count: number;
    }>;
  } | null;
  selectedFeatures: string[];
  trainTestSettings: TrainTestSettings;
  historicalGames: NflGameInterface[];
  onLoadModel: (
    model: LogisticRegressionModel,
    metadata: SavedModelMetadata,
  ) => void;
  onHistoricalGamesLoad: (games: NflGameInterface[]) => void;
}

export function ModelManager({
  currentModel,
  currentMetrics,
  selectedFeatures,
  trainTestSettings,
  historicalGames,
  onLoadModel,
  onHistoricalGamesLoad,
}: ModelManagerProps) {
  const [savedModels, setSavedModels] = useState<SavedModelMetadata[]>([]);
  const [modelName, setModelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSavedModels();
  }, []);

  const loadSavedModels = async () => {
    try {
      const models = await modelStorage.getAllMetadata();
      setSavedModels(
        models.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Failed to load saved models:", error);
      setError("Failed to load saved models");
    }
  };

  const handleSaveModel = async () => {
    if (!currentModel || !currentMetrics || !modelName.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      const seasons = [...new Set(historicalGames.map((g) => g.season))];
      const weeks = historicalGames.map((g) => g.week);

      const metadata: SavedModelMetadata = {
        id: `model-${Date.now()}`,
        name: modelName.trim(),
        features: selectedFeatures,
        createdAt: new Date(),
        metrics: {
          testAccuracy: currentMetrics.accuracy,
          testBrierScore: currentMetrics.brierScore,
          trainAccuracy: currentMetrics.trainAccuracy,
          valAccuracy: currentMetrics.valAccuracy,
        },
        trainTestSettings,
        trainingDataInfo: {
          gameCount: historicalGames.length,
          seasons,
          weekRange: { min: Math.min(...weeks), max: Math.max(...weeks) },
        },
        historicalGames,
        calibrationData: currentMetrics.calibrationData,
      };

      await modelStorage.saveModel(currentModel, metadata);
      await loadSavedModels();
      setModelName("");
    } catch (error) {
      console.error("Failed to save model:", error);
      setError("Failed to save model. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModel = async (id: string) => {
    setIsLoading(true);
    setError("");

    try {
      const { model, metadata } = await modelStorage.loadModel(id);
      onHistoricalGamesLoad(metadata.historicalGames);
      onLoadModel(model, metadata);
    } catch (error) {
      console.error("Failed to load model:", error);
      setError("Failed to load model. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      await modelStorage.deleteModel(id);
      await loadSavedModels();
    } catch (error) {
      console.error("Failed to delete model:", error);
      setError("Failed to delete model. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Management</CardTitle>
        <CardDescription>
          Save your trained models for later use or load previously saved models
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && (
          <div className="bg-error-background text-text-error p-3 rounded border border-error-border">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label className="text-base font-semibold">Save Current Model</Label>
          <p className="text-sm text-text-secondary mb-2">
            Save your trained model with a descriptive name to reuse it later
            without retraining
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Model name (e.g., Week 1-10 2024, All features)"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={!currentModel || !currentMetrics || isSaving}
              className="flex-1"
            />
            <Button
              onClick={handleSaveModel}
              disabled={
                !currentModel ||
                !currentMetrics ||
                !modelName.trim() ||
                isSaving
              }
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                "Save Model"
              )}
            </Button>
          </div>
          {!currentModel && (
            <p className="text-xs text-text-secondary">
              Train a model first before you can save it
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-base font-semibold">
            Saved Models ({savedModels.length})
          </Label>
          {savedModels.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-text-secondary">
                No saved models yet. Train and save a model to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedModels.map((model) => (
                <div
                  key={model.id}
                  className="border rounded-lg p-4 flex justify-between items-start hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-base">{model.name}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Saved: {new Date(model.createdAt).toLocaleString()} •{" "}
                      {model.features.length} features •{" "}
                      {model.trainingDataInfo.gameCount} games
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="text-text-secondary">
                        <span className="font-bold">Accuracy:</span>{" "}
                        {(model.metrics.testAccuracy * 100).toFixed(1)}%
                      </span>
                      <span className="text-text-secondary">
                        <span className="font-bold">Brier:</span>{" "}
                        {model.metrics.testBrierScore.toFixed(4)}
                      </span>
                      <span className="text-text-secondary">
                        <span className="font-bold">Seasons:</span>{" "}
                        {model.trainingDataInfo.seasons.join(", ")}
                      </span>
                      <span className="text-text-secondary">
                        <span className="font-bold">Weeks:</span>{" "}
                        {model.trainingDataInfo.weekRange.min}-
                        {model.trainingDataInfo.weekRange.max}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-text-secondary">
                      <span className="font-bold">Features:</span>{" "}
                      {model.features.join(", ")}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleLoadModel(model.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Load"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteModel(model.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
