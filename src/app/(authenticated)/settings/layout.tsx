import { SettingsMobileNav } from "./_components/settings-mobile-nav";

/** Wraps every /settings/* route (root + listings/sync-logs/shareable-links),
 *  matching ContextualSidebar's own gating (showSettingsNav checks the page
 *  id, not the sub-route) - SettingsNavSection shows on all of them on
 *  desktop, so SettingsMobileNav does too below lg. Rendered once here
 *  instead of per-page so a sub-route can't lose the only way back to
 *  another section. */
export default function SettingsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SettingsMobileNav />
      {children}
    </>
  );
}
