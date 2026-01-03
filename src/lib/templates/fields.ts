export const FIELD_LABELS: Record<string, string> = {
  title: "프롬프트 제목",
  subject: "주제",
  characters: "등장인물",
  story: "스토리 초안",
  purpose: "영상 목적",
  tone: "영상 분위기",
  camera: "카메라 연출",
  style: "스타일",
  dialogue: "대사",
  scene: "장면",
  location: "장소",
  lighting: "조명",
  mood: "분위기",
  action: "액션",
  product: "제품",
  background: "배경",
  detail: "디테일",
  timeline: "타임라인",
  duration: "영상 길이",
  constraints: "제약 조건",
};

export const FIELD_PLACEHOLDERS: Record<string, string> = {
  title: "예: 새벽 도심의 추적 시퀀스",
  subject: "예: 빗속을 달리는 오토바이",
  characters: "예: 주인공 1명, 추적자 2명",
  story: "예: 비 내리는 밤, 주인공이 추적을 따돌린다",
  purpose: "예: 브랜드 티저 영상",
  tone: "예: 긴장감 있는 시네마틱",
  camera: "예: 핸드헬드 + 로우앵글 트래킹",
  style: "예: 네온 누아르, 고대비",
  dialogue: "예: 민지: 서둘러! 준호: 따라온다.",
  scene: "예: 도심 골목 추격",
  location: "예: 서울 도심, 비 오는 밤",
  lighting: "예: 네온 사인 + 역광",
  mood: "예: 서늘하고 긴장된 분위기",
  action: "예: 차량 추격 후 골목으로 진입",
  product: "예: 스마트폰 신제품",
  background: "예: 젖은 아스팔트와 네온",
  detail: "예: 물방울, 슬로모션 파편",
  timeline: "예: 0-2초 도입, 2-6초 추격, 6-8초 클라이맥스",
  duration: "예: 8초 또는 15초",
  constraints: "예: 인물 노출 최소화, 로고 클로즈업 금지",
};

export function getFieldLabel(key: string) {
  return FIELD_LABELS[key] ?? "입력";
}

export function getFieldPlaceholder(key: string) {
  return FIELD_PLACEHOLDERS[key] ?? "예: 내용을 입력하세요";
}
