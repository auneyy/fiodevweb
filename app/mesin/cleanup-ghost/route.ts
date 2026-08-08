import { NextRequest, NextResponse } from "next/server";
import { getRequestUserCredentials } from "@/lib/request-user";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const creds = await getRequestUserCredentials(request.cookies);
    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ghosts, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("cloud_id", creds.cloudId)
      .is("pin", null);

    if (findError) {
      return NextResponse.json({ success: false, message: findError.message }, { status: 500 });
    }

    if (!ghosts || ghosts.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const ghostIds = ghosts.map((g) => g.id);
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .in("id", ghostIds);

    if (deleteError) {
      return NextResponse.json({ success: false, message: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: ghosts.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
