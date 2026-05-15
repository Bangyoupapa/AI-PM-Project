import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function isLocalPath(storagePath: string) {
  return !storagePath.startsWith("https://") && !storagePath.startsWith("http://");
}

async function main() {
  const docs = await prisma.regulationDocument.findMany({
    select: { id: true, fileName: true, storagePath: true, regulationId: true, mimeType: true },
  });

  const local = docs.filter((d) => isLocalPath(d.storagePath));
  console.log(`Found ${local.length} local documents to migrate (${docs.length - local.length} already on Blob).`);

  for (const doc of local) {
    // Try the exact storagePath first, then fall back to searching by filename
    let filePath = path.join(process.cwd(), doc.storagePath);
    let buffer: Buffer;

    try {
      buffer = await fs.readFile(filePath);
    } catch {
      // Fallback: search uploads/regulations/ directory tree for the filename
      const uploadsDir = path.join(process.cwd(), "uploads", "regulations");
      const found = await findFile(uploadsDir, doc.fileName);
      if (!found) {
        console.warn(`  SKIP ${doc.fileName} — file not found on disk`);
        continue;
      }
      buffer = await fs.readFile(found);
      filePath = found;
    }

    console.log(`  Uploading ${doc.fileName} (${(buffer.length / 1024).toFixed(0)} KB)...`);

    const blob = await put(
      `regulations/${doc.regulationId}/${doc.fileName}`,
      buffer,
      { access: "private", contentType: doc.mimeType }
    );

    await prisma.regulationDocument.update({
      where: { id: doc.id },
      data: { storagePath: blob.url },
    });

    console.log(`  ✓ ${doc.fileName} → ${blob.url}`);
  }

  console.log("\nMigration complete.");
}

async function findFile(dir: string, name: string): Promise<string | null> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) {
      const found = await findFile(full, name);
      if (found) return found;
    } else if (entry === name) {
      return full;
    }
  }
  return null;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
