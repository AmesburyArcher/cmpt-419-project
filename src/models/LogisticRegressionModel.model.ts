import * as tf from "@tensorflow/tfjs";

export class LogisticRegressionModel {
  private model: tf.Sequential | null = null;
  private featureNames: string[] = [];

  async train(
    X: tf.Tensor2D,
    y: tf.Tensor2D,
    featureNames: string[],
    epochs: number = 100,
  ): Promise<{
    trainLoss: number;
    trainAccuracy: number;
    valLoss: number;
    valAccuracy: number;
  }> {
    this.featureNames = featureNames;

    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [X.shape[1]],
          units: 1,
          activation: "sigmoid",
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    const history = await this.model.fit(X, y, {
      epochs,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`,
          );
        },
      },
    });

    const finalEpoch = history.history.loss.length - 1;
    return {
      trainLoss: history.history.loss[finalEpoch] as number,
      trainAccuracy: history.history.acc[finalEpoch] as number,
      valLoss: history.history.val_loss?.[finalEpoch] as number,
      valAccuracy: history.history.val_acc?.[finalEpoch] as number,
    };
  }

  predict(X: tf.Tensor2D): tf.Tensor {
    if (!this.model) throw new Error("Model not trained");
    return this.model.predict(X) as tf.Tensor;
  }

  /**
   * Predict probability for a single game
   * @param features Array of feature values in the same order as training
   * @returns Probability of home team winning (0-1)
   */
  predictSingle(features: number[]): number {
    if (!this.model) throw new Error("Model not trained");

    const X = tf.tensor2d([features]);

    const prediction = this.model.predict(X) as tf.Tensor;
    const probability = prediction.dataSync()[0];

    X.dispose();
    prediction.dispose();

    return probability;
  }

  async predictProbabilities(games: any[]): Promise<number[]> {
    if (!this.model) throw new Error("Model not trained");

    const features = games.map((game) =>
      this.featureNames.map(
        (feature) => (game[feature as keyof typeof game] as number) || 0,
      ),
    );

    const X = tf.tensor2d(features);
    const predictions = this.model.predict(X) as tf.Tensor;
    const probabilities = await predictions.data();

    X.dispose();
    predictions.dispose();

    return Array.from(probabilities);
  }

  /**
   * Get feature importance (coefficients from the model)
   * Useful for understanding which features are most influential
   */
  getFeatureImportance(): Array<{ feature: string; coefficient: number }> {
    if (!this.model) throw new Error("Model not trained");

    const weights = this.model.layers[0].getWeights()[0];
    const weightData = weights.dataSync();

    return this.featureNames
      .map((name, idx) => ({
        feature: name,
        coefficient: weightData[idx],
      }))
      .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }

  /**
   * Get the feature names used in this model
   */
  getFeatureNames(): string[] {
    return [...this.featureNames];
  }

  /**
   * Check if model is trained
   */
  isTrained(): boolean {
    return this.model !== null;
  }

  /**
   * Dispose of the model and free up memory
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
