import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { errorMessage, post } from "@/lib/api";
import { startSession } from "./session";
import { homeFor } from "@/store/auth";

/** Rendered only when VITE_GOOGLE_CLIENT_ID is set. */
export default function GoogleButton({ next }) {
  const navigate = useNavigate();
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;
  return (
    <>
      <div className="flex justify-center">
        <GoogleLogin
          width="360"
          text="continue_with"
          shape="pill"
          onSuccess={async ({ credential }) => {
            try {
              const res = await post("/auth/google", { credential });
              await startSession(res.data);
              navigate(next || homeFor(res.data.user.role), { replace: true });
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
          onError={() => toast.error("Google sign-in was cancelled")}
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or</div>
    </>
  );
}
