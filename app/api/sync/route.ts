import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FIELD_MAP,
  TRACKED_SHEETS,
  parseSheetDate,
  shouldSkipStatus,
  splitNames,
  stripBracketedText,
} from "@/lib/sync";

// Matches the shape Code.gs posts: the whole edited row, keyed by header
// name, plus which tab/row it came from. See scripts/apps-script/Code.gs.
type SyncPayload = {
  tab: string;
  rowRef: string;
  row: Record<string, unknown>;
  editedAt: string;
};

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.SYNC_WEBHOOK_SECRET;
  const provided = req.headers.get("x-sync-secret");
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

async function upsertAssignments(
  projectId: string,
  roleOnProject: "PM" | "QA",
  names: string[],
) {
  const people = await Promise.all(
    names.map(async (name) => {
      const existing = await prisma.person.findFirst({ where: { name } });
      return existing ?? prisma.person.create({ data: { name } });
    }),
  );

  const currentPersonIds = people.map((p) => p.id);

  // Reconcile: drop assignments for this role that are no longer in the
  // sheet's current value, then ensure the current ones exist.
  await prisma.assignment.deleteMany({
    where: {
      projectId,
      roleOnProject,
      personId: { notIn: currentPersonIds.length ? currentPersonIds : [""] },
    },
  });

  for (const personId of currentPersonIds) {
    await prisma.assignment.upsert({
      where: { projectId_personId_roleOnProject: { projectId, personId, roleOnProject } },
      create: { projectId, personId, roleOnProject },
      update: {},
    });
  }
}

async function upsertPeriod(
  projectId: string,
  phase: "UAT" | "LIVE",
  startDate: Date | null,
  endDate: Date | null,
) {
  if (startDate === null && endDate === null) return;

  const existing = await prisma.period.findUnique({
    where: { projectId_phase: { projectId, phase } },
  });

  // Critical override rule (docs/data-model.md): never let an incoming
  // sheet sync clobber a site-made edit to the same period.
  if (existing?.source === "site_override") return;

  await prisma.period.upsert({
    where: { projectId_phase: { projectId, phase } },
    create: { projectId, phase, startDate, endDate, source: "sheet" },
    update: { startDate, endDate, source: "sheet" },
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: SyncPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { tab, rowRef, row } = payload;
  if (!tab || !rowRef || !row) {
    return NextResponse.json({ error: "missing tab/rowRef/row" }, { status: 400 });
  }
  if (!TRACKED_SHEETS.includes(tab as (typeof TRACKED_SHEETS)[number])) {
    return NextResponse.json({ ok: true, skipped: true, reason: "untracked-tab" });
  }

  const rawStatus = row[FIELD_MAP.status];
  if (shouldSkipStatus(typeof rawStatus === "string" ? rawStatus : null)) {
    return NextResponse.json({ ok: true, skipped: true, reason: "stale-live-status" });
  }

  const rawTitle = row[FIELD_MAP.title];
  const title = stripBracketedText(typeof rawTitle === "string" ? rawTitle : "");
  if (!title) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no-title" });
  }

  const priority = (row[FIELD_MAP.priority] as string) || null;
  const remark = (row[FIELD_MAP.remark] as string) || null;

  const project = await prisma.project.upsert({
    where: { sheetRowRef: rowRef },
    create: {
      title,
      category: tab,
      priority,
      remark,
      createdFrom: "sheet",
      sheetRowRef: rowRef,
    },
    update: { title, category: tab, priority, remark },
  });

  await upsertPeriod(
    project.id,
    "UAT",
    parseSheetDate(row[FIELD_MAP.uatStart]),
    parseSheetDate(row[FIELD_MAP.uatEnd]),
  );
  await upsertPeriod(
    project.id,
    "LIVE",
    parseSheetDate(row[FIELD_MAP.liveStart]),
    parseSheetDate(row[FIELD_MAP.liveEnd]),
  );

  await upsertAssignments(project.id, "PM", splitNames(row[FIELD_MAP.pm]));
  await upsertAssignments(project.id, "QA", splitNames(row[FIELD_MAP.qa]));

  return NextResponse.json({ ok: true, projectId: project.id });
}
