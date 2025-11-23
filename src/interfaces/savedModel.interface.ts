import { TrainTestSettings } from "@/components/TrainTestSettings";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";

export interface SavedModelMetadata {
  id: string;
  name: string;
  features: string[];
  createdAt: Date;
  metrics: {
    testAccuracy: number;
    testBrierScore: number;
    trainAccuracy?: number;
    valAccuracy?: number;
  };
  trainTestSettings: TrainTestSettings;
  trainingDataInfo: {
    gameCount: number;
    seasons: number[];
    weekRange: { min: number; max: number };
  };
  historicalGames: NflGameInterface[];
  calibrationData: Array<{
    predictedProb: number;
    actualProb: number;
    count: number;
  }>;
}
