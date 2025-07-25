import { getCurrentSession } from "@/lib/auth";
import SetPasswordForm from "./form";

export default async function SetPasswordPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    return <p>로그인이 필요합니다.</p>;
  }

  return <SetPasswordForm email={user.email} />;
}
