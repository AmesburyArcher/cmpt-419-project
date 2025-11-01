import {GetOddsParams, GetScoresParams, OddsApiEvent, OddsApiSport} from "@/interfaces/oddsApi.interface.ts";
import {oddsApiClient} from "@/services/apiClient.service.ts";

export const oddsApi = {
    // Get list of available sports
    getSports: async (): Promise<OddsApiSport[]> => {
        return oddsApiClient.get<OddsApiSport[]>('/sports');
    },

    // Get odds for a specific sport
    getOdds: async (params: GetOddsParams): Promise<OddsApiEvent[]> => {
        const { sport, ...rest } = params;
        return oddsApiClient.get<OddsApiEvent[]>(
            `/sports/${sport}/odds`,
            rest
        );
    },

    // Get odds for a specific event
    getEventOdds: async (
        sport: string,
        eventId: string,
        params: Omit<GetOddsParams, 'sport' | 'eventIds'> = {}
    ): Promise<OddsApiEvent> => {
        return oddsApiClient.get<OddsApiEvent>(
            `/sports/${sport}/events/${eventId}/odds`,
            params
        );
    },

    // Get historical scores
    getScores: async (params: GetScoresParams): Promise<OddsApiEvent[]> => {
        const { sport, ...rest } = params;
        return oddsApiClient.get<OddsApiEvent[]>(
            `/sports/${sport}/scores`,
            rest
        );
    },

    // Get event scores
    getEventScores: async (
        sport: string,
        eventId: string
    ): Promise<OddsApiEvent> => {
        return oddsApiClient.get<OddsApiEvent>(
            `/sports/${sport}/events/${eventId}/scores`
        );
    },
};