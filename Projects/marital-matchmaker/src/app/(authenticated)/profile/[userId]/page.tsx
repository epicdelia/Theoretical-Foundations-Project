import { redirect } from "next/navigation";
import { getProfileWithCompatibility } from "@/lib/profile/actions";
import { ProfileView } from "@/components/profile/ProfileView";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const { profile, error } = await getProfileWithCompatibility(userId);

  if (error === "Not authenticated") {
    redirect("/login");
  }

  if (!profile) {
    redirect("/dashboard");
  }

  return <ProfileView profile={profile} />;
}
