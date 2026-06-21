export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth";
import { db, tenants } from "@mtk/database";

export async function GET() {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get real tenant counts from DB
    const tenantsList = await db
      .select({
        id: tenants.id,
        plan: tenants.plan,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
      })
      .from(tenants);

    const activeTenants = tenantsList.filter((t) => t.isActive);
    const planPrices: Record<string, number> = { starter: 4999, pro: 14999, enterprise: 49999, free: 0 };

    const mrr = activeTenants.reduce((sum, t) => sum + (planPrices[t.plan] || 0), 0);
    const arr = mrr * 12;

    const revenueByPlan = activeTenants.reduce((acc: Record<string, number>, t) => {
      const plan = t.plan || "free";
      acc[plan] = (acc[plan] || 0) + (planPrices[plan] || 0);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      mrr,
      arr,
      totalRevenue: arr,
      churnRate: 0,
      activeSubscriptions: activeTenants.length,
      totalTenants: tenantsList.length,
      revenueByPlan,
      recentPayments: [],
    });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}


