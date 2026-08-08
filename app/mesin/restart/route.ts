import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCredentials } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const creds = await getRequestUserCredentials(request.cookies);
    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi atau cloud_id belum diatur" },
        { status: 401 }
      );
    }

    const result = await callFingerspot("restart_device", {}, creds);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cmdStatus = result.success ? "success" : "failed";
    const { error: insertErr } = await supabase.from("command_logs").insert({
      cloud_id: creds.cloudId,
      command_type: "restart_device",
      trans_id: result.transId,
      request_body: {},
      response_body: result,
      status: cmdStatus,
    });
    if (insertErr) console.error("[restart] Failed to insert command_log:", insertErr);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
