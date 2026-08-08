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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const pinListResult = await callFingerspot("get_userid_list", {}, creds);
    if (pinListResult.success && pinListResult.data) {
      const pinData = pinListResult.data as Record<string, unknown>;
      const pinArr = (pinData.pin_arr as string[]) || [];
      for (const p of pinArr) {
        if (p) {
          await supabase.from("device_pins").upsert(
            { cloud_id: creds.cloudId, pin: p, fetched_at: new Date().toISOString() },
            { onConflict: "cloud_id,pin" }
          );
        }
      }
    }
    await new Promise((r) => setTimeout(r, 2000));

    const { data: pins } = await supabase
      .from("device_pins")
      .select("pin")
      .eq("cloud_id", creds.cloudId);

    if (!pins || pins.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada PIN ditemukan. Ambil PIN terlebih dahulu." });
    }

    let lastResult;
    let savedCount = 0;

    for (const { pin } of pins) {
      lastResult = await callFingerspot("get_userinfo", { pin }, creds);

      if (lastResult.success && lastResult.data) {
        const d = lastResult.data as Record<string, unknown>;
        console.log("[get-userinfo] pin:", pin, "data:", JSON.stringify(d).substring(0, 300));
        if (d.pin) {
          const updateData: Record<string, unknown> = {
            cloud_id: creds.cloudId,
            pin: d.pin,
            synced_at: new Date().toISOString(),
            raw_payload: lastResult.data,
          };

          if (d.name != null) updateData.name = d.name;
          if (d.privilege != null) updateData.privilege = Number(d.privilege);
          if (d.password != null) updateData.password = d.password;
          if (d.rfid != null) updateData.rfid = Number(d.rfid);
          if (d.template != null) updateData.template = d.template;
          if (d.finger != null) updateData.finger = Number(d.finger);
          if (d.face != null) updateData.face = Number(d.face);
          if (d.vein != null) updateData.vein = Number(d.vein);

          const { error } = await supabase
            .from("users")
            .upsert(updateData, { onConflict: "cloud_id,pin" });
          if (error) {
            console.error("[get-userinfo] upsert error:", error);
          } else {
            savedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${savedCount} user berhasil disinkronisasi`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
