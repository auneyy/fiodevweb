import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCloudId } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { pin, name, password, privilege, rfid, template } = await request.json();

    const result = await callFingerspot("set_userinfo", {
      data: {
        pin,
        name,
        password,
        privilege: privilege.toString(),
        rfid,
        template,
      },
    });

    if (result.success) {
      const cloudId = await getRequestUserCloudId(request.cookies);
      if (cloudId) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from("users").upsert(
          {
            cloud_id: cloudId,
            pin,
            name: name || "",
            privilege: Number(privilege),
            password: password || "",
            rfid: rfid ? Number(rfid) : 0,
            template: template || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "cloud_id,pin" }
        );
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
