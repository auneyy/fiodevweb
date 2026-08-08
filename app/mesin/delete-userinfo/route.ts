import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCredentials } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { pin, id } = await request.json();

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

    if (pin) {
      const result = await callFingerspot("delete_userinfo", { pin }, creds);

      if (result.success) {
        await supabase
          .from("users")
          .delete()
          .eq("cloud_id", creds.cloudId)
          .eq("pin", pin);
      }

      return NextResponse.json(result);
    }

    if (id) {
      await supabase
        .from("users")
        .delete()
        .eq("cloud_id", creds.cloudId)
        .eq("id", id);

      return NextResponse.json({ success: true, message: "User ghost berhasil dihapus dari database" });
    }

    return NextResponse.json(
      { success: false, message: "Parameter tidak valid: pin atau id harus diberikan" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
