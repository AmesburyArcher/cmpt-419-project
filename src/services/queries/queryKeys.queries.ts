import {GetOddsParams, GetScoresParams} from "@/interfaces/oddsApi.interface.ts";

export const queryKeys = {
    odds: {
        all: ['odds'] as const,
        sports: () => [...queryKeys.odds.all, 'sports'] as const,
        sport: (sport: string) => [...queryKeys.odds.all, sport] as const,
        list: (params: GetOddsParams) =>
            [...queryKeys.odds.sport(params.sport), 'list', params] as const,
        event: (sport: string, eventId: string) =>
            [...queryKeys.odds.sport(sport), 'event', eventId] as const,
    },
    scores: {
        all: ['scores'] as const,
        sport: (sport: string) => [...queryKeys.scores.all, sport] as const,
        list: (params: GetScoresParams) =>
            [...queryKeys.scores.sport(params.sport), 'list', params] as const,
        event: (sport: string, eventId: string) =>
            [...queryKeys.scores.sport(sport), 'event', eventId] as const,
    },
} as const;