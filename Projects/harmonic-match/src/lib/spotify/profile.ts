// Music profile processing logic

import type {
  TopArtistJson,
  AudioFeaturesAvgJson,
  MusicPersonalityType,
} from "@/lib/database.types";
import type { SpotifyArtist, SpotifyAudioFeatures } from "./api";

export interface ProcessedMusicProfile {
  topArtists: TopArtistJson[];
  topGenres: string[];
  audioFeaturesAvg: AudioFeaturesAvgJson;
  musicPersonality: MusicPersonalityType;
}

export function processArtists(
  shortTerm: SpotifyArtist[],
  mediumTerm: SpotifyArtist[],
  longTerm: SpotifyArtist[]
): TopArtistJson[] {
  // Combine all artists with weighting: short-term (recent) gets highest weight
  const artistScores = new Map<string, { artist: SpotifyArtist; score: number }>();

  // Weight: short_term = 3, medium_term = 2, long_term = 1
  const addArtists = (artists: SpotifyArtist[], weight: number) => {
    artists.forEach((artist, index) => {
      const positionScore = (artists.length - index) * weight;
      const existing = artistScores.get(artist.id);
      if (existing) {
        existing.score += positionScore;
      } else {
        artistScores.set(artist.id, { artist, score: positionScore });
      }
    });
  };

  addArtists(shortTerm, 3);
  addArtists(mediumTerm, 2);
  addArtists(longTerm, 1);

  // Sort by score and take top 20
  const sortedArtists = Array.from(artistScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return sortedArtists.map(({ artist }) => ({
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    image_url: artist.images[0]?.url,
  }));
}

export function extractTopGenres(artists: TopArtistJson[]): string[] {
  // Count genre occurrences with weighting by artist position
  const genreScores = new Map<string, number>();

  artists.forEach((artist, index) => {
    const positionWeight = artists.length - index;
    artist.genres.forEach((genre) => {
      const current = genreScores.get(genre) || 0;
      genreScores.set(genre, current + positionWeight);
    });
  });

  // Sort by score and take top 10 genres
  return Array.from(genreScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre]) => genre);
}

export function calculateAverageAudioFeatures(
  features: SpotifyAudioFeatures[]
): AudioFeaturesAvgJson {
  if (features.length === 0) {
    return {};
  }

  const sum = features.reduce(
    (acc, f) => ({
      acousticness: acc.acousticness + f.acousticness,
      danceability: acc.danceability + f.danceability,
      energy: acc.energy + f.energy,
      instrumentalness: acc.instrumentalness + f.instrumentalness,
      liveness: acc.liveness + f.liveness,
      loudness: acc.loudness + f.loudness,
      speechiness: acc.speechiness + f.speechiness,
      tempo: acc.tempo + f.tempo,
      valence: acc.valence + f.valence,
      mode: acc.mode + f.mode,
      time_signature: acc.time_signature + f.time_signature,
    }),
    {
      acousticness: 0,
      danceability: 0,
      energy: 0,
      instrumentalness: 0,
      liveness: 0,
      loudness: 0,
      speechiness: 0,
      tempo: 0,
      valence: 0,
      mode: 0,
      time_signature: 0,
    }
  );

  const count = features.length;
  return {
    acousticness: Math.round((sum.acousticness / count) * 1000) / 1000,
    danceability: Math.round((sum.danceability / count) * 1000) / 1000,
    energy: Math.round((sum.energy / count) * 1000) / 1000,
    instrumentalness: Math.round((sum.instrumentalness / count) * 1000) / 1000,
    liveness: Math.round((sum.liveness / count) * 1000) / 1000,
    loudness: Math.round((sum.loudness / count) * 100) / 100,
    speechiness: Math.round((sum.speechiness / count) * 1000) / 1000,
    tempo: Math.round((sum.tempo / count) * 10) / 10,
    valence: Math.round((sum.valence / count) * 1000) / 1000,
    mode: Math.round((sum.mode / count) * 1000) / 1000,
    time_signature: Math.round(sum.time_signature / count),
  };
}

export function determineMusicPersonality(
  topArtists: TopArtistJson[],
  shortTermArtists: SpotifyArtist[],
  longTermArtists: SpotifyArtist[],
  audioFeatures: AudioFeaturesAvgJson
): MusicPersonalityType {
  // Calculate metrics for personality determination

  // 1. Genre diversity (eclectic)
  const allGenres = new Set<string>();
  topArtists.forEach((a) => a.genres.forEach((g) => allGenres.add(g)));
  const genreDiversity = allGenres.size;

  // 2. Artist overlap between short and long term (loyalist vs explorer)
  const shortTermIds = new Set(shortTermArtists.map((a) => a.id));
  const longTermIds = new Set(longTermArtists.map((a) => a.id));
  const overlapCount = [...shortTermIds].filter((id) => longTermIds.has(id)).length;
  const overlapRatio = shortTermIds.size > 0 ? overlapCount / shortTermIds.size : 0;

  // 3. Popularity analysis (social_listener)
  const avgPopularity =
    topArtists.reduce((sum, a) => sum + a.popularity, 0) / Math.max(topArtists.length, 1);

  // 4. Mood variance (mood_matcher) - using valence and energy
  const valence = audioFeatures.valence ?? 0.5;
  const energy = audioFeatures.energy ?? 0.5;

  // Decision logic
  // High genre diversity (20+) and low overlap -> Explorer
  if (genreDiversity >= 20 && overlapRatio < 0.3) {
    return "explorer";
  }

  // Very high overlap (70%+) between short and long term -> Loyalist
  if (overlapRatio >= 0.7) {
    return "loyalist";
  }

  // High popularity (70+) with moderate diversity -> Social Listener
  if (avgPopularity >= 70 && genreDiversity < 15) {
    return "social_listener";
  }

  // Extreme valence or energy values -> Mood Matcher
  if (valence < 0.3 || valence > 0.7 || energy < 0.3 || energy > 0.7) {
    return "mood_matcher";
  }

  // Default: Eclectic (balanced across metrics)
  return "eclectic";
}

export function getMusicPersonalityLabel(personality: MusicPersonalityType): string {
  const labels: Record<MusicPersonalityType, string> = {
    explorer: "Indie Explorer",
    loyalist: "Dedicated Fan",
    eclectic: "Genre Blender",
    mood_matcher: "Mood Curator",
    social_listener: "Pop Enthusiast",
  };
  return labels[personality];
}

export function getMusicPersonalityDescription(personality: MusicPersonalityType): string {
  const descriptions: Record<MusicPersonalityType, string> = {
    explorer:
      "You're always discovering new artists and genres. Your playlist is a treasure map of musical adventures.",
    loyalist:
      "You know what you love and stick with it. Your favorite artists have a dedicated fan in you.",
    eclectic:
      "Your taste spans across the musical spectrum. From classical to hip-hop, you appreciate it all.",
    mood_matcher:
      "Music is your emotional companion. You curate the perfect soundtrack for every moment.",
    social_listener:
      "You've got your finger on the pulse of what's hot. If it's trending, it's on your playlist.",
  };
  return descriptions[personality];
}
