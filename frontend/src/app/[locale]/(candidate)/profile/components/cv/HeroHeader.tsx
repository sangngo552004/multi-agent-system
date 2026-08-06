import { Icon } from "./Icon";

export interface HeroHeaderProps {
  title?: string;
  subtitle?: string;
  processingTimeMs?: number;
  language?: string;
  extractionMethod?: string;
}

export function HeroHeader({
  title = "Phân tích CV hoàn tất",
  subtitle = "AI đã trích xuất thông tin từ CV và phân tích hồ sơ của bạn.",
  processingTimeMs,
  language,
  extractionMethod,
}: HeroHeaderProps) {
  return (
    <section className="mb-8">
      <h1
        className="text-3xl md:text-4xl font-bold mb-2 tracking-tight"
        style={{ fontFamily: "'Google Sans Display', sans-serif" }}
      >
        {title}
      </h1>
      <p className="text-[15px] text-[#44474F] mb-4">{subtitle}</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F5ED] text-[#005137] text-xs font-medium">
          <Icon name="check_circle" className="!text-[14px]" />
          Phân tích thành công
        </span>
        {processingTimeMs != null && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#44474F] text-xs font-medium border border-[#E4E6EC]">
            <Icon name="timer" className="!text-[14px]" />
            Thời gian xử lý: {(processingTimeMs / 1000).toFixed(1)} giây
          </span>
        )}
        {language && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#44474F] text-xs font-medium border border-[#E4E6EC]">
            <Icon name="language" className="!text-[14px]" />
            Language: {language.toUpperCase()}
          </span>
        )}
        {extractionMethod && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#44474F] text-xs font-medium border border-[#E4E6EC]">
            <Icon name="memory" className="!text-[14px]" />
            Extraction Method: {extractionMethod.toUpperCase()}
          </span>
        )}
      </div>
    </section>
  );
}
