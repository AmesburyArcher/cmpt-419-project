import * as tf from "@tensorflow/tfjs";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";
import { prepareFeatures } from "@/utils/features.utils.ts";

export interface LOOResult {
  gameIndex: number;
  game: NflGameInterface;
  baselineBrierScore: number;
  looBrierScore: number;
  influence: number;
  baselineAccuracy: number;
  looAccuracy: number;
  accuracyDelta: number;
}

/**
 * Perform Leave-One-Out analysis on the training data
 * This is computationally expensive - consider using a sample for large datasets
 */
export async function performLOOAnalysis(
  games: NflGameInterface[],
  selectedFeatures: string[],
  sampleSize?: number,
): Promise<LOOResult[]> {
  const results: LOOResult[] = [];

  const sortedGames = [...games].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });

  const gamesToAnalyze =
    sampleSize && sortedGames.length > sampleSize
      ? sortedGames.slice(-sampleSize)
      : sortedGames.map((game, idx) => ({ game, originalIndex: idx }));

  const gamesWithIndex = Array.isArray(gamesToAnalyze[0])
    ? gamesToAnalyze
    : gamesToAnalyze.map((game, idx) => ({
        game,
        originalIndex: sortedGames.indexOf(game as NflGameInterface),
      }));

  console.log(`Starting LOO analysis on ${gamesWithIndex.length} games...`);

  const { X: baselineX, y: baselineY } = prepareFeatures(
    sortedGames,
    selectedFeatures,
  );
  const baselineModel = new LogisticRegressionModel();
  await baselineModel.train(baselineX, baselineY, selectedFeatures, 100);

  const baselinePredictions = baselineModel.predict(baselineX) as tf.Tensor;
  const baselinePredData = Array.from(await baselinePredictions.data());
  const yData = Array.from(await baselineY.data());

  const baselineBrierScore = calculateBrierScore(baselinePredData, yData);
  const baselineAccuracy = calculateAccuracy(baselinePredData, yData);

  baselinePredictions.dispose();

  for (let i = 0; i < gamesWithIndex.length; i++) {
    const { game, originalIndex } = gamesWithIndex[i];

    const gamesWithoutI = sortedGames.filter((_, idx) => idx !== originalIndex);

    const { X: looX, y: looY } = prepareFeatures(
      gamesWithoutI,
      selectedFeatures,
    );
    const looModel = new LogisticRegressionModel();
    await looModel.train(looX, looY, selectedFeatures, 100);

    const looPredictions = looModel.predict(baselineX) as tf.Tensor;
    const looPredData = Array.from(await looPredictions.data());

    const looBrierScore = calculateBrierScore(looPredData, yData);
    const looAccuracy = calculateAccuracy(looPredData, yData);

    const influence = looBrierScore - baselineBrierScore;
    const accuracyDelta = looAccuracy - baselineAccuracy;

    results.push({
      gameIndex: originalIndex as number,
      game: game as NflGameInterface,
      baselineBrierScore,
      looBrierScore,
      influence,
      baselineAccuracy,
      looAccuracy,
      accuracyDelta,
    });

    looX.dispose();
    looY.dispose();
    looPredictions.dispose();
    looModel.dispose();

    if ((i + 1) % 10 === 0 || i === gamesToAnalyze.length - 1) {
      console.log(`LOO progress: ${i + 1}/${gamesWithIndex.length}`);
    }
  }

  baselineX.dispose();
  baselineY.dispose();
  baselineModel.dispose();

  results.sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));

  return results;
}

/**
 * Get top influential and outlier games
 */
export function getInfluentialGames(
  looResults: LOOResult[],
  topN: number = 5,
): {
  mostInfluential: LOOResult[];
  mostOutlier: LOOResult[];
} {
  const sortedByInfluence = [...looResults].sort(
    (a, b) => b.influence - a.influence,
  );

  const mostInfluential = sortedByInfluence.slice(0, topN);

  const mostOutlier = sortedByInfluence.slice(-topN).reverse();

  return { mostInfluential, mostOutlier };
}

function calculateBrierScore(predictions: number[], actuals: number[]): number {
  return (
    predictions.reduce(
      (sum, pred, i) => sum + Math.pow(pred - actuals[i], 2),
      0,
    ) / predictions.length
  );
}

function calculateAccuracy(predictions: number[], actuals: number[]): number {
  return (
    predictions.filter((pred, i) => (pred > 0.5 ? 1 : 0) === actuals[i])
      .length / predictions.length
  );
}

function sampleGames(
  games: NflGameInterface[],
  size: number,
): Array<{ game: NflGameInterface; originalIndex: number }> {
  const indices = Array.from({ length: games.length }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices
    .slice(0, size)
    .map((idx) => ({ game: games[idx], originalIndex: idx }));
}
