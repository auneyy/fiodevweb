import { NextRequest, NextResponse } from "next/server";
import { callFingerspot } from "@/lib/fingerspot";
import { getRequestUserCredentials } from "@/lib/request-user";

export async function POST(request: NextRequest) {
  try {
    const { start_date, end_date } = await request.json();

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: "start_date dan end_date wajib diisi" },
        { status: 400 }
      );
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 2) {
      return NextResponse.json(
        { error: "Maksimal rentang tanggal adalah 2 hari" },
        { status: 400 }
      );
    }

    const creds = await getRequestUserCredentials(request.cookies);
    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi atau cloud_id belum diatur" },
        { status: 401 }
      );
    }

    const result = await callFingerspot("get_attlog", { start_date, end_date }, creds);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
