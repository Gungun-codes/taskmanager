import { User } from "@/types";

interface Props {
  user: User;
  size?: number;
}

export default function Avatar({ user, size = 32 }: Props) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        title={user.name}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", border: "2px solid var(--sand)",
          flexShrink: 0,
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      title={user.name}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--caramel)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700,
        border: "2px solid var(--sand)", flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
