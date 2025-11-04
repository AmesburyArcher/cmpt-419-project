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

/**
 * Perform time-based train/test split
 * Trains on older games, tests on newer games (realistic for betting)
 */
function timeBasedSplit(
  games: NflGameInterface[],
  testSize: number = 0.2,
): { trainGames: NflGameInterface[]; testGames: NflGameInterface[] } {
  const sortedGames = [...games].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });

  const splitIndex = Math.floor(sortedGames.length * (1 - testSize));
  const trainGames = sortedGames.slice(0, splitIndex);
  const testGames = sortedGames.slice(splitIndex);

  return { trainGames, testGames };
}

/**
 * Perform random train/test split
 * Randomly shuffles games before splitting (useful for cross-validation)
 */
function randomSplit(
  games: NflGameInterface[],
  testSize: number = 0.2,
  seed?: number,
): { trainGames: NflGameInterface[]; testGames: NflGameInterface[] } {
  const shuffledGames = [...games];

  if (seed !== undefined) {
    let randomState = seed;
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      randomState = (randomState * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor((randomState / 4294967296) * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [
        shuffledGames[j],
        shuffledGames[i],
      ];
    }
  } else {
    for (let i = shuffledGames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledGames[i], shuffledGames[j]] = [
        shuffledGames[j],
        shuffledGames[i],
      ];
    }
  }

  const splitIndex = Math.floor(shuffledGames.length * (1 - testSize));
  const trainGames = shuffledGames.slice(0, splitIndex);
  const testGames = shuffledGames.slice(splitIndex);

  console.log(`  Training: ${trainGames.length} games`);
  console.log(`  Testing: ${testGames.length} games`);

  return { trainGames, testGames };
}

export async function trainModelUtil(
  games: NflGameInterface[],
  selectedFeatures: string[],
  testSize: number = 0.2,
  splitMethod: "time-based" | "random" = "time-based",
  randomSeed?: number,
) {
  const { trainGames, testGames } =
    splitMethod === "time-based"
      ? timeBasedSplit(games, testSize)
      : randomSplit(games, testSize, randomSeed);

  console.log(`Training on ${trainGames.length} games`);
  console.log(`Testing on ${testGames.length} games`);

  const {
    X: X_train,
    y: y_train,
    featureNames,
  } = prepareFeatures(trainGames, selectedFeatures);
  const { X: X_test, y: y_test } = prepareFeatures(testGames, selectedFeatures);

  const model = new LogisticRegressionModel();
  const trainingMetrics = await model.train(
    X_train,
    y_train,
    featureNames,
    100,
  );

  const testPredictions = model.predict(X_test) as tf.Tensor;
  const testPredData = Array.from(await testPredictions.data());
  const testYData = Array.from(await y_test.data());

  const testBrierScore =
    testPredData.reduce(
      (sum, pred, i) => sum + Math.pow(pred - testYData[i], 2),
      0,
    ) / testPredData.length;

  const testAccuracy =
    testPredData.filter((pred, i) => (pred > 0.5 ? 1 : 0) === testYData[i])
      .length / testPredData.length;

  const calibrationData = calculateCalibration(testPredData, testYData, 10);

  console.log(
    `Training Accuracy: ${(trainingMetrics.trainAccuracy * 100).toFixed(2)}%`,
  );
  console.log(
    `Validation Accuracy: ${(trainingMetrics.valAccuracy * 100).toFixed(2)}%`,
  );
  console.log(`Test Accuracy: ${(testAccuracy * 100).toFixed(2)}%`);
  console.log(`Training Brier: ${trainingMetrics.trainLoss.toFixed(4)}`);
  console.log(`Test Brier: ${testBrierScore.toFixed(4)}`);

  testPredictions.dispose();
  X_train.dispose();
  y_train.dispose();
  X_test.dispose();
  y_test.dispose();

  return {
    brierScore: testBrierScore,
    accuracy: testAccuracy,
    calibrationData,

    trainBrierScore: trainingMetrics.trainLoss,
    trainAccuracy: trainingMetrics.trainAccuracy,
    valBrierScore: trainingMetrics.valLoss,
    valAccuracy: trainingMetrics.valAccuracy,

    model,

    X: tf.tensor2d([[]]),
    y: tf.tensor2d([[]]),
    predictions: tf.tensor2d([[]]),
  };
}
