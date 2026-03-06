import { redirect } from "next/navigation";

export default function AdminPage(): never {
  redirect("/dashboard");
}
