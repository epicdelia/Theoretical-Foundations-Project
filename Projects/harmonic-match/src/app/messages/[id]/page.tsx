"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Send,
  Loader2,
  User,
  ArrowLeft,
  Music,
  X,
  Search,
  Play,
  Check,
  CheckCheck,
  ListMusic,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  type MessageWithSender,
} from "@/lib/messaging";
import {
  searchTracks,
  createPlaylist,
  addTracksToPlaylist,
  getPlaylistTracks,
  getCurrentUser,
  type SpotifyTrack,
  type SpotifyPlaylistTrack,
} from "@/lib/spotify/api";
import {
  createSharedPlaylist,
  getSharedPlaylistsByConversation,
} from "@/lib/playlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { PhotoJson, SongShareJson, UserProfile, SharedPlaylist } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

interface SongMessageProps {
  song: SongShareJson;
}

function SongMessage({ song }: SongMessageProps) {
  const handleOpenSpotify = () => {
    window.open(
      `https://open.spotify.com/track/${song.spotify_track_id}`,
      "_blank"
    );
  };

  return (
    <button
      onClick={handleOpenSpotify}
      className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors w-full text-left"
    >
      {/* Album Art */}
      {song.album_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.album_image_url}
          alt={song.album_name || song.track_name}
          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Music className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{song.track_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {song.artist_name}
        </p>
      </div>

      {/* Play Button */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
        <Play className="h-4 w-4 text-white fill-white ml-0.5" />
      </div>
    </button>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
  showReadReceipt: boolean;
}

function MessageBubble({ message, showReadReceipt }: MessageBubbleProps) {
  const { message: msg, isFromCurrentUser } = message;
  const hasSong = !!msg.song_share_json;
  const isRead = !!msg.read_at;

  return (
    <div
      className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] ${
          isFromCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        } rounded-2xl px-4 py-2 ${
          isFromCurrentUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
      >
        {hasSong && <SongMessage song={msg.song_share_json!} />}
        {msg.content && msg.content !== "Shared a song" && (
          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
        )}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isFromCurrentUser ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[10px] ${
              isFromCurrentUser
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            {formatMessageTime(msg.created_at)}
          </span>
          {isFromCurrentUser && showReadReceipt && (
            <span className="text-primary-foreground/70">
              {isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpotifySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (track: SpotifyTrack) => void;
  accessToken: string | null;
}

function SpotifySearchModal({
  isOpen,
  onClose,
  onSelectSong,
  accessToken,
}: SpotifySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !accessToken) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const tracks = await searchTracks(accessToken, searchQuery, 10);
      setResults(tracks);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Search failed"
      );
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, accessToken]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Music className="h-5 w-5 text-green-500" />
            Share a Song
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a song..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!accessToken ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Connect Spotify to share songs
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchError ? (
            <div className="text-center py-8 text-destructive">
              <p>{searchError}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery.trim()
                ? "No songs found"
                : "Search for songs to share"}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectSong(track)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent w-full text-left transition-colors"
                >
                  {track.album.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isCreating: boolean;
}

function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setPlaylistName("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onCreate(playlistName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-green-500" />
            Create Shared Playlist
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isCreating}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="playlist-name" className="text-sm font-medium">
              Playlist Name
            </label>
            <Input
              id="playlist-name"
              ref={inputRef}
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Our shared playlist..."
              className="mt-1"
              disabled={isCreating}
              maxLength={100}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            This will create a collaborative Spotify playlist that both of you can add songs to.
          </p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={!playlistName.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Playlist"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PlaylistViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: SharedPlaylist | null;
  tracks: SpotifyPlaylistTrack[];
  isLoading: boolean;
  onAddSong: () => void;
}

function PlaylistViewModal({
  isOpen,
  onClose,
  playlist,
  tracks,
  isLoading,
  onAddSong,
}: PlaylistViewModalProps) {
  if (!isOpen || !playlist) return null;

  const playlistUrl = `https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="truncate">{playlist.name}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {tracks.length} {tracks.length === 1 ? "song" : "songs"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(playlistUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No songs yet</p>
              <Button onClick={onAddSong}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Song
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((item) => (
                <button
                  key={item.track.id}
                  onClick={() =>
                    window.open(
                      `https://open.spotify.com/track/${item.track.id}`,
                      "_blank"
                    )
                  }
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent w-full text-left transition-colors"
                >
                  {item.track.album.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.track.album.images[0].url}
                      alt={item.track.album.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button onClick={onAddSong} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Song to Playlist
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AddSongToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (track: SpotifyTrack) => void;
  accessToken: string | null;
  playlistName: string;
  isAdding: boolean;
}

function AddSongToPlaylistModal({
  isOpen,
  onClose,
  onSelectSong,
  accessToken,
  playlistName,
  isAdding,
}: AddSongToPlaylistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !accessToken) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const tracks = await searchTracks(accessToken, searchQuery, 10);
      setResults(tracks);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, accessToken]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            <span className="truncate">Add to {playlistName}</span>
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isAdding}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a song..."
              className="pl-10"
              disabled={isAdding}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!accessToken ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Connect Spotify to add songs
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchError ? (
            <div className="text-center py-8 text-destructive">
              <p>{searchError}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery.trim() ? "No songs found" : "Search for songs to add"}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectSong(track)}
                  disabled={isAdding}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent w-full text-left transition-colors disabled:opacity-50"
                >
                  {track.album.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  {isAdding ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Plus className="h-5 w-5 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PlaylistCardProps {
  playlist: SharedPlaylist;
  onClick: () => void;
}

function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors w-full text-left"
    >
      <div className="w-10 h-10 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
        <ListMusic className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{playlist.name}</p>
        <p className="text-xs text-muted-foreground">Shared playlist</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const { user, isLoading: authLoading, spotifyTokens } = useAuth();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSpotifySearchOpen, setIsSpotifySearchOpen] = useState(false);

  // Playlist state
  const [sharedPlaylists, setSharedPlaylists] = useState<SharedPlaylist[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SharedPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    const result = await getMessages(conversationId);

    if (result.success) {
      setMessages(result.messages);
      setOtherUser(result.otherUser);

      // Mark messages as read
      await markMessagesAsRead(conversationId);
    } else {
      setError(result.error || "Failed to load messages");
    }

    setIsLoading(false);
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    if (user && !authLoading && conversationId) {
      fetchMessages();
    }
  }, [user, authLoading, conversationId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !conversationId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageWithSender["message"];
          setMessages((prev) => [
            ...prev,
            {
              message: newMessage,
              isFromCurrentUser: newMessage.sender_id === user.id,
            },
          ]);

          // Mark as read if from other user
          if (newMessage.sender_id !== user.id) {
            markMessagesAsRead(conversationId);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as MessageWithSender["message"];
          setMessages((prev) =>
            prev.map((m) =>
              m.message.id === updatedMessage.id
                ? { ...m, message: updatedMessage }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    const content = messageInput;
    setMessageInput("");

    const result = await sendMessage(conversationId, content);

    if (!result.success) {
      setMessageInput(content);
      // Could show an error toast here
    }

    setIsSending(false);
  };

  const handleSendSong = async (track: SpotifyTrack) => {
    setIsSpotifySearchOpen(false);
    setIsSending(true);

    const songShare: SongShareJson = {
      spotify_track_id: track.id,
      track_name: track.name,
      artist_name: track.artists.map((a) => a.name).join(", "),
      album_name: track.album.name,
      preview_url: track.preview_url || undefined,
      album_image_url: track.album.images[0]?.url,
    };

    await sendMessage(conversationId, "", songShare);

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    router.push("/messages");
  };

  // Fetch shared playlists
  const fetchSharedPlaylists = useCallback(async () => {
    const result = await getSharedPlaylistsByConversation(conversationId);
    if (result.success) {
      setSharedPlaylists(result.playlists);
      if (result.matchId) {
        setMatchId(result.matchId);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (user && !authLoading && conversationId) {
      fetchSharedPlaylists();
    }
  }, [user, authLoading, conversationId, fetchSharedPlaylists]);

  // Create a new shared playlist
  const handleCreatePlaylist = async (name: string) => {
    if (!spotifyTokens?.accessToken || !matchId) return;

    setIsCreatingPlaylist(true);

    try {
      // Get the current user's Spotify ID
      const spotifyUser = await getCurrentUser(spotifyTokens.accessToken);

      // Create the playlist on Spotify
      const playlist = await createPlaylist(
        spotifyTokens.accessToken,
        spotifyUser.id,
        name,
        `Shared playlist with ${otherUser?.display_name || "your match"}`,
        false,
        true
      );

      // Save to our database
      const result = await createSharedPlaylist(
        matchId,
        playlist.id,
        name
      );

      if (result.success && result.playlist) {
        setSharedPlaylists((prev) => [result.playlist!, ...prev]);
        setIsCreatePlaylistOpen(false);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // View a playlist
  const handleViewPlaylist = async (playlist: SharedPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsLoadingTracks(true);
    setPlaylistTracks([]);

    if (spotifyTokens?.accessToken) {
      try {
        const tracks = await getPlaylistTracks(
          spotifyTokens.accessToken,
          playlist.spotify_playlist_id
        );
        setPlaylistTracks(tracks);
      } catch (error) {
        console.error("Error loading playlist tracks:", error);
      }
    }

    setIsLoadingTracks(false);
  };

  // Add a song to the playlist
  const handleAddSongToPlaylist = async (track: SpotifyTrack) => {
    if (!spotifyTokens?.accessToken || !selectedPlaylist) return;

    setIsAddingSong(true);

    try {
      await addTracksToPlaylist(
        spotifyTokens.accessToken,
        selectedPlaylist.spotify_playlist_id,
        [`spotify:track:${track.id}`]
      );

      // Refresh tracks
      const tracks = await getPlaylistTracks(
        spotifyTokens.accessToken,
        selectedPlaylist.spotify_playlist_id
      );
      setPlaylistTracks(tracks);

      setIsAddSongOpen(false);
    } catch (error) {
      console.error("Error adding song to playlist:", error);
    } finally {
      setIsAddingSong(false);
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageWithSender[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const msgDate = new Date(msg.message.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.message.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const photos = (otherUser?.photos_json || []) as PhotoJson[];
  const primaryPhoto = photos[0]?.url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {otherUser && (
            <button
              onClick={() => router.push(`/profile/${otherUser.user_id}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {primaryPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryPhoto}
                  alt={otherUser.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="text-left">
                <h1 className="font-semibold">{otherUser.display_name}</h1>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchMessages} className="mt-4">
              Try Again
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Shared Playlists Section */}
            {sharedPlaylists.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Shared Playlists
                </p>
                {sharedPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => handleViewPlaylist(playlist)}
                  />
                ))}
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Music className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Say hi or share a song to break the ice!
                </p>
              </div>
            ) : (
              <>
                {groupedMessages.map((group, groupIdx) => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDateSeparator(group.date)}
                      </span>
                    </div>

                    {/* Messages in group */}
                    <div className="space-y-2">
                      {group.messages.map((msg, msgIdx) => (
                        <MessageBubble
                          key={msg.message.id}
                          message={msg}
                          showReadReceipt={
                            msgIdx === group.messages.length - 1 &&
                            groupIdx === groupedMessages.length - 1
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSpotifySearchOpen(true)}
            className="flex-shrink-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
          >
            <Music className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreatePlaylistOpen(true)}
            className="flex-shrink-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            title="Create shared playlist"
          >
            <ListMusic className="h-5 w-5" />
          </Button>

          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            size="icon"
            className="flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Spotify Search Modal */}
      <SpotifySearchModal
        isOpen={isSpotifySearchOpen}
        onClose={() => setIsSpotifySearchOpen(false)}
        onSelectSong={handleSendSong}
        accessToken={spotifyTokens?.accessToken || null}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
        isCreating={isCreatingPlaylist}
      />

      {/* View Playlist Modal */}
      <PlaylistViewModal
        isOpen={!!selectedPlaylist}
        onClose={() => {
          setSelectedPlaylist(null);
          setPlaylistTracks([]);
        }}
        playlist={selectedPlaylist}
        tracks={playlistTracks}
        isLoading={isLoadingTracks}
        onAddSong={() => setIsAddSongOpen(true)}
      />

      {/* Add Song to Playlist Modal */}
      <AddSongToPlaylistModal
        isOpen={isAddSongOpen}
        onClose={() => setIsAddSongOpen(false)}
        onSelectSong={handleAddSongToPlaylist}
        accessToken={spotifyTokens?.accessToken || null}
        playlistName={selectedPlaylist?.name || ""}
        isAdding={isAddingSong}
      />
    </div>
  );
}
