interface CalibrationChartProps {
  calibrationData: Array<{
    predictedProb: number;
    actualProb: number;
    count: number;
  }>;
}

export function CalibrationChart({ calibrationData }: CalibrationChartProps) {
  const maxCount = Math.max(...calibrationData.map((d) => d.count));

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-2xl font-semibold mb-4">Calibration Curve</h2>
      <p className="text-gray-600 mb-6">
        A well-calibrated model's predictions should align with actual outcomes.
        Points near the diagonal line indicate good calibration.
      </p>

      <div className="relative w-full h-96 border-2 border-gray-300 rounded bg-gray-50">
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1="0"
            y1="100%"
            x2="100%"
            y2="0"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {calibrationData.map((point, idx) => {
            const x = `${point.predictedProb * 100}%`;
            const y = `${100 - point.actualProb * 100}%`;
            const size = 4 + (point.count / maxCount) * 12;

            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="#3B82F6"
                  opacity="0.7"
                  stroke="#1E40AF"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y}
                  dy="-15"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                >
                  n={point.count}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
          <p className="text-sm font-semibold text-gray-700">
            Predicted Probability →
          </p>
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 -rotate-90">
          <p className="text-sm font-semibold text-gray-700">
            Actual Win Rate →
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t-2"></div>
          <span>Perfect Calibration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-800"></div>
          <span>Your Model (size = sample count)</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Predicted Prob</th>
              <th className="px-4 py-2 text-left">Actual Win Rate</th>
              <th className="px-4 py-2 text-left">Sample Size</th>
              <th className="px-4 py-2 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {calibrationData.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2 font-mono">
                  {(row.predictedProb * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2 font-mono">
                  {(row.actualProb * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2">{row.count}</td>
                <td className="px-4 py-2 font-mono">
                  {Math.abs(row.predictedProb - row.actualProb).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
