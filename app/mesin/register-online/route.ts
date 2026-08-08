import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCredentials } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { pin, verification } = await request.json();

    const creds = await getRequestUserCredentials(request.cookies);
    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi atau cloud_id belum diatur" },
        { status: 401 }
      );
    }

    const result = await callFingerspot("reg_online", { pin, verification }, creds);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cmdStatus = result.success ? "success" : "failed";
    const { error: insertErr } = await supabase.from("command_logs").insert({
      cloud_id: creds.cloudId,
      command_type: "register_online",
      trans_id: result.transId,
      request_body: { pin, verification },
      response_body: result,
      status: cmdStatus,
    });
    if (insertErr) console.error("[register-online] Failed to insert command_log:", insertErr);

    if (result.success && pin) {
      const { error: pinErr } = await supabase.from("device_pins").upsert(
        { cloud_id: creds.cloudId, pin, fetched_at: new Date().toISOString() },
        { onConflict: "cloud_id,pin" }
      );
      if (pinErr) console.error("[register-online] Failed to add pin to device_pins:", pinErr);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
