import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCredentials } from "@/lib/request-user";

export async function POST(request: NextRequest) {
  try {
    console.log("[get-all-pin] Starting...");
    const creds = await getRequestUserCredentials(request.cookies);
    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi atau cloud_id belum diatur" },
        { status: 401 }
      );
    }
    const result = await callFingerspot("get_all_pin", {}, creds);
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
