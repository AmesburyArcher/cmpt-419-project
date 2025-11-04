import Papa from "papaparse";

interface NFLGameData {
  season: number;
  week: number;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_win: number;
  spread?: number;
  total?: number;
}

/**
 * Fetch games from ESPN API
 */
async function fetchESPNGames(
  season: number,
  week: number,
): Promise<NFLGameData[]> {
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&dates=${season}`,
  );
  const data = await response.json();

  return data.events.map((event: any) => {
    const homeTeam = event.competitions[0].competitors.find(
      (c: any) => c.homeAway === "home",
    );
    const awayTeam = event.competitions[0].competitors.find(
      (c: any) => c.homeAway === "away",
    );

    return {
      season,
      week,
      date: event.date,
      home_team: homeTeam.team.displayName,
      away_team: awayTeam.team.displayName,
      home_score: parseInt(homeTeam.score),
      away_score: parseInt(awayTeam.score),
      home_win: parseInt(homeTeam.score) > parseInt(awayTeam.score) ? 1 : 0,
    };
  });
}

/**
 * Calculate rolling form from previous games
 */
function calculateRollingForm(
  team: string,
  allGames: NFLGameData[],
  currentWeek: number,
  lookback: number = 5,
): number {
  const previousGames = allGames
    .filter(
      (g) =>
        (g.home_team === team || g.away_team === team) && g.week < currentWeek,
    )
    .slice(-lookback);

  if (previousGames.length === 0) return 0.5;

  const wins = previousGames.filter((g) => {
    const isHome = g.home_team === team;
    return isHome ? g.home_win === 1 : g.home_win === 0;
  }).length;

  return wins / previousGames.length;
}

/**
 * Estimate rest days based on previous game
 */
function calculateRestDays(
  team: string,
  allGames: NFLGameData[],
  currentDate: string,
): number {
  const previousGame = allGames
    .filter((g) => g.home_team === team || g.away_team === team)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!previousGame) return 7;

  return Math.floor(
    (new Date(currentDate).getTime() - new Date(previousGame.date).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

/**
 * Check if game is divisional
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
 * Build complete dataset
 */
export async function buildHistoricalCSV(
  season: number,
  startWeek: number = 1,
  endWeek: number = 18,
) {
  const allGames: NFLGameData[] = [];

  for (let week = startWeek; week <= endWeek; week++) {
    const games = await fetchESPNGames(season, week);
    allGames.push(...games);

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return allGames.map((game) => {
    const gamesBeforeCurrent = allGames.filter(
      (g) => new Date(g.date) < new Date(game.date),
    );

    return {
      ...game,
      rolling_form_home: calculateRollingForm(
        game.home_team,
        gamesBeforeCurrent,
        game.week,
      ),
      rolling_form_away: calculateRollingForm(
        game.away_team,
        gamesBeforeCurrent,
        game.week,
      ),
      rest_days_home: calculateRestDays(
        game.home_team,
        gamesBeforeCurrent,
        game.date,
      ),
      rest_days_away: calculateRestDays(
        game.away_team,
        gamesBeforeCurrent,
        game.date,
      ),
      divisional: isDivisionalGame(game.home_team, game.away_team) ? 1 : 0,
      thursday_game: new Date(game.date).getDay() === 4 ? 1 : 0,
      international: 0,
      travel_miles: 0,
    };
  });
}

/**
 * Export to CSV
 */
export function exportToCSV(games: any[], filename: string = "nfl_data.csv") {
  const csv = Papa.unparse(games);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
