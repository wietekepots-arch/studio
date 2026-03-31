import { redirect } from "next/navigation";

interface LegacyEditBlipPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyEditItemPage({
  params,
}: LegacyEditBlipPageProps): Promise<never> {
  const { id } = await params;
  redirect(`/blips/${id}/edit`);
}
