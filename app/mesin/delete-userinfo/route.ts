import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCloudId } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    const result = await callFingerspot("delete_userinfo", { pin });

    if (result.success) {
      const cloudId = await getRequestUserCloudId(request.cookies);
      if (cloudId) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase
          .from("users")
          .delete()
          .eq("cloud_id", cloudId)
          .eq("pin", pin);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
