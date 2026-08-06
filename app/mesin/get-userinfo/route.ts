import { NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";

export async function POST() {
  try {
    const result = await callFingerspot("get_userinfo", {});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
