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
