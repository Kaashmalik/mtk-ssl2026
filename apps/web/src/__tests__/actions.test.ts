import { vi, describe, it, expect, beforeEach } from "vitest";
import { createTenant, getMyTenant } from "../app/actions/tenants";
import { createPlayer } from "../app/actions/players";
import { createMatch } from "../app/actions/matches";
import { auth } from "@clerk/nextjs/server";
import { db } from "@mtk/database";

const MOCK_TENANT_ID = "da7c0ab5-0810-482a-a92c-886a87754b2d";
const MOCK_TEAM_A_ID = "da7c0ab5-0810-482a-a92c-886a87754b2e";
const MOCK_TEAM_B_ID = "da7c0ab5-0810-482a-a92c-886a87754b2f";

// Mock @clerk/nextjs/server
vi.mock("@clerk/nextjs/server", () => {
  return {
    auth: vi.fn().mockImplementation(async () => ({
      userId: "mock-user-123",
    })),
  };
});

// Mock @mtk/database
vi.mock("@mtk/database", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => []),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => []),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return {
    db: mockDb,
    tenants: { id: "tenants_id", ownerId: "owner_id", slug: "slug" },
    tenantBranding: { id: "tenant_branding_id" },
    players: { id: "players_id", tenantId: "tenant_id", name: "name" },
    teams: { id: "teams_id", tenantId: "tenant_id", name: "name" },
    matches: { id: "matches_id", tenantId: "tenant_id" },
  };
});

// Mock next/cache
vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
  };
});

// Mock rbac-server to bypass the auth checks or return mock values
vi.mock("../lib/rbac-server", () => {
  return {
    requirePermissionServer: vi.fn().mockImplementation(async () => {}),
    resolveActiveTenantId: vi.fn().mockImplementation(async () => MOCK_TENANT_ID),
  };
});

describe("Server Actions Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tenants Action - getMyTenant", () => {
    it("should return null if user is not authenticated", async () => {
      // Mock auth to return no userId
      vi.mocked(auth).mockImplementationOnce(async () => ({} as any));

      const tenant = await getMyTenant();
      expect(tenant).toBeNull();
    });

    it("should fetch tenant for the logged-in user", async () => {
      const mockTenant = { id: MOCK_TENANT_ID, ownerId: "mock-user-123" };
      vi.mocked((db as any).limit).mockReturnValueOnce([mockTenant] as any);

      const tenant = await getMyTenant();
      expect(tenant).toEqual(mockTenant);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("Tenants Action - createTenant", () => {
    it("should throw error if user is unauthorized", async () => {
      vi.mocked(auth).mockImplementationOnce(async () => ({} as any));

      await expect(
        createTenant({ name: "My League", slug: "my-league" })
      ).rejects.toThrow("Unauthorized");
    });

    it("should successfully insert a new tenant when valid input is passed", async () => {
      // Stub check for existing tenant: return empty array (doesn't exist)
      // Stub check for slugTaken: return empty array (not taken)
      vi.mocked((db as any).limit)
        .mockReturnValueOnce([]) // existing check
        .mockReturnValueOnce([]); // slugTaken check

      const mockNewTenant = { id: MOCK_TENANT_ID, name: "My League", slug: "my-league" };
      vi.mocked(db.insert(null as any).values(null as any).returning).mockReturnValueOnce([mockNewTenant] as any);

      const response = await createTenant({ name: "My League", slug: "my-league" });
      expect(response.success).toBe(true);
      expect(response.tenant).toEqual(mockNewTenant);
    });
  });

  describe("Players Action - createPlayer", () => {
    it("should create a player successfully with valid permissions and tenant metadata", async () => {
      const mockTenant = { id: MOCK_TENANT_ID, name: "Test Tenant" };
      
      // Stub requireTenant check
      vi.mocked((db as any).limit).mockReturnValueOnce([mockTenant] as any);

      const mockNewPlayer = { id: "player-123", name: "John Doe", tenantId: MOCK_TENANT_ID };
      vi.mocked(db.insert(null as any).values(null as any).returning).mockReturnValueOnce([mockNewPlayer] as any);

      const response = await createPlayer({
        name: "John Doe",
        tenantId: MOCK_TENANT_ID,
        role: "batsman",
        battingStyle: "right",
      });

      expect(response.success).toBe(true);
      expect(response.player).toEqual(mockNewPlayer);
    });
  });

  describe("Matches Action - createMatch", () => {
    it("should create a match successfully under active tenant context", async () => {
      const mockTenant = { id: MOCK_TENANT_ID, name: "Test Tenant" };
      const mockTeamA = { id: MOCK_TEAM_A_ID, name: "Team A", tenantId: MOCK_TENANT_ID };
      const mockTeamB = { id: MOCK_TEAM_B_ID, name: "Team B", tenantId: MOCK_TENANT_ID };
      
      // Stub db selects: 1st for tenant in requireTenant(), 2nd for teamA, 3rd for teamB
      vi.mocked((db as any).limit)
        .mockReturnValueOnce([mockTenant] as any)
        .mockReturnValueOnce([mockTeamA] as any)
        .mockReturnValueOnce([mockTeamB] as any);

      const mockNewMatch = { id: "match-123", tenantId: MOCK_TENANT_ID, teamAId: MOCK_TEAM_A_ID, teamBId: MOCK_TEAM_B_ID };
      vi.mocked(db.insert(null as any).values(null as any).returning).mockReturnValueOnce([mockNewMatch] as any);

      const response = await createMatch({
        teamAId: MOCK_TEAM_A_ID,
        teamBId: MOCK_TEAM_B_ID,
        scheduledDate: new Date().toISOString(),
        matchFormat: "t20",
        matchType: "group",
        totalOvers: 20,
      });

      expect(response.success).toBe(true);
      expect(response.match).toEqual(mockNewMatch);
    });
  });
});
