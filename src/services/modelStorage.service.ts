import * as tf from "@tensorflow/tfjs";
import { SavedModelMetadata } from "@/interfaces/savedModel.interface";
import { LogisticRegressionModel } from "@/models/LogisticRegressionModel.model";

const DB_NAME = "nfl-predictor-db";
const DB_VERSION = 1;
const METADATA_STORE = "model-metadata";

class ModelStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: "id" });
        }
      };
    });
  }

  async saveModel(
    model: LogisticRegressionModel,
    metadata: SavedModelMetadata,
  ): Promise<void> {
    if (!this.db) await this.init();

    const modelPath = `indexeddb://${metadata.id}`;
    await model["model"]!.save(modelPath);

    const metadataTransaction = this.db!.transaction(
      METADATA_STORE,
      "readwrite",
    );
    const metadataStore = metadataTransaction.objectStore(METADATA_STORE);
    await new Promise((resolve, reject) => {
      const request = metadataStore.put({ ...metadata, modelPath });
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async loadModel(id: string): Promise<{
    model: LogisticRegressionModel;
    metadata: SavedModelMetadata;
  }> {
    if (!this.db) await this.init();

    const metadataTransaction = this.db!.transaction(
      METADATA_STORE,
      "readonly",
    );
    const metadataStore = metadataTransaction.objectStore(METADATA_STORE);
    const metadata = await new Promise<
      SavedModelMetadata & { modelPath: string }
    >((resolve, reject) => {
      const request = metadataStore.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!metadata) {
      throw new Error(`Model with id ${id} not found`);
    }

    const tfModel = await tf.loadLayersModel(metadata.modelPath);

    const model = new LogisticRegressionModel();
    model["model"] = tfModel as tf.Sequential;
    model["featureNames"] = metadata.features;

    return { model, metadata };
  }

  async getAllMetadata(): Promise<SavedModelMetadata[]> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(METADATA_STORE, "readonly");
    const store = transaction.objectStore(METADATA_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteModel(id: string): Promise<void> {
    if (!this.db) await this.init();

    const metadataTransaction = this.db!.transaction(
      METADATA_STORE,
      "readonly",
    );
    const metadataStore = metadataTransaction.objectStore(METADATA_STORE);
    const metadata = await new Promise<
      SavedModelMetadata & { modelPath: string }
    >((resolve, reject) => {
      const request = metadataStore.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!metadata) {
      throw new Error(`Model with id ${id} not found`);
    }

    await tf.io.removeModel(metadata.modelPath);

    const deleteTransaction = this.db!.transaction(METADATA_STORE, "readwrite");
    await new Promise((resolve, reject) => {
      const request = deleteTransaction.objectStore(METADATA_STORE).delete(id);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }
}

export const modelStorage = new ModelStorageService();
