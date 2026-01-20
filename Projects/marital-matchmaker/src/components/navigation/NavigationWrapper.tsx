import { getNavigationBadgeCounts } from "@/lib/navigation/actions";
import { Navigation } from "./Navigation";

export async function NavigationWrapper() {
  const { counts, error } = await getNavigationBadgeCounts();

  // If not authenticated, don't show navigation
  if (error === "Not authenticated") {
    return null;
  }

  return (
    <Navigation
      unreadMessages={counts.unreadMessages}
      newMatches={counts.newMatches}
    />
  );
}
