// Static recreations of the app's main screens (app-demo/src/app/(app)), used as
// illustrations. They follow the app's layout and tokens; the people are made up.
import { ChevronLeft, CheckIcon, CommentIcon, HomeIcon, SendIcon, SettingsIcon, UserIcon, XIcon } from "@/components/ui/icons";
import { TagPill } from "@/components/ui/TagPill";

const TINTS = {
  teal: { card: "bg-accent", blobA: "bg-green-soft/40", blobB: "bg-mustard" },
  deep: { card: "bg-green", blobA: "bg-accent", blobB: "bg-green-soft/30" },
  amber: { card: "bg-mustard", blobA: "bg-mustard-soft/60", blobB: "bg-accent/80" },
} as const;

function AppBar({ active }: { active: "Discover" | "Inbox" | "Matches" }) {
  return (
    <div className="px-3">
      <p className="px-1 pt-1 font-serif text-lg font-semibold tracking-tight">
        side<span className="text-accent">kick</span>
      </p>
      <div className="mt-2 grid grid-cols-3 rounded-full bg-surface p-1 text-center text-[10.5px] font-semibold text-ink-soft shadow-card">
        {(["Discover", "Inbox", "Matches"] as const).map((tab) => (
          <span key={tab} className={`rounded-full py-1.5 ${tab === active ? "bg-green-soft text-green" : ""}`}>
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
}

function TabBar() {
  return (
    <div className="mt-auto grid grid-cols-3 border-t border-line bg-surface pt-2 pb-4 text-center text-[9.5px] font-semibold text-ink-soft">
      <span className="flex flex-col items-center gap-0.5 text-green">
        <HomeIcon className="size-4" /> Home
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <UserIcon className="size-4" /> Profile
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <SettingsIcon className="size-4" /> Settings
      </span>
    </div>
  );
}

export type DiscoverProfile = {
  name: string;
  age: number;
  program: string;
  emoji: string;
  tint: keyof typeof TINTS;
  tags: { label: string; shared?: boolean }[];
  prompt: { question: string; answer: string };
};

export function DiscoverScreen({ profile }: { profile: DiscoverProfile }) {
  const tint = TINTS[profile.tint];
  return (
    <>
      <AppBar active="Discover" />
      {/* The photo fills whatever height is left, so the prompt and buttons fit on every phone size. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pt-3 pb-2">
        <div className={`relative min-h-0 flex-1 overflow-hidden rounded-3xl ${tint.card}`}>
          <div className={`absolute -top-10 -left-12 size-44 rounded-full ${tint.blobA}`} />
          <div className={`absolute -right-8 bottom-14 size-32 rounded-full ${tint.blobB}`} />
          <span className="absolute inset-0 grid place-items-center pb-12 text-[4rem]">{profile.emoji}</span>
          <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-surface text-green shadow-card">
            <CommentIcon className="size-4" />
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent px-4 pt-10 pb-3 text-white">
            <p className="font-serif text-2xl font-semibold">
              {profile.name}, <span className="font-normal">{profile.age}</span>
            </p>
            <p className="text-[11px] text-white/90">{profile.program}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 overflow-hidden text-[10.5px] [&_.pill]:shrink-0 [&_.pill]:px-2 [&_.pill]:py-1 [&_.pill]:text-[10.5px]">
          {profile.tags.map((tag) => (
            <TagPill key={tag.label} highlighted={tag.shared}>
              {tag.label}
            </TagPill>
          ))}
        </div>
        <div className="shrink-0 rounded-3xl bg-green-soft px-4 py-3">
          <p className="text-[9.5px] font-semibold tracking-wide text-green uppercase">{profile.prompt.question}</p>
          <p className="mt-1 line-clamp-2 font-serif text-[14px] leading-snug text-ink">{profile.prompt.answer}</p>
        </div>
        <div className="flex shrink-0 justify-center gap-3 pt-1">
          <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-card">
            <XIcon className="size-5" />
          </span>
          <span className="flex h-11 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgb(15_118_110/0.4)]">
            <CheckIcon className="size-4" /> Friend
          </span>
        </div>
      </div>
      <TabBar />
    </>
  );
}

const INBOX = [
  { name: "Jordan", avatar: "🏀", tint: "bg-green-soft", time: "2m", text: "Okay the library-as-a-café thing is so real. Which floor?", on: "“A perfect study break”", unread: true },
  { name: "Priya", avatar: "🎲", tint: "bg-mustard-soft", time: "1h", text: "Board game night this Friday? We need a fourth.", on: "🎲 Board games", unread: true },
  { name: "Liam", avatar: "🥾", tint: "bg-line", time: "3h", text: "Wait, where was your hiking photo taken??", on: "Photo", unread: false },
];

export function InboxScreen() {
  return (
    <>
      <AppBar active="Inbox" />
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 pt-3">
        <p className="px-1 text-[10.5px] leading-snug text-ink-soft">People who reached out. Reply to become friends, or dismiss. They won’t be told.</p>
        {INBOX.map((item) => (
          <div key={item.name} className="flex gap-2.5 rounded-2xl bg-surface p-3 shadow-card">
            <span className="relative shrink-0">
              <span className={`grid size-10 place-items-center rounded-full text-lg ${item.tint}`}>{item.avatar}</span>
              {item.unread && <span className="absolute top-0 right-0 size-3 rounded-full border-2 border-surface bg-accent" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className={`font-serif text-[15px] ${item.unread ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                <span className="text-[9.5px] text-ink-soft">{item.time}</span>
              </span>
              <span className="block text-[11.5px] leading-snug text-ink">“{item.text}”</span>
              <span className="mt-1 block truncate text-[9.5px] text-ink-soft">
                on <span className="font-semibold text-green">{item.on}</span>
              </span>
            </span>
          </div>
        ))}
        <div className="mt-1 flex gap-2 px-1">
          <span className="btn-primary flex-1 py-2 text-xs">Reply to Jordan</span>
          <span className="btn-secondary py-2 text-xs">Dismiss</span>
        </div>
      </div>
      <TabBar />
    </>
  );
}

const MESSAGES = [
  { mine: false, text: "Honestly the 2nd floor of Scott with an iced latte hits different" },
  { mine: true, text: "Study sesh Thursday? I have a stats midterm 😭" },
  { mine: false, text: "Yes!! 2pm by the Scott Library entrance?" },
  { mine: true, text: "Deal. See you there 👋" },
];

export function ChatScreen() {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 pt-1 pb-2.5">
        <ChevronLeft className="size-4 text-ink-soft" />
        <span className="grid size-8 place-items-center rounded-full bg-accent text-sm">☕</span>
        <span className="font-serif text-base font-semibold">Maya</span>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden px-3 pt-3">
        <div className="mx-auto flex flex-col items-center gap-1 rounded-3xl bg-green-soft px-4 py-3 text-center">
          <p className="font-serif text-[15px] font-semibold text-green">You and Maya are now friends</p>
          <p className="text-[9.5px] text-ink-soft">Connected through a comment · Sep 12</p>
          <p className="mt-1 rounded-2xl bg-surface px-2.5 py-1.5 text-[10.5px] text-ink">
            <span className="text-ink-soft">You commented: </span>“Which café is the library pretending to be?”
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          {MESSAGES.map((m) => (
            <div key={m.text} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[80%] rounded-3xl px-3 py-2 text-[11.5px] leading-snug ${
                  m.mine ? "rounded-br-lg bg-accent text-white" : "rounded-bl-lg bg-surface text-ink shadow-card"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-line bg-surface px-3 pt-2.5 pb-5">
        <span className="flex-1 rounded-full border border-line px-3 py-2 text-[11px] text-ink-soft/70">Message Maya…</span>
        <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
          <SendIcon className="size-3.5" />
        </span>
      </div>
    </>
  );
}

export function SignInScreen() {
  return (
    <div className="flex flex-1 flex-col px-5 pt-8 pb-6">
      <p className="font-serif text-2xl font-semibold tracking-tight">
        side<span className="text-accent">kick</span>
      </p>
      <p className="mt-6 font-serif text-[26px] leading-tight font-semibold">
        Check your <span className="text-green italic">York email.</span>
      </p>
      <p className="mt-2 text-[11.5px] leading-snug text-ink-soft">
        We sent a 6-digit code to <span className="font-semibold text-ink">yourname@my.yorku.ca</span>
      </p>
      <p className="mt-6 text-[9.5px] font-semibold tracking-wide text-ink-soft uppercase">Code</p>
      <div className="mt-1.5 grid grid-cols-6 gap-1.5">
        {["4", "8", "2", "9", "", ""].map((digit, i) => (
          <span
            key={i}
            className={`grid aspect-[4/5] place-items-center rounded-xl border bg-surface font-serif text-xl font-semibold ${
              i === 4 ? "border-green ring-2 ring-green/20" : "border-line"
            }`}
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="btn-primary mt-5 py-2.5 text-sm">Verify</span>
      <div className="mt-auto flex items-start gap-2 rounded-2xl bg-green-soft p-3 text-[10.5px] leading-snug text-ink">
        <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-green" />
        Only @my.yorku.ca addresses can join, so everyone you meet is a York student.
      </div>
    </div>
  );
}
