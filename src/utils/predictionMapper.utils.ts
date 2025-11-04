import { OddsApiEvent } from "@/interfaces/oddsApi.interface.ts";
import { NflGameInterface } from "@/interfaces/nflGame.interface.ts";

/**
 * Map a live event from Odds API to model features
 * Uses historical data to estimate features like rest days, form, etc.
 */
export function mapLiveGameToFeatures(
  event: OddsApiEvent,
  selectedFeatures: string[],
  historicalGames: NflGameInterface[],
): number[] {
  const features: number[] = [];

  const spreadsMarket = event.bookmakers[0]?.markets.find(
    (m) => m.key === "spreads",
  );
  const totalsMarket = event.bookmakers[0]?.markets.find(
    (m) => m.key === "totals",
  );

  const homeSpread =
    spreadsMarket?.outcomes.find((o) => o.name === event.home_team)?.point || 0;
  const total = totalsMarket?.outcomes[0]?.point || 0;

  const homeRecentGames = getRecentGames(event.home_team, historicalGames, 5);
  const awayRecentGames = getRecentGames(event.away_team, historicalGames, 5);

  const estimatedFeatures: Record<string, number> = {
    spread: homeSpread,
    total: total,
    rest_days_home: estimateRestDays(event.home_team, historicalGames),
    rest_days_away: estimateRestDays(event.away_team, historicalGames),
    rolling_form_home: calculateRollingForm(homeRecentGames, event.home_team),
    rolling_form_away: calculateRollingForm(awayRecentGames, event.away_team),
    divisional: isDivisionalGame(event.home_team, event.away_team) ? 1 : 0,
    thursday_game: isThursdayGame(event.commence_time) ? 1 : 0,
    international: 0,
    travel_miles: estimateTravelMiles(event.away_team, event.home_team),
  };

  selectedFeatures.forEach((feature) => {
    features.push(estimatedFeatures[feature] || 0);
  });

  return features;
}

/**
 * Get recent games for a team
 */
function getRecentGames(
  team: string,
  historicalGames: NflGameInterface[],
  count: number,
): NflGameInterface[] {
  return historicalGames
    .filter((game) => game.home_team === team || game.away_team === team)
    .sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    })
    .slice(0, count);
}

/**
 * Calculate rolling form (win percentage in recent games)
 */
function calculateRollingForm(
  recentGames: NflGameInterface[],
  team: string,
): number {
  if (recentGames.length === 0) return 0.5;

  const wins = recentGames.filter((game) => {
    const isHome = game.home_team === team;
    return isHome ? game.home_win === 1 : game.home_win === 0;
  }).length;

  return wins / recentGames.length;
}

/**
 * Estimate rest days based on historical averages
 */
function estimateRestDays(
  team: string,
  historicalGames: NflGameInterface[],
): number {
  const recentGames = getRecentGames(team, historicalGames, 10);

  if (recentGames.length === 0) return 7;

  return (
    recentGames.reduce((sum, game) => {
      const restDays =
        game.home_team === team
          ? game.rest_days_home || 7
          : game.rest_days_away || 7;
      return sum + restDays;
    }, 0) / recentGames.length
  );
}

/**
 * Check if teams are in same division
 */
