import { NextResponse } from "next/server";

import { getInquiryRecordsWithStatus, localJsonStorageWarning } from "@/lib/inquiryStore";

export const runtime = "nodejs";

export async function GET() {
  // 注意：当前接口仅用于本地 MVP 演示。正式部署前必须增加登录鉴权和访问权限控制。
  try {
    const { records, storageMode, warning } = await getInquiryRecordsWithStatus();

    return NextResponse.json({
      records,
      storageMode,
      ...(warning ? { warning } : {})
    });
  } catch (error) {
    console.error("Failed to return inquiry records:", error);

    return NextResponse.json({
      records: [],
      storageMode: "local-json",
      warning: localJsonStorageWarning
    });
  }
}
