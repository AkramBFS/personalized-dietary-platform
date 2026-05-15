import { getClientProfile } from "@/lib/client";
import { getNutritionistProfile } from "@/lib/nutritionist";
import { getSessionUser, hasAccessToken, setSessionUser, type UserRole } from "@/lib/auth";
import { resolveApiUrl } from "@/lib/api";
import { formatNutritionistName, formatClientName } from "@/lib/utils";



export interface CurrentProfileIdentity {
  role: Exclude<UserRole, "high_admin">;
  username: string;
  email: string;
  avatarUrl?: string;
}

export async function getProfileIdentity(role?: UserRole | null): Promise<CurrentProfileIdentity | null> {
  if (!hasAccessToken()) return null;

  const sessionUser = getSessionUser();
  const resolvedRole = role ?? sessionUser?.role;

  if (resolvedRole === "client") {
    const profile = await getClientProfile();
    setSessionUser({
      id: profile.client_id,
      role: "client",
      username: profile.username,
      email: profile.email,
    });
    return {
      role: "client",
      username: formatClientName(profile.username || sessionUser?.username),
      email: profile.email || sessionUser?.email || "",
      avatarUrl: resolveApiUrl(profile.profile_photo_url),
    };

  }

  if (resolvedRole === "nutritionist") {
    const profile = await getNutritionistProfile();
    setSessionUser({
      id: profile.nutritionist_id,
      role: "nutritionist",
      username: profile.username || profile.user?.username,
      email: profile.email || profile.user?.email,
    });
    
    const rawUsername = profile.username || profile.user?.username || sessionUser?.username || "Nutritionist";
    const username = formatNutritionistName(rawUsername);
    
    return {
      role: "nutritionist",
      username,
      email: profile.email || profile.user?.email || sessionUser?.email || "",
      avatarUrl: resolveApiUrl(profile.profile_photo_url),
    };
  }


  if (resolvedRole === "high_admin") return null;

  try {
    return await getProfileIdentity("client");
  } catch {
    try {
      return await getProfileIdentity("nutritionist");
    } catch {
      return null;
    }
  }
}