function isDivisionalGame(homeTeam: string, awayTeam: string): boolean {
  const divisions: Record<string, string[]> = {
    "AFC East": [
      "Buffalo Bills",
      "Miami Dolphins",
      "New England Patriots",
      "New York Jets",
    ],
    "AFC North": [
      "Baltimore Ravens",
      "Cincinnati Bengals",
      "Cleveland Browns",
      "Pittsburgh Steelers",
    ],
    "AFC South": [
      "Houston Texans",
      "Indianapolis Colts",
      "Jacksonville Jaguars",
      "Tennessee Titans",
    ],
    "AFC West": [
      "Denver Broncos",
      "Kansas City Chiefs",
      "Las Vegas Raiders",
      "Los Angeles Chargers",
    ],
    "NFC East": [
      "Dallas Cowboys",
      "New York Giants",
      "Philadelphia Eagles",
      "Washington Commanders",
    ],
    "NFC North": [
      "Chicago Bears",
      "Detroit Lions",
      "Green Bay Packers",
      "Minnesota Vikings",
    ],
    "NFC South": [
      "Atlanta Falcons",
      "Carolina Panthers",
      "New Orleans Saints",
      "Tampa Bay Buccaneers",
    ],
    "NFC West": [
      "Arizona Cardinals",
      "Los Angeles Rams",
      "San Francisco 49ers",
      "Seattle Seahawks",
    ],
  };

  for (const teams of Object.values(divisions)) {
    if (teams.includes(homeTeam) && teams.includes(awayTeam)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if game is on Thursday
 */
function isThursdayGame(commenceTime: string): boolean {
  const date = new Date(commenceTime);
  return date.getDay() === 4; // Thursday
}

/**
 * Estimate travel miles (simplified approximation)
 */
function estimateTravelMiles(awayTeam: string, homeTeam: string): number {
  const teamLocations: Record<string, { lat: number; lng: number }> = {
    // AFC East
    "New England Patriots": { lat: 42.09, lng: -71.26 }, // Gillette Stadium, Foxborough, MA
    "Buffalo Bills": { lat: 42.77, lng: -78.79 }, // Highmark Stadium, Orchard Park, NY
    "Miami Dolphins": { lat: 25.96, lng: -80.24 }, // Hard Rock Stadium, Miami Gardens, FL
    "New York Jets": { lat: 40.81, lng: -74.07 }, // MetLife Stadium, East Rutherford, NJ

    // AFC North
    "Baltimore Ravens": { lat: 39.28, lng: -76.62 }, // M&T Bank Stadium, Baltimore, MD
    "Cincinnati Bengals": { lat: 39.1, lng: -84.52 }, // Paycor Stadium, Cincinnati, OH
    "Cleveland Browns": { lat: 41.51, lng: -81.7 }, // Cleveland Browns Stadium, Cleveland, OH
    "Pittsburgh Steelers": { lat: 40.45, lng: -80.02 }, // Acrisure Stadium, Pittsburgh, PA

    // AFC South
    "Houston Texans": { lat: 29.68, lng: -95.41 }, // NRG Stadium, Houston, TX
    "Indianapolis Colts": { lat: 39.76, lng: -86.16 }, // Lucas Oil Stadium, Indianapolis, IN
    "Jacksonville Jaguars": { lat: 30.32, lng: -81.64 }, // EverBank Stadium, Jacksonville, FL
    "Tennessee Titans": { lat: 36.17, lng: -86.77 }, // Nissan Stadium, Nashville, TN

    // AFC West
    "Denver Broncos": { lat: 39.74, lng: -105.02 }, // Empower Field at Mile High, Denver, CO
    "Kansas City Chiefs": { lat: 39.05, lng: -94.48 }, // GEHA Field at Arrowhead Stadium, Kansas City, MO
    "Las Vegas Raiders": { lat: 36.09, lng: -115.18 }, // Allegiant Stadium, Las Vegas, NV
    "Los Angeles Chargers": { lat: 33.95, lng: -118.34 }, // SoFi Stadium, Inglewood, CA

    // NFC East
    "Dallas Cowboys": { lat: 32.75, lng: -97.09 }, // AT&T Stadium, Arlington, TX
    "New York Giants": { lat: 40.81, lng: -74.07 }, // MetLife Stadium, East Rutherford, NJ
    "Philadelphia Eagles": { lat: 39.9, lng: -75.17 }, // Lincoln Financial Field, Philadelphia, PA
    "Washington Commanders": { lat: 38.91, lng: -76.86 }, // Northwest Stadium, Landover, MD

    // NFC North
    "Chicago Bears": { lat: 41.86, lng: -87.62 }, // Soldier Field, Chicago, IL
    "Detroit Lions": { lat: 42.34, lng: -83.05 }, // Ford Field, Detroit, MI
    "Green Bay Packers": { lat: 44.5, lng: -88.06 }, // Lambeau Field, Green Bay, WI
    "Minnesota Vikings": { lat: 44.97, lng: -93.26 }, // U.S. Bank Stadium, Minneapolis, MN

    // NFC South
    "Atlanta Falcons": { lat: 33.76, lng: -84.4 }, // Mercedes-Benz Stadium, Atlanta, GA
    "Carolina Panthers": { lat: 35.23, lng: -80.85 }, // Bank of America Stadium, Charlotte, NC
    "New Orleans Saints": { lat: 29.95, lng: -90.08 }, // Caesars Superdome, New Orleans, LA
    "Tampa Bay Buccaneers": { lat: 27.98, lng: -82.5 }, // Raymond James Stadium, Tampa, FL

    // NFC West
    "Arizona Cardinals": { lat: 33.53, lng: -112.26 }, // State Farm Stadium, Glendale, AZ
    "Los Angeles Rams": { lat: 33.95, lng: -118.34 }, // SoFi Stadium, Inglewood, CA
    "San Francisco 49ers": { lat: 37.4, lng: -121.97 }, // Levi's Stadium, Santa Clara, CA
    "Seattle Seahawks": { lat: 47.6, lng: -122.33 }, // Lumen Field, Seattle, WA
  };

  const away = teamLocations[awayTeam];
  const home = teamLocations[homeTeam];

  if (!away || !home) return 0;

  const R = 3959;
  const dLat = toRad(home.lat - away.lat);
  const dLng = toRad(home.lng - away.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(away.lat)) *
      Math.cos(toRad(home.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
