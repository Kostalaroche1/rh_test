import AgentParcoursPage from "@/components/dashboard/agent/fiches/AgentParcoursPage";

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  const agentId = Number(params.id);
  return <AgentParcoursPage agentId={agentId} />;
}

