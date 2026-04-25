import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const estimate = await prisma.estimate.findFirst({
    where: { id: params.id, createdById: session.user.id },
    include: {
      scopeItems: { orderBy: { sortOrder: "asc" } },
      roleEstimates: true,
      risks: true,
      assumptions: true,
      rateCard: { include: { roles: true } },
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const format = request.nextUrl.searchParams.get("format");

  if (format === "excel") {
    return generateExcel(estimate);
  } else if (format === "word") {
    return generateWord(estimate);
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}

type EstimateWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.estimate.findFirst<{
    include: {
      scopeItems: { orderBy: { sortOrder: "asc" } };
      roleEstimates: true;
      risks: true;
      assumptions: true;
      rateCard: { include: { roles: true } };
    };
  }>>>
>;

function formatCost(value: number | null, currency: string): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

async function generateExcel(estimate: EstimateWithRelations) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EstimateOS";

  // Summary sheet
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 40 },
  ];
  summary.addRows([
    { field: "Project Name", value: estimate.projectName },
    { field: "Client", value: estimate.clientName },
    { field: "Estimate Type", value: estimate.estimateType },
    { field: "Currency", value: estimate.currency },
    { field: "Confidence", value: estimate.confidenceLevel ?? "Not calculated" },
    { field: "Status", value: estimate.status },
    { field: "Version", value: estimate.version },
    { field: "", value: "" },
    { field: "Low Estimate (days)", value: estimate.totalLowDays?.toFixed(0) ?? "-" },
    { field: "Likely Estimate (days)", value: estimate.totalLikelyDays?.toFixed(0) ?? "-" },
    { field: "High Estimate (days)", value: estimate.totalHighDays?.toFixed(0) ?? "-" },
    { field: "Low Cost", value: formatCost(estimate.totalLowCost, estimate.currency) },
    { field: "Likely Cost", value: formatCost(estimate.totalLikelyCost, estimate.currency) },
    { field: "High Cost", value: formatCost(estimate.totalHighCost, estimate.currency) },
  ]);
  summary.getRow(1).font = { bold: true };

  // Scope items sheet
  const scope = workbook.addWorksheet("Scope Items");
  scope.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Description", key: "description", width: 40 },
    { header: "Category", key: "category", width: 15 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Complexity", key: "complexity", width: 12 },
    { header: "Driver", key: "effortDriver", width: 15 },
    { header: "Low (days)", key: "lowEffort", width: 12 },
    { header: "Likely (days)", key: "likelyEffort", width: 12 },
    { header: "High (days)", key: "highEffort", width: 12 },
  ];
  for (const item of estimate.scopeItems) {
    scope.addRow({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      priority: item.priority,
      complexity: item.complexity,
      effortDriver: item.effortDriver ?? "",
      lowEffort: item.lowEffort,
      likelyEffort: item.likelyEffort,
      highEffort: item.highEffort,
    });
  }
  scope.getRow(1).font = { bold: true };

  // Role estimates sheet
  const roles = workbook.addWorksheet("Role Breakdown");
  roles.columns = [
    { header: "Role", key: "role", width: 25 },
    { header: "Days", key: "days", width: 10 },
    { header: "Day Rate", key: "rate", width: 15 },
    { header: "Cost", key: "cost", width: 15 },
    { header: "Phase", key: "phase", width: 15 },
    { header: "Workstream", key: "workstream", width: 20 },
  ];
  for (const re of estimate.roleEstimates) {
    roles.addRow({
      role: re.role,
      days: re.days,
      rate: re.rate,
      cost: re.cost,
      phase: re.phase ?? "",
      workstream: re.workstream ?? "",
    });
  }
  roles.getRow(1).font = { bold: true };

  // Risks sheet
  const risksSheet = workbook.addWorksheet("Risks");
  risksSheet.columns = [
    { header: "Description", key: "description", width: 50 },
    { header: "Impact", key: "impact", width: 12 },
    { header: "Likelihood", key: "likelihood", width: 12 },
    { header: "Mitigation", key: "mitigation", width: 40 },
  ];
  for (const risk of estimate.risks) {
    risksSheet.addRow({
      description: risk.description,
      impact: risk.impact,
      likelihood: risk.likelihood,
      mitigation: risk.mitigation ?? "",
    });
  }
  risksSheet.getRow(1).font = { bold: true };

  // Assumptions sheet
  const assumptionsSheet = workbook.addWorksheet("Assumptions");
  assumptionsSheet.columns = [
    { header: "Assumption", key: "description", width: 80 },
    { header: "Status", key: "status", width: 15 },
  ];
  for (const a of estimate.assumptions) {
    assumptionsSheet.addRow({ description: a.description, status: a.status });
  }
  assumptionsSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${estimate.projectName.replace(/\s+/g, "_")}_Estimate.xlsx"`,
    },
  });
}

async function generateWord(estimate: EstimateWithRelations) {
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  } as const;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Project Estimate Summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ text: `Project: ${estimate.projectName}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Client: ${estimate.clientName}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Estimate Type: ${estimate.estimateType}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Confidence: ${estimate.confidenceLevel ?? "Not calculated"}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Currency: ${estimate.currency}`, spacing: { after: 200 } }),

          new Paragraph({
            text: "Estimated Cost",
            heading: HeadingLevel.HEADING_2,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "", alignment: AlignmentType.CENTER })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: "Low", alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Low", bold: true })] })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: "Likely", alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Likely", bold: true })] })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: "High", alignment: AlignmentType.CENTER, children: [new TextRun({ text: "High", bold: true })] })], borders: noBorder }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Effort (days)")], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: estimate.totalLowDays?.toFixed(0) ?? "-", alignment: AlignmentType.CENTER })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: estimate.totalLikelyDays?.toFixed(0) ?? "-", alignment: AlignmentType.CENTER })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: estimate.totalHighDays?.toFixed(0) ?? "-", alignment: AlignmentType.CENTER })], borders: noBorder }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Cost")], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: formatCost(estimate.totalLowCost, estimate.currency), alignment: AlignmentType.CENTER })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: formatCost(estimate.totalLikelyCost, estimate.currency), alignment: AlignmentType.CENTER })], borders: noBorder }),
                  new TableCell({ children: [new Paragraph({ text: formatCost(estimate.totalHighCost, estimate.currency), alignment: AlignmentType.CENTER })], borders: noBorder }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Recommended Team",
            heading: HeadingLevel.HEADING_2,
          }),
          ...(Array.from(new Set(estimate.roleEstimates.map((r) => r.role))).map(
            (role) => new Paragraph({ text: `- ${role}`, spacing: { after: 50 } }),
          )),

          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Key Assumptions",
            heading: HeadingLevel.HEADING_2,
          }),
          ...estimate.assumptions.map(
            (a) => new Paragraph({ text: `- ${a.description}`, spacing: { after: 50 } }),
          ),

          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Key Risks",
            heading: HeadingLevel.HEADING_2,
          }),
          ...estimate.risks.map(
            (r) =>
              new Paragraph({
                text: `- [${r.impact.toUpperCase()}] ${r.description}`,
                spacing: { after: 50 },
              }),
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${estimate.projectName.replace(/\s+/g, "_")}_Estimate.docx"`,
    },
  });
}
