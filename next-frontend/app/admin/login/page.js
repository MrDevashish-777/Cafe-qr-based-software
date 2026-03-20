import RoleLoginCard from "../../../components/auth/RoleLoginCard";

export default function AdminLoginPage() {
  return (
    <RoleLoginCard
      roleKey="cafe_admin"
      title="Admin Login"
      subtitle="Sign in to manage menus and cafe settings"
      redirectTo="/admin/menu"
      helpText="Use your cafe admin credentials to continue."
    />
  );
}
