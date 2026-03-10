import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        { ok: false, where: "supabase.storage.listBuckets", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      buckets: (data ?? []).map((b) => ({ id: b.id, name: b.name })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, where: "init", error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

