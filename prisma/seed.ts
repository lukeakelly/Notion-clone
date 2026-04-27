import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const user = await prisma.user.upsert({
    where: { email: "estimator@estimation-tool.local" },
    update: {},
    create: {
      email: "estimator@estimation-tool.local",
      name: "Estimator",
      role: "editor",
    },
  });

  // Create default rate card
  const existingCard = await prisma.rateCard.findFirst({ where: { isDefault: true } });
  if (!existingCard) {
    await prisma.rateCard.create({
      data: {
        name: "Standard AUD Rate Card",
        description: "Default rate card for Australian delivery",
        currency: "AUD",
        isDefault: true,
        roles: {
          create: [
            { role: "Engagement Lead", standardRate: 2200, costRate: 1400, margin: 36, location: "onshore", seniority: "principal" },
            { role: "Project Manager", standardRate: 1500, costRate: 950, margin: 37, location: "onshore", seniority: "senior" },
            { role: "Business Analyst", standardRate: 1400, costRate: 900, margin: 36, location: "onshore", seniority: "senior" },
            { role: "Solution Architect", standardRate: 1800, costRate: 1200, margin: 33, location: "onshore", seniority: "senior" },
            { role: "UX Designer", standardRate: 1400, costRate: 900, margin: 36, location: "onshore", seniority: "mid" },
            { role: "UI Designer", standardRate: 1300, costRate: 850, margin: 35, location: "onshore", seniority: "mid" },
            { role: "Front End Developer", standardRate: 1300, costRate: 850, margin: 35, location: "onshore", seniority: "mid" },
            { role: "Back End Developer", standardRate: 1400, costRate: 900, margin: 36, location: "onshore", seniority: "mid" },
            { role: "Full Stack Developer", standardRate: 1400, costRate: 900, margin: 36, location: "onshore", seniority: "mid" },
            { role: "AI Engineer", standardRate: 1600, costRate: 1050, margin: 34, location: "onshore", seniority: "senior" },
            { role: "Data Engineer", standardRate: 1500, costRate: 950, margin: 37, location: "onshore", seniority: "mid" },
            { role: "DevOps Engineer", standardRate: 1500, costRate: 950, margin: 37, location: "onshore", seniority: "mid" },
            { role: "QA Analyst", standardRate: 1100, costRate: 700, margin: 36, location: "onshore", seniority: "mid" },
            { role: "Security Specialist", standardRate: 1600, costRate: 1050, margin: 34, location: "onshore", seniority: "senior" },
            { role: "Change Manager", standardRate: 1400, costRate: 900, margin: 36, location: "onshore", seniority: "senior" },
            { role: "Technical Writer", standardRate: 1100, costRate: 700, margin: 36, location: "onshore", seniority: "mid" },
          ],
        },
      },
    });
  }

  // Create sample estimate
  const existingEstimate = await prisma.estimate.findFirst({ where: { createdById: user.id } });
  if (!existingEstimate) {
    const rateCard = await prisma.rateCard.findFirst({ where: { isDefault: true } });
    await prisma.estimate.create({
      data: {
        projectName: "Client Portal MVP",
        clientName: "Acme Corp",
        industry: "Financial Services",
        projectType: "web_application",
        estimateType: "discovery",
        status: "draft",
        currency: "AUD",
        methodology: "agile",
        deliveryModel: "onshore",
        rateCardId: rateCard?.id,
        createdById: user.id,
        requirementsClarity: "partial",
        designMaturity: "wireframes",
        scopeItems: {
          create: [
            { name: "User Registration & Login", description: "User sign up, login, password reset, profile management", category: "frontend", priority: "must", complexity: "medium", effortDriver: "screen", sortOrder: 0 },
            { name: "Dashboard", description: "Summary metrics, recent activity, key KPIs", category: "frontend", priority: "must", complexity: "high", effortDriver: "screen", sortOrder: 1 },
            { name: "Admin Console", description: "User management, system configuration, audit logs", category: "frontend", priority: "should", complexity: "high", effortDriver: "screen", sortOrder: 2 },
            { name: "Authentication API", description: "JWT-based auth with SSO support", category: "backend", priority: "must", complexity: "medium", effortDriver: "api", sortOrder: 3 },
            { name: "User Management API", description: "CRUD operations for users and roles", category: "backend", priority: "must", complexity: "medium", effortDriver: "api", sortOrder: 4 },
            { name: "CRM Integration", description: "Salesforce integration for customer data sync", category: "integration", priority: "should", complexity: "high", effortDriver: "integration", sortOrder: 5 },
            { name: "Payment Integration", description: "Stripe checkout for subscriptions", category: "integration", priority: "must", complexity: "medium", effortDriver: "integration", sortOrder: 6 },
            { name: "Reporting Dashboard", description: "Financial reports and data visualization", category: "frontend", priority: "should", complexity: "high", effortDriver: "report", sortOrder: 7 },
            { name: "Data Model Design", description: "Database schema for users, transactions, products", category: "data", priority: "must", complexity: "medium", effortDriver: "data_model", sortOrder: 8 },
            { name: "Notification System", description: "Email and in-app notifications", category: "backend", priority: "could", complexity: "medium", effortDriver: "workflow", sortOrder: 9 },
          ],
        },
        risks: {
          create: [
            { description: "CRM integration complexity is not yet confirmed", impact: "high", likelihood: "medium" },
            { description: "Data migration scope is unclear", impact: "medium", likelihood: "high" },
            { description: "Security review may affect timeline", impact: "medium", likelihood: "low" },
            { description: "Requirements are still being refined", impact: "high", likelihood: "medium" },
          ],
        },
        assumptions: {
          create: [
            { description: "Client will provide timely access to CRM APIs and documentation" },
            { description: "UX wireframes will be approved before build phase" },
            { description: "Estimate assumes standard business-hours delivery" },
            { description: "One round of UAT defect remediation is included" },
            { description: "Production deployment includes one environment only" },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
