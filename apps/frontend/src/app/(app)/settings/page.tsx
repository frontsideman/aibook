import { Button } from '@/components/ui/button';
import SettingsPanel from '@/components/settings/SettingsPanel';
import SettingsStaticField from '@/components/settings/SettingsStaticField';
import SettingsToggleRow from '@/components/settings/SettingsToggleRow';
import {
  accountFields,
  billingContent,
  dangerZoneContent,
  notificationRows,
  subscriptionContent,
} from '@/components/settings/settings-content';

function StaticAction({ label, tone = 'default' }: { label: string; tone?: 'default' | 'danger' }) {
  const toneClasses =
    tone === 'danger'
      ? 'border-destructive/25 bg-destructive/8 text-destructive'
      : 'border-border bg-background text-muted-foreground';

  return (
    <div
      aria-hidden='true'
      className={`inline-flex h-[40px] items-center justify-center rounded-[10px] border px-[14px] text-sm font-medium ${toneClasses}`}
    >
      {label}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className='flex max-w-[1140px] flex-col gap-5 px-1'>
      <header className='space-y-2'>
        <p className='font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-primary'>
          ACCOUNT
        </p>
        <h1 className='font-display text-5xl font-semibold text-foreground'>Settings</h1>
        <p className='text-base text-muted-foreground'>
          Manage subscription, billing, and account preferences.
        </p>
      </header>

      <section className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <SettingsPanel>
          <p className='font-mono text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'>
            {subscriptionContent.label}
          </p>
          <h2 className='mt-2 font-display text-[34px] font-semibold text-foreground'>
            {subscriptionContent.planName}
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>{subscriptionContent.detail}</p>
        </SettingsPanel>

        <SettingsPanel title={billingContent.title} description={billingContent.body}>
          <div className='space-y-3'>
            <Button type='button' disabled>
              Manage billing
            </Button>
            <Button type='button' variant='outline' disabled>
              Download invoices
            </Button>
          </div>
        </SettingsPanel>
      </section>

      <SettingsPanel title='Account preferences'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {accountFields.map((field) => (
            <SettingsStaticField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>

        <div className='mt-4 flex items-center justify-end gap-3'>
          <Button type='button' variant='outline' disabled>
            Cancel
          </Button>
          <Button type='button' disabled>
            Save changes
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel title='Notification preferences'>
        <div className='space-y-4'>
          {notificationRows.map((row) => (
            <SettingsToggleRow
              key={row.title}
              title={row.title}
              body={row.body}
              enabled={row.enabled}
            />
          ))}
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={dangerZoneContent.title}
        tone='danger'
        description={dangerZoneContent.body}
      >
        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-3'>
            <Button type='button' variant='destructive' disabled>
              Delete account
            </Button>
          </div>

          <div className='rounded-[14px] border border-destructive/60 bg-card p-4'>
            <p className='text-sm font-extrabold text-destructive'>
              {dangerZoneContent.confirmationTitle}
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              {dangerZoneContent.confirmationBody}
            </p>
            <input
              type='text'
              aria-label='Confirm account deletion'
              className='mt-3 h-9 w-full rounded-[9px] border border-input bg-input-bg px-3 text-sm text-foreground opacity-80 outline-none disabled:cursor-not-allowed disabled:opacity-80'
              disabled
              readOnly
              value={dangerZoneContent.confirmationValue}
            />
            <div className='mt-3 flex justify-end gap-2'>
              <StaticAction label='Cancel' />
              <StaticAction label='Delete' tone='danger' />
            </div>
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}
