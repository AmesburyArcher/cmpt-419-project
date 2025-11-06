import { useState } from "react";
import { Slider } from "@/components/ui/slider.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";

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
    <Card className="bg-accent rounded-lg p-4 border border-border">
      <CardHeader>
        <CardTitle className="font-bold text-lg text-text-secondary">
          Train/Test Split Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="block font-medium text-text-secondary">
            Split Method
          </label>
          <div className="flex flex-col gap-2">
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
              <div className="flex-1 flex flex-col gap-1">
                <div className="font-semibold text-text-secondary">
                  Time-Based
                </div>
                <p className="text-xs text-text-secondary">
                  Train on older games, test on newer games.
                </p>
                <p className="text-xs text-text-accent">
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
              <div className="flex-1 flex flex-col gap-1">
                <div className="font-semibold text-gray-800">Random Split</div>
                <p className="text-xs text-text-secondary">
                  Randomly shuffle games before splitting.
                </p>
                <p className="text-xs text-text-secondary">
                  Can use a seed for reproducible splits.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-text-secondary">
            Test Set Size
          </label>
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-2 w-full">
              <Slider
                min={10}
                max={40}
                step={5}
                value={[localSettings.testSize * 100]}
                onValueChange={(e) => handleChange({ testSize: e?.[0] / 100 })}
                disabled={disabled}
                className="flex-1"
              />
              <p className="text-xs text-text-secondary">
                Percentage of data reserved for testing.
              </p>
            </div>
            <span className="font-mono font-semibold text-gray-700 w-12">
              {(localSettings.testSize * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {localSettings.splitMethod === "random" && (
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-text-secondary">
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
                className="border rounded px-3 py-2 text-sm flex-1 bg-white"
              />
              <Button
                onClick={() =>
                  handleChange({
                    randomSeed: Math.floor(Math.random() * 10000),
                  })
                }
                disabled={disabled}
                variant="outline"
              >
                Generate
              </Button>
              <Button
                onClick={() => handleChange({ randomSeed: undefined })}
                disabled={disabled}
                variant="outline"
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              Use a seed to get the same split every time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
