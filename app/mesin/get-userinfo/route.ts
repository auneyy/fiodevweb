import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCloudId } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const cloudId = await getRequestUserCloudId(request.cookies);
    if (!cloudId) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi atau cloud_id belum diatur" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pins } = await supabase
      .from("device_pins")
      .select("pin")
      .eq("cloud_id", cloudId);

    if (!pins || pins.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada PIN ditemukan. Ambil PIN terlebih dahulu." });
    }

    let lastResult;
    for (const { pin } of pins) {
      lastResult = await callFingerspot("get_userinfo", { pin });
    }

    return NextResponse.json(lastResult);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
