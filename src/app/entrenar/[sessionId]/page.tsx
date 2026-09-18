import { VistaEntrenamiento } from "@/components/entrenamiento/VistaEntrenamiento";

export default async function PaginaEntrenamiento({
  params,
}: PageProps<"/entrenar/[sessionId]">) {
  const { sessionId } = await params;
  return <VistaEntrenamiento sessionId={sessionId} />;
}
