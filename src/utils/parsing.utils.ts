import {NflGameInterface} from "@/interfaces/nflGame.interface.ts";
import Papa from 'papaparse';


export function parseCSV(file: File): Promise<NflGameInterface[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data as NflGameInterface[]),
            error: (error) => reject(error)
        });
    });
}