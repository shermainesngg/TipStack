export interface DomainConfig {
  slug: string;
  label: string;
  description: string;
  tint: string;
  darkTint: string;
  accent: string;
}

const DOMAINS: Record<string, DomainConfig> = {
  frontend: {
    slug: "frontend",
    label: "Frontend",
    description: "UI patterns, component architecture, and browser-side AI integrations",
    tint: "bg-[#faf0ef]",
    darkTint: "dark:bg-[#2e1e1c]",
    accent: "text-[#8B4A4A]",
  },
  backend: {
    slug: "backend",
    label: "Backend",
    description: "Server architecture, API design, and AI-powered backend workflows",
    tint: "bg-[#f0f8f2]",
    darkTint: "dark:bg-[#1a2b1e]",
    accent: "text-[#2D6040]",
  },
  devops: {
    slug: "devops",
    label: "DevOps",
    description: "Infrastructure automation, deployment pipelines, and AI-assisted ops",
    tint: "bg-[#f3eff8]",
    darkTint: "dark:bg-[#221e2e]",
    accent: "text-[#5E3F96]",
  },
  ci_cd: {
    slug: "ci_cd",
    label: "CI/CD",
    description: "Continuous integration and delivery with AI-powered testing and automation",
    tint: "bg-[#eef5fa]",
    darkTint: "dark:bg-[#1a2530]",
    accent: "text-[#3D6080]",
  },
  data_engineering: {
    slug: "data_engineering",
    label: "Data Engineering",
    description: "Data pipelines, ETL workflows, and AI-augmented data processing",
    tint: "bg-[#f9f5ec]",
    darkTint: "dark:bg-[#2a261a]",
    accent: "text-[#7B6230]",
  },
  mobile: {
    slug: "mobile",
    label: "Mobile",
    description: "Mobile development patterns and on-device AI integration",
    tint: "bg-[#f9f0f3]",
    darkTint: "dark:bg-[#2e1c22]",
    accent: "text-[#8B4A6E]",
  },
  machine_learning: {
    slug: "machine_learning",
    label: "Machine Learning",
    description: "Model training, fine-tuning, evaluation, and ML engineering practices",
    tint: "bg-[#eff2fa]",
    darkTint: "dark:bg-[#1c2030]",
    accent: "text-[#4A5A8B]",
  },
  databases: {
    slug: "databases",
    label: "Databases",
    description: "Schema design, query optimization, and AI-assisted database workflows",
    tint: "bg-[#f5eff5]",
    darkTint: "dark:bg-[#261e26]",
    accent: "text-[#6E4A8B]",
  },
  api_design: {
    slug: "api_design",
    label: "API Design",
    description: "RESTful and GraphQL API patterns, SDK generation, and API-first development",
    tint: "bg-[#f8f2ec]",
    darkTint: "dark:bg-[#2a221a]",
    accent: "text-[#8B6E4E]",
  },
  security_engineering: {
    slug: "security_engineering",
    label: "Security",
    description: "Security practices, vulnerability detection, and AI-assisted security workflows",
    tint: "bg-[#faf0ef]",
    darkTint: "dark:bg-[#2e1e1c]",
    accent: "text-[#8B4A4A]",
  },
};

const DEFAULT_DOMAIN: DomainConfig = {
  slug: "",
  label: "",
  description: "Tips and best practices for this domain",
  tint: "bg-[#f3eff8]",
  darkTint: "dark:bg-[#221e2e]",
  accent: "text-[#5A5A6E]",
};

export function getDomainConfig(slug: string): DomainConfig {
  if (DOMAINS[slug]) return DOMAINS[slug];
  return {
    ...DEFAULT_DOMAIN,
    slug,
    label: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export function getAllDomainConfigs(): DomainConfig[] {
  return Object.values(DOMAINS);
}
