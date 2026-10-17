import { getClientProfile } from "@/lib/client";
import { getNutritionistProfile } from "@/lib/nutritionist";
import { getSessionUser, hasAccessToken, setSessionUser, type UserRole } from "@/lib/auth";
import { resolveApiUrl } from "@/lib/api";
import { formatNutritionistName, formatClientName } from "@/lib/utils";



export interface CurrentProfileIdentity {
  role: UserRole;
  username: string;
  email: string;
  avatarUrl?: string;
}

export async function getProfileIdentity(role?: UserRole | null): Promise<CurrentProfileIdentity | null> {
  const sessionUser = getSessionUser();
  const resolvedRole = role ?? sessionUser?.role;

  // If no auth token cookie and no session user, the user is not logged in
  if (!hasAccessToken() && !sessionUser) return null;

  if (resolvedRole === "high_admin") {
    return {
      role: "high_admin",
      username: sessionUser?.username || "Admin",
      email: sessionUser?.email || "admin@example.com",
    };
  }

  if (resolvedRole === "client") {
    try {
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
    } catch {
      if (sessionUser?.username || sessionUser?.email) {
        return {
          role: "client",
          username: formatClientName(sessionUser.username),
          email: sessionUser.email || "",
        };
      }
      return null;
    }
  }

  if (resolvedRole === "nutritionist") {
    try {
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
    } catch {
      if (sessionUser?.username || sessionUser?.email) {
        return {
          role: "nutritionist",
          username: formatNutritionistName(sessionUser.username),
          email: sessionUser.email || "",
        };
      }
      return null;
    }
  }

  try {
    return await getProfileIdentity("client");
  } catch {
    try {
      return await getProfileIdentity("nutritionist");
    } catch {
      if (sessionUser) {
        return {
          role: sessionUser.role,
          username: sessionUser.username || "User",
          email: sessionUser.email || "",
        };
      }
      return null;
    }
  }
}
