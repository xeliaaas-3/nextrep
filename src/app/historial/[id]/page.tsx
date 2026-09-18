import { DetalleSesion } from "@/components/historial/DetalleSesion";

export default async function PaginaDetalleSesion({ params }: PageProps<"/historial/[id]">) {
  const { id } = await params;
  return <DetalleSesion sessionId={id} />;
}
