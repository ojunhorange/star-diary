import { MIN_LENGTH } from "@/lib/store";

// 조건 충족 전엔 금빛, 충족 후엔 회색
export default function CharCount({ text }: { text: string }) {
  const n = text.trim().length;
  return (
    <span className={`text-sm tabular-nums ${n >= MIN_LENGTH ? "text-muted" : "text-gold"}`}>
      {n}/{MIN_LENGTH}
      {n < MIN_LENGTH && <span className="ml-2 text-muted">30자부터 별자리 생성에 사용돼요</span>}
    </span>
  );
}
