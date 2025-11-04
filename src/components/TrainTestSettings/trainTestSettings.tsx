import { useState } from "react";
import { Slider } from "@/components/ui/slider.tsx";

export interface TrainTestSettings {
  splitMethod: "time-based" | "random";
  testSize: number;
  randomSeed?: number;
}

interface TrainTestSettingsProps {
  settings: TrainTestSettings;
  onSettingsChange: (settings: TrainTestSettings) => void;
  disabled?: boolean;
}

export function TrainTestSettingsPanel({
  settings,
  onSettingsChange,
  disabled = false,
}: TrainTestSettingsProps) {
  const [localSettings, setLocalSettings] =
    useState<TrainTestSettings>(settings);

  const handleChange = (updates: Partial<TrainTestSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>Train/Test Split Settings</span>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split Method
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="splitMethod"
                value="time-based"
                checked={localSettings.splitMethod === "time-based"}
                onChange={(e) =>
                  handleChange({
                    splitMethod: e.target.value as "time-based" | "random",
                  })
                }
                disabled={disabled}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Time-Based</div>
                <p className="text-xs text-gray-600 mt-1">
                  Train on older games, test on newer games. Most realistic for
                  betting since you're predicting future games.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Example: Train on 2020-2023, test on 2024
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="splitMethod"
                value="random"
                checked={localSettings.splitMethod === "random"}
                onChange={(e) =>
                  handleChange({
                    splitMethod: e.target.value as "time-based" | "random",
                  })
                }
                disabled={disabled}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">Random Split</div>
                <p className="text-xs text-gray-600 mt-1">
                  Randomly shuffle games before splitting. Useful for general
                  performance testing but less realistic for time-series data.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Can use a seed for reproducible splits.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Set Size
          </label>
          <div className="flex items-center gap-3">
            <Slider
              min={10}
              max={40}
              step={5}
              value={[localSettings.testSize * 100]}
              onValueChange={(e) => handleChange({ testSize: e?.[0] / 100 })}
              disabled={disabled}
              className="flex-1"
            />
            <span className="font-mono font-semibold text-gray-700 w-12">
              {(localSettings.testSize * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Percentage of data reserved for testing. Typical: 20%
          </p>
        </div>

        {localSettings.splitMethod === "random" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Random Seed (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={localSettings.randomSeed ?? ""}
                onChange={(e) =>
                  handleChange({
                    randomSeed: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Leave empty for random"
                disabled={disabled}
                className="border rounded px-3 py-2 text-sm flex-1"
              />
              <button
                onClick={() =>
                  handleChange({
                    randomSeed: Math.floor(Math.random() * 10000),
                  })
                }
                disabled={disabled}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium disabled:opacity-50"
              >
                Generate
              </button>
              <button
                onClick={() => handleChange({ randomSeed: undefined })}
                disabled={disabled}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use a seed to get the same split every time
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
