function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "sm"
    ? "h-7 w-7 text-[10px]"
    : "h-8 w-8 text-xs";
  return (
    <div className={`flex ${cls} shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary`}>
      {initials(name)}
    </div>
  );
}
