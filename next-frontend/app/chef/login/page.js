import RoleLoginCard from "../../../components/auth/RoleLoginCard";

export default function ChefLoginPage() {
  return (
    <RoleLoginCard
      roleKey="kitchen"
      title="Chef Login"
      subtitle="Track incoming orders and update status"
      redirectTo="/kitchen"
      helpText="Use your kitchen staff credentials to continue."
    />
  );
}
