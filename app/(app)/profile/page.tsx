import { requireProfile } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "الملف الشخصي — معامل خيرات اليمن" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  return <ProfileClient profile={profile} />;
}
