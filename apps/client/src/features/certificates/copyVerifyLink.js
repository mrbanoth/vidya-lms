import { toast } from "sonner";

export async function copyVerifyLink(code) {
  const url = `${window.location.origin}/verify/${code}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Verify link copied");
  } catch {
    toast(url);
  }
}
