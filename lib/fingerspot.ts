import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FingerspotResponse {
  success: boolean;
  data: unknown;
  message: string;
  transId: string;
}

export async function callFingerspot(
  endpoint: string,
  body: Record<string, unknown>
): Promise<FingerspotResponse> {
  const transId = Date.now().toString();

  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["api_key", "cloud_id"]);

  const apiKey = settings?.find((s) => s.key === "api_key")?.value || "";
  const cloudId = settings?.find((s) => s.key === "cloud_id")?.value || "";

  console.log(`[fingerspot] endpoint=${endpoint}, apiKey=${apiKey ? apiKey.substring(0, 10) + "..." : "EMPTY"}, cloudId=${cloudId || "EMPTY"}`);

  if (!apiKey || !cloudId) {
    console.error("[fingerspot] api_key or cloud_id is empty!");
    return {
      success: false,
      data: null,
      message: "API Key atau Cloud ID belum dikonfigurasi",
      transId,
    };
  }

  const fullBody = { ...body, trans_id: transId, cloud_id: cloudId };

  const { data: logData } = await supabase
    .from("api_logs")
    .insert({
      cloud_id: cloudId,
      trans_id: transId,
      api_type: endpoint,
      request_body: fullBody,
      status: "pending",
    })
    .select("id")
    .single();

  try {
    const url = `https://developer.fingerspot.io/api/${endpoint}`;
    console.log(`[fingerspot] POST ${url}`, JSON.stringify(fullBody));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(fullBody),
    });

    const result = await response.json();
    console.log(`[fingerspot] Response status=${response.status}, result=`, JSON.stringify(result).substring(0, 300));

    await supabase
      .from("api_logs")
      .update({
        status: result.success ? "success" : "failed",
        response_body: result,
        status_code: response.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", logData?.id);

    return {
      success: result.success,
      data: result.data,
      message: result.message || "",
      transId,
    };
  } catch (error) {
    console.error(`[fingerspot] Fetch error:`, error);
    await supabase
      .from("api_logs")
      .update({
        status: "failed",
        response_body: { error: (error as Error).message },
        updated_at: new Date().toISOString(),
      })
      .eq("id", logData?.id);

    return {
      success: false,
      data: null,
      message: (error as Error).message,
      transId,
    };
  }
}
