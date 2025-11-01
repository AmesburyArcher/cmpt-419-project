import {NflGameInterface} from "@/interfaces/nflGame.interface.ts";
import * as tf from '@tensorflow/tfjs';


export function prepareFeatures(
    games: NflGameInterface[],
    selectedFeatures: string[]
): { X: tf.Tensor2D; y: tf.Tensor2D; featureNames: string[] } {
    const features: number[][] = [];
    const labels: number[] = [];

    games.forEach(game => {
        const featureVector: number[] = [];

        selectedFeatures.forEach(feature => {
            const value = game[feature as keyof NflGameInterface];
            featureVector.push(typeof value === 'number' ? value : 0);
        });

        features.push(featureVector);
        labels.push(game.home_win);
    });

    return {
        X: tf.tensor2d(features),
        y: tf.tensor2d(labels, [labels.length, 1]),
        featureNames: selectedFeatures
    };
}
