// app/dashboard/settings/page.tsx
import ProfileSettings from '@/components/settings/ProfileSettings';
import ProductivitySettings from '@/components/settings/ProductivitySettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <div className="space-y-6">
        <ProfileSettings />
        <ProductivitySettings />
      </div>
    </div>
  );
}