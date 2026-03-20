import RoleLoginCard from "../../../components/auth/RoleLoginCard";

export default function WaiterLoginPage() {
  return (
    <RoleLoginCard
      roleKey="staff"
      title="Waiter Login"
      subtitle="Handle table service and guest updates"
      redirectTo="/waiter"
      helpText="Use your staff account to access the waiter dashboard."
    />
  );
}
