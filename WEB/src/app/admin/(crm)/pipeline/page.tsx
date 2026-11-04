import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { listLeads } from "@/lib/crm";
import { Loading, PageHead } from "../../ui";
import Board from "./Board";

export default function PipelinePage() {
  return (
    <>
      <PageHead title="Pipeline" sub="Drag a card to move the lead to another stage." />
      <Suspense fallback={<Loading />}>
        <Leads />
      </Suspense>
    </>
  );
}

async function Leads() {
  await requireAdmin();
  return <Board leads={await listLeads()} />;
}
