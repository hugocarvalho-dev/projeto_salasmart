import { Navigate } from "react-router";
import { useAuth } from "./auth";

export function hasManagementRole(user: {
  administrador: boolean;
  teamMemberId: number | null;
}): boolean {
  return user.administrador || user.teamMemberId !== null;
}

export default function RequireAuth({
  children,
  requireManagement = false,
}: {
  children: React.ReactNode;
  requireManagement?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0eeeb]">
        <div className="flex items-center gap-3 text-[#6b6b6b] font-bold">
          <span className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          Verificando acesso…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireManagement && !hasManagementRole(user)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
