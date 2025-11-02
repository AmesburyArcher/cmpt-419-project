import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import * as tf from "@tensorflow/tfjs";
import { prepareFeatures } from "@/utils/features.utils.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";

export function calculateCalibration(
  predictions: number[],
  actuals: number[],
  bins: number = 10,
): Array<{ predictedProb: number; actualProb: number; count: number }> {
  const binSize = 1 / bins;
  const calibrationData: Array<{
    predictedProb: number;
    actualProb: number;
    count: number;
  }> = [];

  for (let i = 0; i < bins; i++) {
    const binMin = i * binSize;
    const binMax = (i + 1) * binSize;

    const binIndices: number[] = [];
    predictions.forEach((pred, idx) => {
      if (
        pred >= binMin &&
        (pred < binMax || (i === bins - 1 && pred === binMax))
      ) {
        binIndices.push(idx);
      }
    });

    if (binIndices.length > 0) {
      const binActuals = binIndices.map((idx) => actuals[idx]);
      const actualProb =
        binActuals.reduce((sum, val) => sum + val, 0) / binActuals.length;

      calibrationData.push({
        predictedProb: (binMin + binMax) / 2,
        actualProb,
        count: binIndices.length,
      });
    }
  }

  return calibrationData;
}

export async function trainModelUtil(
  games: NflGameInterface[],
  selectedFeatures: string[],
) {
  const { X, y, featureNames } = prepareFeatures(games, selectedFeatures);

  const model = new LogisticRegressionModel();
  await model.train(X, y, featureNames, 100);

  // Calculate metrics
  const predictions = model.predict(X) as tf.Tensor;
  const predData = Array.from(await predictions.data());
  const yData = Array.from(await y.data());

  // Brier score
  const brierScore =
    predData.reduce((sum, pred, i) => sum + Math.pow(pred - yData[i], 2), 0) /
    predData.length;

  // Accuracy
  const accuracy =
    predData.filter((pred, i) => (pred > 0.5 ? 1 : 0) === yData[i]).length /
    predData.length;

  // Calibration
  const calibrationData = calculateCalibration(predData, yData, 10);

  return {
    brierScore,
    accuracy,
    calibrationData,
    model,
    X,
    y,
    predictions,
  };
}
