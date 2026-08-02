import type { Category } from "@/types/database";

const CATEGORY_RECORD: Record<Category, true> = {
  "식비": true,
  "생활·마트": true,
  "쇼핑": true,
  "주거·관리비": true,
  "카페·간식": true,
  "교통": true,
  "문화·여가": true,
  "교육": true,
  "통신": true,
  "여행·숙박": true,
  "의료·건강": true,
  "기타": true,
};

export const CATEGORIES = Object.keys(CATEGORY_RECORD) as [Category, ...Category[]];
