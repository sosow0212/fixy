/**
 * 런타임 전역 선언. opencode 플러그인/스크립트는 bun 위에서 돌아가므로 `Bun` 전역이 있다.
 * 타입체크 시에만 필요한 최소 선언(런타임 동작과 무관). 실제 사용처는 `(Bun as any).$`.
 */
declare const Bun: any;
