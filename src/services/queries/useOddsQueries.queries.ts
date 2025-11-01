import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {GetOddsParams, GetScoresParams, OddsApiEvent, OddsApiSport} from "@/interfaces/oddsApi.interface.ts";
import {queryKeys} from "@/services/queries/queryKeys.queries.ts";
import {oddsApi} from "@/services/oddsApi.service.ts";


// Get available sports
export function useSports(
    options?: Omit<UseQueryOptions<OddsApiSport[]>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: queryKeys.odds.sports(),
        queryFn: () => oddsApi.getSports(),
        staleTime: 1000 * 60 * 60 * 24,
        ...options,
    });
}

// Get odds for a sport
export function useOdds(
    params: GetOddsParams,
    options?: Omit<UseQueryOptions<OddsApiEvent[]>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: queryKeys.odds.list(params),
        queryFn: () => oddsApi.getOdds(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
        enabled: !!params.sport,
        ...options,
    });
}

// Get odds for a specific event
export function useEventOdds(
    sport: string,
    eventId: string,
    params?: Omit<GetOddsParams, 'sport' | 'eventIds'>,
    options?: Omit<UseQueryOptions<OddsApiEvent>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: queryKeys.odds.event(sport, eventId),
        queryFn: () => oddsApi.getEventOdds(sport, eventId, params),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!sport && !!eventId,
        ...options,
    });
}

// Get historical scores
export function useScores(
    params: GetScoresParams,
    options?: Omit<UseQueryOptions<OddsApiEvent[]>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: queryKeys.scores.list(params),
        queryFn: () => oddsApi.getScores(params),
        staleTime: 1000 * 60 * 60, // 1 hour
        enabled: !!params.sport,
        ...options,
    });
}

// Get scores for a specific event
export function useEventScores(
    sport: string,
    eventId: string,
    options?: Omit<UseQueryOptions<OddsApiEvent>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: queryKeys.scores.event(sport, eventId),
        queryFn: () => oddsApi.getEventScores(sport, eventId),
        staleTime: 1000 * 60 * 60, // 1 hour
        enabled: !!sport && !!eventId,
        ...options,
    });
}