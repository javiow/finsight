export interface PrivacyNoticeItem {
  title: string;
  description: string;
}

/**
 * PRD "프라이버시" 절의 문구. 랜딩과 업로드 화면(추후 구현)에 동일하게 노출해야 한다 —
 * 두 화면에서 문구가 갈리면 "안전하다는 약속"이 흔들린다.
 */
export const PRIVACY_NOTICE: readonly PrivacyNoticeItem[] = [
  {
    title: "원본 CSV를 외부 모델에 보내지 않아요",
    description:
      "매핑 판별용 비식별화된 미리보기, 분류용 가맹점명, 인사이트용 집계 숫자만 목적별로 보냅니다.",
  },
  {
    title: "식별정보는 전송 전에 마스킹해요",
    description:
      "카드번호·계좌·연락처는 전송 전에 가려집니다. 애초에 날짜·가맹점·금액 세 가지만 추출하므로 DB에도 들어가지 않습니다.",
  },
  {
    title: "원본 파일은 30일 후 자동 삭제돼요",
    description: "private Storage에 30일 보관 후 삭제됩니다. 분석 결과는 그대로 남습니다.",
  },
];
