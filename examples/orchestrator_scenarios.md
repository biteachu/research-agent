# 팀장 합성 검증 시나리오

실제 논문·학생 자료 없이 지침의 의사결정과 역할 경계를 확인한다.
아래 예상 행동은 시험 기준이며 실제 검색·다운로드·파싱 성공 기록이 아니다.

| ID | 입력 조건 | 예상 처리 |
|---|---|---|
| S1 | “AI 생명과학 설명 오류를 연구하고 싶어”만 입력 | 팀장이 범위를 확인하고 작성 역할의 진단·핵심 질문부터 진행. 검색·파싱 자동 추가 없음 |
| S2 | “이 PDF만 파싱해줘” | 파서 직접 진입. 작성·문헌검색 불필요. 직접 PDF 동일성 범위 구분 |
| S3 | 계획서까지만 요청 | writing만 범위에 기록하고 작성 결과·수정 제안에서 종료 |
| S4 | 게이트 revision_required | 검색 blocked. 차단 위치·수정 요청 보고. 원계획서 자동 수정 없음 |
| S5 | 검색 partial, 선정 2편 중 검증 PDF 1편 | 적격 1편만 파서에 전달. 선정 2·확보 1·미확보 1 구분 |
| S6 | 파서 completed, 품질 needs_review | 파싱 실행 완료·검토 필요 1건, 전체 partial. passed로 승격하지 않음 |
| S7 | 검색 대상 두 가지가 충돌, 사용자 선택 없음 | 팀장이 한 질문으로 선택 요청. 의존 검색 blocked, 독립 확인만 수행 |
| S8 | 중단 뒤 입력 SHA256 변경 | 이전 기록 보존, 후속 작업 blocked, 새 입력 재인계 필요. 기존 완료를 재표시하지 않음 |
| S9 | 하위 에이전트 도구 미지원 | 전용 지침으로 순차 역할 전환, execution_mode=role_switch와 agent_id=null |
| S10 | 재개 시 입력·출력 해시 모두 일치 | 유효 완료 작업 재실행 없음. 대기한 다음 단계만 진행 |
| S11 | 기존 manifest 1.0 또는 직접 PDF 파싱 요청 | 요청 범위의 파싱만 허용. 게이트 부재/직접 입력을 새 검색 승인으로 해석하지 않음 |

## 상태 계약 합성 예시

필수 최상위 키: schema_version, run_id, created_at, updated_at, research_root,
scope, run_status, tasks, decisions, next_actions.
scope.agreed_stages는 writing/search/parsing 중 합의된 단계만 담는다.
작업별 status와 upstream_result의 원 판정은 분리한다.
입출력 해시는 실제 파일에서 계산하며 예시용 가짜 서지나 PDF 검증 성공을 만들지 않는다.
state.json과 team_report.md는 실행 자료이므로 이 공개 예시 파일과 달리 Git에서 제외한다.
