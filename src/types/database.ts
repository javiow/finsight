export type Category =
  | "식비"
  | "생활·마트"
  | "쇼핑"
  | "주거·관리비"
  | "카페·간식"
  | "교통"
  | "문화·여가"
  | "교육"
  | "통신"
  | "여행·숙박"
  | "의료·건강"
  | "기타";

export type Plan = "free" | "pro";

export type StatementStatus = "parsing" | "classifying" | "ready" | "failed";

export type MerchantCategorySource = "ai" | "user";

export interface Profile {
  id: string;
  plan: Plan;
  polar_customer_id: string | null;
  modified_at: string;
  created_at: string;
}

export interface Statement {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  status: StatementStatus;
  row_count: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  statement_id: string;
  user_id: string;
  transaction_date: string;
  merchant_name: string;
  amount: number;
  category: Category | null;
  created_at: string;
}

export interface UserMerchantCategory {
  user_id: string;
  merchant_name: string;
  category: Category;
  source: MerchantCategorySource;
  updated_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  period: string;
  category: Category | null;
  message: string;
  created_at: string;
}
