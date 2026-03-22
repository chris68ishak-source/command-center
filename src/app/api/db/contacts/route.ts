import { NextRequest, NextResponse } from "next/server";
import { createContact, getContacts, getContactStats, deleteContact } from "@/lib/db/queries";

export async function GET() {
  try {
    const [contacts, stats] = await Promise.all([
      getContacts(),
      getContactStats(),
    ]);
    return NextResponse.json({ success: true, contacts, stats });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Single contact
    if (body.name && body.email) {
      const contact = await createContact({
        name: body.name,
        email: body.email,
        phone: body.phone,
        city: body.city,
        source: body.source || "manual",
        tags: body.tags || "",
      });
      return NextResponse.json({ success: true, contact });
    }

    // Bulk import
    if (body.contacts && Array.isArray(body.contacts)) {
      let imported = 0;
      let failed = 0;
      for (const c of body.contacts) {
        try {
          if (c.name && c.email) {
            await createContact({
              name: c.name,
              email: c.email,
              phone: c.phone,
              city: c.city,
              source: c.source || "import",
              tags: c.tags || "",
            });
            imported++;
          }
        } catch {
          failed++;
        }
      }
      return NextResponse.json({ success: true, imported, failed });
    }

    return NextResponse.json({ success: false, error: "Missing name and email" }, { status: 400 });
  } catch (error) {
    console.error("Failed to create contact:", error);
    return NextResponse.json({ success: false, error: "Failed to create contact" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    await deleteContact(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact:", error);
    return NextResponse.json({ success: false, error: "Failed to delete contact" }, { status: 500 });
  }
}
