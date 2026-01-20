"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, X, Sparkles, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    userId: string;
    displayName: string;
    photoUrl: string | null;
    compatibilityScore: number;
  };
  conversationId?: string;
}

export function MatchNotification({
  isOpen,
  onClose,
  matchedUser,
  conversationId,
}: MatchNotificationProps) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    }
    onClose();
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  const handleViewProfile = () => {
    router.push(`/profile/${matchedUser.userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm mx-4 transition-all duration-500 ${
          isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Card */}
        <div className="bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-3xl p-1">
          <div className="bg-background rounded-[22px] p-6 space-y-6">
            {/* Header with animation */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <Heart className="h-12 w-12 text-pink-500/50" />
                  </div>
                  <Heart className="h-12 w-12 text-pink-500 fill-pink-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                It&apos;s a Match!
              </h2>
              <p className="text-muted-foreground text-sm">
                You and {matchedUser.displayName} liked each other
              </p>
            </div>

            {/* Profile Photo */}
            <div className="flex justify-center">
              <button
                onClick={handleViewProfile}
                className="relative group"
              >
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary transition-colors">
                  {matchedUser.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={matchedUser.photoUrl}
                      alt={matchedUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Compatibility badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {matchedUser.compatibilityScore}% match
                </div>
              </button>
            </div>

            {/* Name */}
            <p className="text-center text-xl font-semibold">
              {matchedUser.displayName}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
                onClick={handleSendMessage}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Send a Message
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleKeepSwiping}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>

        {/* Confetti-like decorations */}
        <div className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-pink-500/30 animate-pulse" />
        <div className="absolute -top-2 -right-6 h-6 w-6 rounded-full bg-purple-500/30 animate-pulse delay-100" />
        <div className="absolute -bottom-3 -left-6 h-5 w-5 rounded-full bg-primary/30 animate-pulse delay-200" />
        <div className="absolute -bottom-4 -right-4 h-7 w-7 rounded-full bg-pink-400/30 animate-pulse delay-300" />
      </div>
    </div>
  );
}
