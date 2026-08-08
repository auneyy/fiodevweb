import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function updateApiLog(
  matchField: string,
  matchValue: string,
  newStatus: string,
  supabaseUrl: string,
  serviceKey: string
): Promise<boolean> {
  try {
    const url = `${supabaseUrl}/rest/v1/api_logs?${matchField}=eq.${encodeURIComponent(matchValue)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    console.log(`[fingerspot] PATCH api_logs (${matchField}=${matchValue}): status=${res.status}, rows=`, JSON.stringify(data).substring(0, 200));
    return res.ok;
  } catch (err) {
    console.error(`[fingerspot] PATCH api_logs failed:`, err);
    return false;
  }
}

interface FingerspotResponse {
  success: boolean;
  data: unknown;
  message: string;
  transId: string;
}

export async function callFingerspot(
  endpoint: string,
  body: Record<string, unknown>,
  credentials?: { apiKey: string; cloudId: string }
): Promise<FingerspotResponse> {
  const transId = Date.now().toString();
  const supabase = getSupabase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  let apiKey = credentials?.apiKey || "";
  let cloudId = credentials?.cloudId || "";

  if (!apiKey || !cloudId) {
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["api_key", "cloud_id"]);
    apiKey = apiKey || settings?.find((s) => s.key === "api_key")?.value || "";
    cloudId = cloudId || settings?.find((s) => s.key === "cloud_id")?.value || "";
  }

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

  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/api_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        cloud_id: cloudId,
        trans_id: transId,
        api_type: endpoint,
        request_body: fullBody,
        status: "pending",
      }),
    });
    const insertData = await insertRes.json();
    console.log(`[fingerspot] INSERT api_logs: status=${insertRes.status}, data=`, JSON.stringify(insertData).substring(0, 200));
  } catch (e) {
    console.error("[fingerspot] INSERT api_logs failed:", e);
  }

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

    const newStatus = result.success ? "success" : "failed";
    await updateApiLog("trans_id", transId, newStatus, supabaseUrl, serviceKey);

    return {
      success: result.success,
      data: result.data,
      message: result.message || "",
      transId,
    };
  } catch (error) {
    console.error(`[fingerspot] Fetch error:`, error);
    await updateApiLog("trans_id", transId, "failed", supabaseUrl, serviceKey);

    return {
      success: false,
      data: null,
      message: (error as Error).message,
      transId,
    };
  }
}
