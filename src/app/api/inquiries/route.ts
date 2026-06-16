import { NextResponse } from "next/server";

import { getInquiryRecords } from "@/lib/inquiryStore";

export const runtime = "nodejs";

export async function GET() {
  // 注意：当前接口仅用于本地 MVP 演示。正式部署前必须增加登录鉴权和访问权限控制。
  const records = await getInquiryRecords();

  return NextResponse.json(records);
}
