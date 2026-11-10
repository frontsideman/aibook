export default function NotificationsPage() {
  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-4'>
      <header className='space-y-2'>
        <p className='font-mono text-xs font-extrabold uppercase tracking-[0.12em] text-primary'>
          UPDATES
        </p>
        <h1 className='font-display text-[42px] font-semibold text-foreground'>Notifications</h1>
        <p className='text-base text-muted-foreground'>
          Generation and review updates will appear here.
        </p>
      </header>
      <div className='paper-card rounded-[18px] p-8 text-center'>
        <p className='font-display text-[24px] font-semibold text-foreground'>
          No notifications yet
        </p>
        <p className='mt-2 text-sm text-muted-foreground'>
          You will see a notification when a book is ready to review.
        </p>
      </div>
    </div>
  );
}
