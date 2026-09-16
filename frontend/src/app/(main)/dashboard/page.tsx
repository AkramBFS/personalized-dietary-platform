import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;
  if (role === "nutritionist") redirect("/nutritionist");
  if (role === "high_admin") redirect("/admin");
  redirect("/client");
}
