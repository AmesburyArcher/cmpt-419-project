import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

interface ModelMetricsProps {
  metrics: {
    brierScore: number;
    accuracy: number;
    calibrationData: Array<{
      predictedProb: number;
      actualProb: number;
      count: number;
    }>;
  };
}

export function ModelMetrics({ metrics }: ModelMetricsProps) {
  return (
    <Card className="bg-white rounded-lg shadow p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Model Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-sm text-text-secondary mb-1">Brier Score</p>
            <p className="text-3xl font-bold text-blue-900">
              {metrics.brierScore.toFixed(4)}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Lower is better (0 = perfect)
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-text-secondary mb-1">Accuracy</p>
            <p className="text-3xl font-bold text-green-900">
              {(metrics.accuracy * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Correct predictions
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-text-secondary mb-1">Calibration</p>
            <p className="text-3xl font-bold text-purple-900">
              {calculateCalibrationScore(metrics.calibrationData)}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              How well probabilities match outcomes
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">What do these metrics mean?</h3>
          <ul className="text-sm text-text-secondary flex flex-col gap-1">
            <li>
              <strong>Brier Score:</strong> Measures prediction accuracy.
              {metrics.brierScore < 0.2 && " Your model is performing well!"}
              {metrics.brierScore >= 0.2 &&
                metrics.brierScore < 0.25 &&
                " Decent performance."}
              {metrics.brierScore >= 0.25 &&
                " Consider adjusting features or getting more data."}
            </li>
            <li>
              <strong>Accuracy:</strong> Percentage of games predicted
              correctly.
              {metrics.accuracy > 0.55 &&
                " Beating random chance significantly!"}
              {metrics.accuracy <= 0.55 &&
                metrics.accuracy >= 0.5 &&
                " Slightly better than a coin flip."}
              {metrics.accuracy < 0.5 && " Model needs improvement."}
            </li>
            <li>
              <strong>Calibration:</strong> When you predict 70%, does it win
              70% of the time? Good calibration is essential for betting
              decisions.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateCalibrationScore(
  calibrationData: Array<{
    predictedProb: number;
    actualProb: number;
    count: number;
  }>,
): string {
  if (calibrationData.length === 0) return "N/A";

  const totalCount = calibrationData.reduce((sum, d) => sum + d.count, 0);
  const weightedError =
    calibrationData.reduce((sum, d) => {
      const error = Math.abs(d.predictedProb - d.actualProb);
      return sum + error * d.count;
    }, 0) / totalCount;

  if (weightedError < 0.05) return "Excellent";
  if (weightedError < 0.1) return "Good";
  if (weightedError < 0.15) return "Fair";
  return "Poor";
}
