import { redirect } from "next/navigation";

interface LegacyBlipDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyItemDetailPage({
  params,
}: LegacyBlipDetailPageProps): Promise<never> {
  const { id } = await params;
  redirect(`/blips/${id}`);
}
