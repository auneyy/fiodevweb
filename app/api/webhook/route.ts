import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
    console.log("[webhook] Received:", JSON.stringify(body).substring(0, 500));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const webhookType = (body.type as string) || "unknown";
    const cloudId = (body.cloud_id as string) || "";
    const transId = (body.trans_id as string) || "";

    const { error: logError } = await supabase.from("webhook_logs").insert({
      cloud_id: cloudId,
      trans_id: transId,
      webhook_type: webhookType,
      raw_payload: body,
    });
    if (logError) console.error("[webhook] Failed to insert webhook_logs:", logError);

    const data = body.data as Record<string, unknown> | Record<string, unknown>[] | undefined;

    switch (body.type) {
      case "attlog":
      case "realtime_attlog": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        const { error } = await supabase.from("attendance_logs").insert({
          cloud_id: cloudId,
          pin: d.pin,
          scan_time: d.scan,
          verify: Number(d.verify ?? 0),
          status_scan: Number(d.status_scan ?? 0),
          photo_url: d.photo_url ?? null,
          raw_payload: body,
        });
        if (error) console.error("[webhook] attlog insert error:", error);
        break;
      }

      case "get_attlog": {
        const items = Array.isArray(data) ? data : data ? [data] : [];
        for (const item of items) {
          const { error } = await supabase.from("attendance_logs").insert({
            cloud_id: cloudId,
            pin: item.pin,
            scan_time: item.scan,
            verify: Number(item.verify ?? 0),
            status_scan: Number(item.status_scan ?? 0),
            photo_url: item.photo_url ?? null,
            raw_payload: body,
          });
          if (error) console.error("[webhook] get_attlog insert error:", error);
        }
        break;
      }

      case "get_userinfo": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        const { error } = await supabase.from("users").upsert(
          {
            cloud_id: cloudId,
            pin: d.pin,
            name: d.name ?? "",
            privilege: Number(d.privilege ?? 0),
            finger: Number(d.finger ?? 0),
            face: Number(d.face ?? 0),
            rfid: Number(d.rfid ?? 0),
            vein: Number(d.vein ?? 0),
            password: d.password ?? "",
            template: d.template ?? "",
            raw_payload: body,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "cloud_id,pin" }
        );
        if (error) console.error("[webhook] get_userinfo upsert error:", error);
        break;
      }

      case "set_userinfo": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        const statusVal = d.status === "1" ? "success" : "failed";
        const { error } = await supabase
          .from("api_logs")
          .update({
            status: statusVal,
            updated_at: new Date().toISOString(),
          })
          .eq("trans_id", transId)
          .eq("api_type", "set_userinfo");
        if (error) console.error("[webhook] set_userinfo update error:", error);
        break;
      }

      case "delete_userinfo": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        const statusVal = d.status === "1" ? "success" : "failed";
        await supabase
          .from("api_logs")
          .update({
            status: statusVal,
            updated_at: new Date().toISOString(),
          })
          .eq("trans_id", transId);

        await supabase.from("command_logs").insert({
          cloud_id: cloudId,
          trans_id: transId,
          command_type: "delete_userinfo",
          response_body: body,
          status: statusVal,
        });
        break;
      }

      case "get_all_pin": {
        const pins = Array.isArray(data) ? data : data ? [data] : [];
        console.log("[webhook] get_all_pin received", pins.length, "pins");
        for (const item of pins) {
          const { error } = await supabase.from("device_pins").upsert(
            {
              cloud_id: cloudId,
              pin: item.pin,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "cloud_id,pin" }
          );
          if (error) console.error("[webhook] get_all_pin upsert error:", error);
        }
        break;
      }

      case "set_time": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        await supabase.from("command_logs").insert({
          cloud_id: cloudId,
          trans_id: transId,
          command_type: "set_time",
          response_body: body,
          status: d.status === "1" ? "success" : "failed",
        });
        break;
      }

      case "register_online": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        await supabase.from("command_logs").insert({
          cloud_id: cloudId,
          trans_id: transId,
          command_type: "register_online",
          response_body: body,
          status: d.status === "1" ? "success" : "failed",
        });
        break;
      }

      case "restart_device": {
        if (!data) break;
        const d = data as Record<string, unknown>;
        await supabase.from("command_logs").insert({
          cloud_id: cloudId,
          trans_id: transId,
          command_type: "restart_device",
          response_body: body,
          status: d.status === "1" ? "success" : "failed",
        });
        break;
      }

      default:
        console.log("[webhook] Unknown type:", body.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[webhook] Fatal error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
