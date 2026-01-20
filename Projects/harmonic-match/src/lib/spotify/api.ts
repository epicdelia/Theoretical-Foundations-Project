// Spotify Web API service for fetching user music data

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string; width: number; height: number }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  popularity: number;
  preview_url: string | null;
}

export interface SpotifyAudioFeatures {
  id: string;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  tempo: number;
  valence: number;
  mode: number;
  time_signature: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

async function spotifyFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function getCurrentUser(
  accessToken: string
): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>("/me", accessToken);
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = "medium_term",
  limit: number = 20
): Promise<SpotifyArtist[]> {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );
  return data.items;
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = "medium_term",
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );
  return data.items;
}

export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<SpotifyAudioFeatures[]> {
  if (trackIds.length === 0) return [];

  // Spotify API allows max 100 IDs per request
  const chunks: string[][] = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    chunks.push(trackIds.slice(i, i + 100));
  }

  const results: SpotifyAudioFeatures[] = [];
  for (const chunk of chunks) {
    const data = await spotifyFetch<{ audio_features: (SpotifyAudioFeatures | null)[] }>(
      `/audio-features?ids=${chunk.join(",")}`,
      accessToken
    );
    results.push(...data.audio_features.filter((f): f is SpotifyAudioFeatures => f !== null));
  }

  return results;
}

export async function getAllTopArtists(
  accessToken: string
): Promise<{ short: SpotifyArtist[]; medium: SpotifyArtist[]; long: SpotifyArtist[] }> {
  const [short, medium, long] = await Promise.all([
    getTopArtists(accessToken, "short_term", 20),
    getTopArtists(accessToken, "medium_term", 20),
    getTopArtists(accessToken, "long_term", 20),
  ]);

  return { short, medium, long };
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
  accessToken: string,
  query: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];

  const encodedQuery = encodeURIComponent(query);
  const data = await spotifyFetch<SpotifySearchResult>(
    `/search?q=${encodedQuery}&type=track&limit=${limit}`,
    accessToken
  );

  return data.tracks.items;
}

// ============================================================================
// PLAYLIST MANAGEMENT
// ============================================================================

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  collaborative: boolean;
  public: boolean;
  external_urls: { spotify: string };
  images: { url: string; width: number | null; height: number | null }[];
  tracks: {
    total: number;
    items: SpotifyPlaylistTrack[];
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  added_by: { id: string };
  track: SpotifyTrack;
}

/**
 * Create a new playlist for a user
 */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = false,
  collaborative: boolean = true
): Promise<SpotifyPlaylist> {
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
      collaborative: collaborative && !isPublic, // Collaborative must be false if public
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Add tracks to a playlist
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<{ snapshot_id: string }> {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get playlist details including tracks
 */
export async function getPlaylist(
  accessToken: string,
  playlistId: string
): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(`/playlists/${playlistId}`, accessToken);
}

/**
 * Get all tracks from a playlist (handles pagination)
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number = 100
): Promise<SpotifyPlaylistTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyPlaylistTrack[]; total: number }>(
    `/playlists/${playlistId}/tracks?limit=${limit}`,
    accessToken
  );
  return data.items;
}
