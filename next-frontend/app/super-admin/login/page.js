import RoleLoginCard from "../../../components/auth/RoleLoginCard";

export default function SuperAdminLoginPage() {
  return (
    <RoleLoginCard
      roleKey="super_admin"
      title="Super Admin Login"
      subtitle="Create and manage cafes across locations"
      redirectTo="/super-admin"
      helpText="Only super admin accounts can access this portal."
    />
  );
}
