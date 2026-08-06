import { NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["cloud_id"]);

    const cloudId = settings?.find((s) => s.key === "cloud_id")?.value || "";

    const { data: pins } = await supabase
      .from("device_pins")
      .select("pin")
      .eq("cloud_id", cloudId);

    if (!pins || pins.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada PIN ditemukan. Ambil PIN terlebih dahulu." });
    }

    let lastResult;
    for (const { pin } of pins) {
      lastResult = await callFingerspot("get_userinfo", {
        data: { pin },
      });
    }

    return NextResponse.json(lastResult);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
