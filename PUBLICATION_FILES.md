# 공개 업로드 검토 목록

대상: biteachu/research-agent, Public. 공개 대상으로 검토한 파일 목록이다.
사용자가 2026-10-07 업로드를 승인했다. 로컬 원본 자료는 삭제하지 않는다.

## 포함 — 28개 파일

```text
.gitattributes
.gitignore
AGENTS.md
LITERATURE_SEARCH_AGENT.md
PDF_PARSER_AGENT.md
README.md
PUBLICATION_FILES.md
examples/README.md
examples/create_demo_pdf.mjs
examples/research_plan.md
tools/kordoc-gpu/.gitignore
tools/kordoc-gpu/README.md
tools/kordoc-gpu/gpu-runtime.mjs
tools/kordoc-gpu/package.json
tools/kordoc-gpu/parse.mjs
tools/kordoc-gpu/run.mjs
tools/kordoc-gpu/pnpm-lock.yaml
tools/kordoc-gpu/pnpm-workspace.yaml
tools/kordoc-gpu/provenance.json
tools/kordoc-gpu/package/LICENSE
tools/kordoc-gpu/package/NOTICE
tools/kordoc-gpu/package/THIRD_PARTY/apache-2.0.LICENSE
tools/kordoc-gpu/package/THIRD_PARTY/claw-hwp.LICENSE
tools/kordoc-gpu/package/THIRD_PARTY/hml-equation-parser.LICENSE
tools/kordoc-gpu/package/THIRD_PARTY/hml-equation-parser.txt
tools/kordoc-gpu/package/THIRD_PARTY/opendataloader-pdf.txt
tools/kordoc-gpu/package/THIRD_PARTY/pix2text.txt
tools/kordoc-gpu/package/THIRD_PARTY/rhwp-forms.txt
```

## 제외

- AI 의견 제시/: 토론·검토·실제 논문과 파싱 원문·로그·개인 로컬 경로를 포함하는 기록.
- 연구계획서와 실제 연구자료, literature/ 및 parsed/ 실행 결과, 학생·학교 식별 자료.
- PDF 전체: 공개 라이선스 여부와 무관하게 이번 게시 범위에서 원문 파일은 모두 제외.
- .env·API 키·비밀번호·인증 파일, .git 내부 정보, 모델·node_modules·패키지 캐시·배포 압축파일.
- 기존 로컬 시험 스크립트: 실제 논문 및 개인 작업 폴더를 참조하므로 공개 예시로 대체.

## 점검 범위와 제한

공개 후보 28개 파일의 내용을 검토하고 비밀키 패턴, 인증 URL, 로컬 사용자 경로,
이메일·전화번호 등 식별정보 후보를 검사했으며 해당 패턴은 검출되지 않았다. 원본 라이선스·공식 프로젝트 URL·
공개된 오픈소스 저작권자의 고지는 보존하며 비밀정보와 구분한다.
공개 예시는 새로 작성한 합성 자료로 실제 연구 결과·학생 자료·논문 원문이 없다.
합성 PDF 생성과 로컬 CPU 변환을 확인했으며 생성 PDF·실행 결과는 제외된다.
자동 문자열 검사는 개인정보나 비밀정보의 완전한 부재를 보장하지 않는다.
업로드 직전에 실제 커밋 대상 목록을 다시 확인한다.

GitHub 계정 biteachu 로그인, research-agent Public 저장소 생성, 관리자·푸시 권한과
익명 공개 조회를 확인했다. Git 원격은 https://github.com/biteachu/research-agent.git 이다.
사용자 승인에 따라 아래 목록으로 첫 커밋·파일 푸시를 진행한다.

## 후속 공개 시 확인

이 저장소는 누구나 볼 수 있다. 새 파일을 추가할 때 공개 목록과 내용을 다시 점검한다.
GitHub 로그인 승인은 업로드 목록 승인과 구분한다.
