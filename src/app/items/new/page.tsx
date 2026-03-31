import { redirect } from "next/navigation";

export default function LegacyNewItemPage(): never {
  redirect("/blips/new");
}
