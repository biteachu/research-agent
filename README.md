# research-agent

고등학교 생명과학 교육과 AI 융합 연구를 지원하는 대학원 과제 프로젝트입니다.
프로젝트 내 Markdown 지침을 읽는 프롬프트형 에이전트와 로컬 PDF 실행 도구로 구성됩니다.

## 구성

| 역할 | 지침 | 하는 일 |
|---|---|---|
| 팀장 | [ORCHESTRATOR_AGENT.md](ORCHESTRATOR_AGENT.md) | 주 소통 창구, 범위 합의, 역할 배분, 인계·상태 관리와 통합 보고 |
| 연구계획서 작성 | [AGENTS.md](AGENTS.md) | 아이디어 진단, 연구문제·방법 설계, 계획서 작성·수정 |
| 문헌검색 | [LITERATURE_SEARCH_AGENT.md](LITERATURE_SEARCH_AGENT.md) | 핵심 논문 선정, 공식 공개 PDF 확보, 검색 manifest 작성 |
| PDF 파서 | [PDF_PARSER_AGENT.md](PDF_PARSER_AGENT.md) | 검증 PDF를 페이지 추적 Markdown·JSON·이미지로 변환 |

팀장은 지원 환경에서 하위 에이전트에 위임하고, 미지원 환경에서는 한 대화에서 역할을 전환합니다.
합의 범위 안에서 단계를 이어가며 서버나 앱 없이 실행 환경의 도구를 사용합니다.
지침 파일만으로 모든 행동의 준수를 보장하지 않습니다.

## 에이전트 사용

프로젝트를 지침 파일을 읽을 수 있는 AI 작업 환경에서 열고 요청합니다.

```text
팀장으로 진행해줘. 내 아이디어를 진단하고 잠정 계획서까지만 만들어줘.
```

```text
팀장으로 지정한 계획서의 문헌검색과 파싱까지 진행해줘.
근거 공백·검토 필요 사항을 보고하고 계획서 수정은 제안만 해줘.
```

팀장은 중요한 사용자 결정과 차단 사유만 모아 질문합니다. 검색은 품질 게이트를 거치고,
파싱 needs_review를 통과로 바꾸지 않습니다. 연구 폴더의 orchestration/에 상태와 보고서를
남겨 재개 시 파일·해시를 확인합니다. 실제 연구 기록은 Git 공개 대상에서 제외됩니다.
합성 검증 사례는 [팀장 시나리오](examples/orchestrator_scenarios.md)를 참고하세요.

```text
생명과학 설명을 AI가 어떻게 생성하는지 분석하는 석사 연구를 계획하고 싶어.
AGENTS.md에 따라 필요한 질문부터 하고 잠정 연구계획서를 작성해줘.
```

```text
research_plans/내주제/research_plan.md를 문헌검색 에이전트에 인계해줘.
품질 게이트를 검사한 뒤 핵심 근거 논문과 공식 무료 공개 PDF를 확보해줘.
```

```text
literature 실행 폴더의 manifest.json을 PDF 파서에 인계해줘.
원본을 보존하고 Markdown·페이지 JSON·이미지와 품질 상태를 저장해줘.
```

계획서 → 문헌검색 인계는 통과·조건부 통과·수정 필요로 검사합니다.
문헌 부족만으로 차단하지 않으며 연구문제·검색 범위·필요 근거가 분명해야 합니다.
원문 미확인 주장, 학생 정보, 미정 사항을 확인된 사실처럼 처리하지 않습니다.

## PDF 도구 설치와 실행

Node.js 20 이상과 pnpm이 필요합니다. Windows에서는 DirectML GPU 경로를 사용합니다.
의존성·OCR 모델 다운로드에 인터넷 연결이 필요하며 프로젝트 안에 설치합니다.

```powershell
cd tools/kordoc-gpu
pnpm install --frozen-lockfile
cd ../..
node examples/create_demo_pdf.mjs
node tools/kordoc-gpu/run.mjs --pdf examples/demo.pdf --backend auto --output examples/parsed
```

```powershell
# CPU 비교 또는 GPU 장치 선택
node tools/kordoc-gpu/run.mjs --pdf examples/demo.pdf --backend cpu --output examples/parsed
node tools/kordoc-gpu/run.mjs --pdf "내논문.pdf" --backend auto --device 0
```

정상 텍스트층을 우선하고 OCR이 필요한 경우 검출·인식 세션에 GPU를 사용합니다.
auto/directml에서 GPU 생성·추론이 실패하면 CPU로 전환하고 이유를 기록합니다.
--device는 DXGI 장치 번호이며 전체 처리 과정을 GPU로 바꾸는 옵션이 아닙니다.
자세한 실행 옵션과 산출물 계약은 [도구 README](tools/kordoc-gpu/README.md)를 참고합니다.

## 산출물과 확인 범위

- 논문별 document.md, pages.json, assets/와 실행별 parsing_manifest.json, parsing_report.md.
- 실제 원본 페이지 번호·파일 해시·OCR 경고·실행 제공자 프로파일을 기록합니다.
- 수식·표·그림 복원이 불확실하면 원본 페이지 PNG와 검토 항목을 남깁니다.
- 실행 완료와 품질 통과를 구분합니다. 자동 산출물은 시각 검토 전 needs_review입니다.

Intel GPU에서 실제 DML 커널 실행을 확인했으나 CPU 혼합 실행이었습니다.
제한된 시험에서는 GPU가 CPU보다 느렸습니다. NVIDIA 실기기는 미검증입니다.
다단 지면 읽기 순서, 링크 매핑, OCR 수식 첨자 손실 등의 오류 가능성이 남아 있습니다.
예시 PDF는 직접 생성한 합성 자료이며 실제 논문·학생 자료가 아닙니다.

## 공개 범위

공개 후보는 지침·실행 코드·설치 lockfile·사용법·합성 예시·원본 라이선스 고지입니다.
논문 PDF와 추출 원문, 학생 정보, 실제 연구자료, 비밀키·.env, 모델·의존성 파일,
실행 로그와 검토 대화는 업로드하지 않습니다. .gitignore는 검토한 경로만 허용합니다.
공개 목록은 [PUBLICATION_FILES.md](PUBLICATION_FILES.md)를 확인하세요.
새 파일을 추가할 때 허용 목록과 파일 내용을 다시 점검해야 합니다.

## 원본 프로젝트와 고지

kordoc 4.19.1과 의존성을 고정하여 사용합니다.
원본 모델·사전·전후처리는 유지하고 OCR 세션 생성·추론만 로컬 어댑터로 보완합니다.
원본 배포 압축파일과 실행 바이너리는 공개 저장소에 포함하지 않습니다.
[kordoc 원본](https://github.com/chrisryugj/kordoc),
[고정 릴리스](https://github.com/chrisryugj/kordoc/releases/tag/v4.19.1),
[보존한 LICENSE·NOTICE](tools/kordoc-gpu/package/)를 참고하세요.
자체 작성 부분의 재배포 라이선스는 아직 지정하지 않았으며 원본 고지의 적용 범위와 구분합니다.
