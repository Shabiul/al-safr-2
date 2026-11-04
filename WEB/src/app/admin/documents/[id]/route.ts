import { currentStaff } from "@/lib/admin-auth";
import { getDocument } from "@/lib/ops";
import { documentLink } from "@/lib/storage";

// Booking documents are private; staff get a fresh 5-minute signed link each time they open one.
export async function GET(_: Request, { params }: RouteContext<"/admin/documents/[id]">) {
  if (!(await currentStaff())) return new Response("Unauthorized", { status: 401 });
  const doc = await getDocument((await params).id);
  if (!doc) return new Response("Not found", { status: 404 });
  return Response.redirect(await documentLink(doc.storagePath), 303);
}
