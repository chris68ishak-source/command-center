export interface CompanyConfig {
  name: string;
  phone: string;
  googleReviewLink: string;
  city: string;
  services: string[];
  ownerName: string;
}

export interface ReviewRequest {
  customerName: string;
  customerPhone: string;
  projectType: string;
  jobId?: string;
}

export interface AgentLog {
  id: string;
  agent: string;
  status: "success" | "error" | "pending";
  message: string;
  timestamp: string;
  details?: string;
}

export interface QuoteFollowUp {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quoteAmount: number;
  projectType: string;
  sentAt: string;
  jobId: string;
}
