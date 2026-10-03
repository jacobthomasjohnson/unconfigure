import Header from "@/components/Header";
import { ADMIN_ACCESS } from "@/lib/adminGames";

import AdminState from "./AdminState";

export default function AdminAccessState({ access }) {
  if (access.status === ADMIN_ACCESS.SIGNED_OUT) {
    return (
      <>
        <Header />
        <AdminState title="Administrator sign-in required">
          Sign in from the main game, then return to this page.
        </AdminState>
      </>
    );
  }

  if (access.status === ADMIN_ACCESS.UNAUTHORIZED) {
    return (
      <>
        <Header />
        <AdminState title="Access denied">
          Your account does not have permission to manage daily games.
        </AdminState>
      </>
    );
  }

  return (
    <>
      <Header />
      <AdminState title="Administration unavailable">
        Administrator access could not be verified. Please try again.
      </AdminState>
    </>
  );
}
