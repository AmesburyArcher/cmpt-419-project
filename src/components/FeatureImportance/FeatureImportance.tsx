import { useState, useEffect } from "react";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";

interface FeatureImportanceProps {
  model: LogisticRegressionModel | null;
}

interface FeatureImportance {
  feature: string;
  coefficient: number;
}

export function FeatureImportance({ model }: FeatureImportanceProps) {
  const [importance, setImportance] = useState<FeatureImportance[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (model && model.isTrained()) {
      const featureImportance = model.getFeatureImportance();
      setImportance(featureImportance);
    }
  }, [model]);

  const displayedFeatures = showAll ? importance : importance.slice(0, 10);
  const maxAbsCoefficient = Math.max(
    ...importance.map((f) => Math.abs(f.coefficient)),
  );

  if (!model || !model.isTrained()) {
    return (
      <Card className="bg-white rounded-lg shadow p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Feature Importance
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Train a model to see which features are most influential.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Feature Importance
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Shows the coefficient (weight) of each feature in the logistic
          regression model. Larger absolute values indicate stronger influence
          on predictions.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="bg-info-background border border-info-border rounded p-4">
          <p className="text-sm text-text-info">
            <strong>Positive coefficients</strong> increase the probability of a
            home team win. <strong>Negative coefficients</strong> decrease it.
            The magnitude shows how strong the effect is.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-semibold">
              Top Features (by absolute coefficient)
            </h3>
            <div className="flex flex-col gap-2">
              {displayedFeatures.map((feature, idx) => (
                <FeatureCard
                  key={feature.feature}
                  feature={feature}
                  rank={idx + 1}
                  maxAbsCoefficient={maxAbsCoefficient}
                />
              ))}
            </div>
          </div>

          {importance.length > 10 && (
            <div>
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="outline"
                className="w-full"
              >
                {showAll
                  ? "Show Top 10 Only"
                  : `Show All ${importance.length} Features`}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Understanding Coefficients</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-success-background border border-success-border rounded p-3">
              <div className="font-semibold text-success mb-1">
                Positive Coefficients
              </div>
              <div className="text-text-secondary">
                Features that favor the home team winning. Higher values
                increase win probability.
              </div>
            </div>
            <div className="bg-error-background border border-error-border rounded p-3">
              <div className="font-semibold text-text-error mb-1">
                Negative Coefficients
              </div>
              <div className="text-text-secondary">
                Features that favor the away team winning. Higher values
                decrease home win probability.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureCardProps {
  feature: FeatureImportance;
  rank: number;
  maxAbsCoefficient: number;
}

function FeatureCard({ feature, rank, maxAbsCoefficient }: FeatureCardProps) {
  const isPositive = feature.coefficient > 0;
  const absCoefficient = Math.abs(feature.coefficient);
  const barWidth = (absCoefficient / maxAbsCoefficient) * 100;

  const formatFeatureName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 ${
        isPositive
          ? "border-success-border bg-success-background"
          : "border-error-border bg-error-background"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span
            className={`font-bold text-lg ${
              isPositive ? "text-success" : "text-text-error"
            }`}
          >
            #{rank}
          </span>
          <h4 className="font-semibold text-lg">
            {formatFeatureName(feature.feature)}
          </h4>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-mono font-bold ${
              isPositive ? "text-success" : "text-text-error"
            }`}
          >
            {isPositive ? "+" : ""}
            {feature.coefficient.toFixed(4)}
          </div>
          <div className="text-xs text-text-secondary">Coefficient</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${
              isPositive ? "bg-success" : "bg-text-error"
            } transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="text-xs text-text-secondary font-mono w-12 text-right">
          {absCoefficient.toFixed(3)}
        </div>
      </div>

      <div className="mt-2 text-xs text-text-secondary">
        {isPositive ? (
          <span>
            Each 1-unit increase in this feature increases the log-odds of home
            win by {feature.coefficient.toFixed(3)}
          </span>
        ) : (
          <span>
            Each 1-unit increase in this feature decreases the log-odds of home
            win by {Math.abs(feature.coefficient).toFixed(3)}
          </span>
        )}
      </div>
    </div>
  );
}
