import Image from "next/image";
import { Icon } from "./Icon";
import type {
  PersonalInfo,
  ProfessionalMetadata,
  SocialLinks,
} from "@/types/domain/cv-analysis";

export interface CandidateCardProps {
  personal: PersonalInfo;
  metadata: ProfessionalMetadata;
  social?: SocialLinks;
  avatarUrl?: string;
}

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDMHV9ih5AI9wT8_V2mM6x9XmXjdAUtHk2sOI2ylK8TYkdaSTfmWI2oyC_tah-Bvoaj5th-V648O1wRxL1eBwATFRteiqYG4nNqKG8_OWJ2Vx6eyZB3uFOpEhdCK3Kv1KG3kJnRt7gXX77MEuBNKdLE7GEaM1DL07mLWs_9qHY98oJdOtq2liJVuSKka-7ZWR02nCje3zxbZWeGwg9mkjiPT_a0zOOyOsrxjzQOP0L4FHJbhlAK7r4QJHIJ6W08KfB1XlFVq_Fp7u5c";

export function CandidateCard({
  personal,
  metadata,
  social,
  avatarUrl = DEFAULT_AVATAR,
}: CandidateCardProps) {
  return (
    <div className="glass-card p-6 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#EDE9FE]">
        <Image className="w-full h-full object-cover" alt={personal.name} src={avatarUrl} width={96} height={96} />
      </div>
      <h2 className="text-lg font-bold mb-1 uppercase">{personal.name}</h2>
      <p className="text-sm text-[#44474F] mb-3">{metadata.primary_role}</p>
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {metadata.seniority_level && (
          <span className="px-2 py-1 bg-[#EEF0F5] text-[#44474F] rounded text-xs">
            {metadata.seniority_level}
          </span>
        )}
        {personal.location && (
          <span className="px-2 py-1 bg-[#EEF0F5] text-[#44474F] rounded text-xs">
            {personal.location}
          </span>
        )}
      </div>
      <div className="w-full flex justify-center gap-3 border-t border-[#E4E6EC] pt-4 mb-4">
        {personal.email && (
          <a
            href={`mailto:${personal.email}`}
            className="p-2 hover:bg-[#EEF0F5] rounded-full text-[#44474F] hover:text-[#4F46E5] transition-colors"
            aria-label="Email"
          >
            <Icon name="mail" />
          </a>
        )}
        {personal.phone && (
          <a
            href={`tel:${personal.phone}`}
            className="p-2 hover:bg-[#EEF0F5] rounded-full text-[#44474F] hover:text-[#4F46E5] transition-colors"
            aria-label="Phone"
          >
            <Icon name="call" />
          </a>
        )}
      </div>
      <a
        href={social?.linkedin ?? "#"}
        className={`w-full py-2 bg-[#EDE9FE] text-[#4F46E5] rounded-lg font-medium text-sm text-center hover:opacity-90 transition-opacity ${
          social?.linkedin ? "" : "opacity-60 pointer-events-none"
        }`}
      >
        LinkedIn Profile
      </a>
    </div>
  );
}
