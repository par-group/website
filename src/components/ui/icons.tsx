type IconProps = { className?: string };

const base = (className = "size-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const CommentIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />
  </svg>
);
export const XIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m5 12 4 4L19 6" />
  </svg>
);
export const WaveIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0 0V5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.2 15a1.5 1.5 0 0 1 2.4-1.8L7 15" />
  </svg>
);
export const ChevronLeft = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
export const SendIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);
export const HomeIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10Z" />
  </svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
export const SettingsIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);
export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const ImageIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

// Website icons, in the same style as the app's.
export const ArrowRightIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const GraduationIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m2 9 10-5 10 5-10 5L2 9Z" />
    <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" />
  </svg>
);
export const UsersIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14a6.5 6.5 0 0 1 3 6" />
  </svg>
);
export const EyeOffIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M10.6 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-2.4 3.4M6.6 6.6C4.3 8 2.7 10.2 2 12c1 2.5 5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
);
export const ShieldIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const PhoneOffIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M3 3l18 18M11 18h2" />
  </svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const FilterIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
  </svg>
);
export const PauseIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 9v6M14 9v6" />
  </svg>
);
export const FlagIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
);
export const MapPinIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const MailIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const ShareIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
  </svg>
);
export const DeviceIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" />
  </svg>
);
