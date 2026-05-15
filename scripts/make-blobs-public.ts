import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function isRemoteUrl(storagePath: string) {
  return storagePath.startsWith("https://") || storagePath.startsWith("http://");
}

function isPrivateUrl(url: string) {
  return url.includes(".private.blob.vercel-storage.com");
}

async function main() {
  const docs = await prisma.regulationDocument.findMany({
    select: { id: true, fileName: true, storagePath: true, regulationId: true, mimeType: true },
  });

  const privateDocs = docs.filter((d) => isRemoteUrl(d.storagePath) && isPrivateUrl(d.storagePath));
  const publicDocs = docs.filter((d) => isRemoteUrl(d.storagePath) && !isPrivateUrl(d.storagePath));
  console.log(`Found ${privateDocs.length} private blobs, ${publicDocs.length} already public, ${docs.length - privateDocs.length - publicDocs.length} local.`);

  for (const doc of privateDocs) {
    console.log(`  Fetching ${doc.fileName} from private blob...`);
    const res = await fetch(doc.storagePath, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) {
      console.warn(`  SKIP ${doc.fileName} — fetch failed: ${res.status}`);
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`  Re-uploading as public (${(buffer.length / 1024).toFixed(0)} KB)...`);

    const blob = await put(
      `regulations/${doc.regulationId}/${doc.fileName}`,
      buffer,
      { access: "public", contentType: doc.mimeType, addRandomSuffix: false, allowOverwrite: true }
    );

    await prisma.regulationDocument.update({
      where: { id: doc.id },
      data: { storagePath: blob.url },
    });

    console.log(`  ✓ ${doc.fileName} → ${blob.url}`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
