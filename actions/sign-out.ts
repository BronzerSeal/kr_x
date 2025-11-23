"use server";

import { signOut } from "@/auth/auth";

export async function signOutFunc() {
  try {
    const result = await signOut({ redirect: false });
    console.log("result", result);

    return result;
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    throw error;
  }
}
