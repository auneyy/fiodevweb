import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { timezone } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "cloud_id")
      .single();

    const cloudId = settings?.value || "";

    const result = await callFingerspot("set_time", { timezone });

    await supabase.from("command_logs").insert({
      cloud_id: cloudId,
      command_type: "set_time",
      request_body: { timezone },
      status: "pending",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
