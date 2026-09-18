import { EditorRutina } from "@/components/rutinas/EditorRutina";

export default async function PaginaEditorRutina({ params }: PageProps<"/rutinas/[id]">) {
  const { id } = await params;
  return <EditorRutina routineId={id} />;
}
