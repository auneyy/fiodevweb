import { NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";

export async function POST() {
  try {
    console.log("[get-all-pin] Starting...");
    const result = await callFingerspot("get_all_pin", {});
    console.log("[get-all-pin] Result:", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error("[get-all-pin] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
