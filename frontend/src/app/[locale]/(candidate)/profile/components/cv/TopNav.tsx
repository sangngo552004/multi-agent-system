import { Icon } from "./Icon";

export interface TopNavProps {
  brand?: string;
  initials?: string;
  activeItem?: string;
  items?: string[];
}

export function TopNav({
  brand = "TalentMatch",
  initials = "VD",
  activeItem = "Analysis",
  items = ["Dashboard", "Analysis", "Jobs", "Settings"],
}: TopNavProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/70 border-b border-[#E4E6EC]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center text-white">
            <Icon name="auto_awesome" className="text-[18px]" />
          </div>
          <span className="font-semibold text-[17px]">{brand}</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#44474F]">
          {items.map((item) => (
            <a
              key={item}
              className={
                item === activeItem
                  ? "text-[#4F46E5] font-medium"
                  : "hover:text-[#4F46E5]"
              }
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-[#EEF0F5] text-[#44474F]">
            <Icon name="notifications" className="text-[20px]" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6] font-semibold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
