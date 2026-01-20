import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { exportToCSV } from "@/lib/exports";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const trendDate = searchParams.get("date");

  if (!trendDate) {
    return NextResponse.json(
      { error: "Missing date parameter" },
      { status: 400 }
    );
  }

  const result = await exportToCSV(supabase, user.id, trendDate);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Return as downloadable CSV file
  return new NextResponse(result.data, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="trendpulse-${trendDate}.csv"`,
    },
  });
}
