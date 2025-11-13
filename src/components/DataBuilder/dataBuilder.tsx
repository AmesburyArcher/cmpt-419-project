import { useCallback, useState } from "react";
import {
  buildHistoricalCSV,
  exportToCSV,
} from "@/utils/buildHistoricalData.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select.tsx";
import { SelectValue } from "@radix-ui/react-select";
import { Label } from "@/components/ui/label.tsx";

export function DataBuilder() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [year, setYear] = useState(2024);
  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(18);

  const handleBuildCSV = async () => {
    setIsBuilding(true);
    setError("");
    setProgress("Starting...");

    try {
      const season = year;
      const start = startWeek > endWeek ? endWeek : startWeek;
      const end = endWeek < startWeek ? startWeek : endWeek;

      setProgress(
        `Fetching data for ${season} season (weeks ${start}-${end})...`,
      );

      const games = await buildHistoricalCSV(season, start, end);

      setProgress(
        `Successfully fetched ${games.length} games. Generating CSV...`,
      );

      exportToCSV(games, `nfl_data_${season}_weeks_${start}-${end}.csv`);

      setProgress(`✓ CSV downloaded successfully! (${games.length} games)`);

      setTimeout(() => {
        setProgress("");
        setIsBuilding(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build CSV");
      setIsBuilding(false);
    }
  };

  const handleSelectChange = useCallback(
    (year: string) => {
      setYear(Number(year));
    },
    [setYear],
  );

  const handleWeekChange = useCallback(
    (type: "start" | "end", week: number) => {
      if (type === "start") {
        setStartWeek(week);
      } else {
        setEndWeek(week);
      }
    },
    [setStartWeek, setEndWeek],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Historical Data?</CardTitle>
        <CardDescription>
          Automatically fetch real NFL game data from ESPN's API. This will
          download a CSV with scores, teams, and calculated features for the
          entire 2024 season.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 justify-center">
        <div className="flex flex-col gap-2">
          <Label>Select NFL Season</Label>
          <Select onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder={"2024"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"2023"}>2023</SelectItem>
              <SelectItem value={"2024"}>2024</SelectItem>
              <SelectItem value={"2025"}>2025</SelectItem>
            </SelectContent>
          </Select>
          <Label>Select Starting Week</Label>

          <Input
            type="number"
            min={1}
            max={18}
            placeholder={"1"}
            onInput={(week) =>
              handleWeekChange("start", +week.currentTarget.value)
            }
          />
          <Label>Select Ending Week</Label>

          <Input
            type="number"
            min={1}
            max={18}
            placeholder={"18"}
            onInput={(week) =>
              handleWeekChange("end", +week.currentTarget.value)
            }
          />
        </div>

        <Button
          onClick={handleBuildCSV}
          disabled={isBuilding}
          className="w-fit"
        >
          {isBuilding ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Building CSV...
            </span>
          ) : (
            "Build CSV from ESPN Data"
          )}
        </Button>

        {progress && (
          <div className="mt-3 text-sm">
            {progress.includes("✓") ? (
              <p className="text-green-600 font-medium">{progress}</p>
            ) : (
              <p className="text-blue-600">{progress}</p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 text-sm bg-red-50 text-red-600 p-3 rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>
            <strong>Note:</strong> The generated CSV will include:
          </p>
          <ul className="list-disc ml-4 mt-1 space-y-0.5">
            <li>Real game results and scores from ESPN</li>
            <li>Automatically calculated rolling form and rest days</li>
            <li>Divisional game flags and Thursday game indicators</li>
            <li>Spread and total will be 0, these need to be added in.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
