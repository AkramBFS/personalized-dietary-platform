"use server";

export async function submitRegistration(data: any) {
  console.log("Submitting to server:", data);

  // Simulate DB save
  await new Promise((res) => setTimeout(res, 1000));

  return { success: true };
}
