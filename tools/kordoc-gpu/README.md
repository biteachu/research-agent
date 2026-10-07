# kordoc GPU 우선 실행 도구

프로젝트 로컬 CLI이며 스킬·MCP가 아니다. Node 20 이상, Windows DirectML을 사용한다.

```powershell
# tools/kordoc-gpu에서 pnpm install --frozen-lockfile
node tools/kordoc-gpu/run.mjs --manifest "연구폴더/literature/실행ID/manifest.json"
node tools/kordoc-gpu/run.mjs --pdf "논문.pdf" --backend auto --device 0
node tools/kordoc-gpu/run.mjs --pdf "논문.pdf" --backend cpu --output "시험폴더"
```

auto/directml은 DML 생성·추론 실패 시 CPU로 전환한다. device는 DXGI 인덱스다.
--pages "1,3-5"는 부분 시험용이다. --test-gpu-failure true는 초기화 실패 주입 시험 전용이다.
--test-gpu-inference-failure true는 추론 실패 주입 시험 전용이다.
run.mjs는 네이티브 추론 정지에 대비해 별도 프로세스를 사용한다. 기본 제한은 300초,
--timeout-ms로 조절한다. GPU 시간 초과 시 프로세스를 종료하고 전체 배치를 CPU로 재시도하며
새 실행 settings.supervisor_fallback에 사유를 남긴다. 이전 running 폴더는 미완료 결과다.
CPU도 시간 초과하면 종료 코드 2로 중지한다. 대형 문서는 제한 시간을 늘린다.
일반 실행에 시험 플래그를 넣지 않는다. 문서 순차 처리, 모델 세션 실행 내 재사용.
원본을 덮어쓰지 않고 새 parsed 실행 폴더를 만든다. 결과 재사용은 아직 자동 구현하지 않았다.

## 고정과 원본 보존

kordoc 4.19.1, npm gitHead 73e2066d2653b162fbea9234fa664632a5a14166.
공식 tarball과 package/ 원본, LICENSE·NOTICE·THIRD_PARTY를 그대로 보관한다.
pnpm-lock.yaml이 전이 의존성·배포 integrity를 고정한다. OCR용 ORT는 1.24.3으로 고정한다.
PDFium 2.1.13은 kordoc OCR이 호출하는 getOriginalSize API를 지원하는 버전으로 고정했다.
수식 모델/transformers는 사용하지 않는다. 불확실한 수식은 원본 페이지 PNG로 보존한다.
KORDOC_MODEL_CACHE는 이 도구의 models/다. kordoc의 고정 SHA256으로 모델을 검증한다.

gpu-runtime.mjs는 PP-OCR의 det.onnx/rec_korean.onnx에만 세션 생성·run을 감싼다.
원본 패키지와 모델·사전·검출/인식 전후처리를 수정하지 않는다.
DML 옵션: enableMemPattern=false, executionMode=sequential, DML+CPU 제공자.
설정된 제공자·성공한 run·네이티브 커널 프로파일을 각각 기록한다.
DmlExecutionProvider 커널이 실제 관측돼야 gpu_confirmed=true다. CPU 혼합은 그대로 표시한다.
세션 종료 후 프로파일을 저장하며 상세 네이티브 로그는 CLI stderr로 나온다.

## 출력 계약

parsing_manifest.json: schema_version 1.0, source, tool, settings, run_status,
papers, runtime, profiles, provider_evidence, 시작/종료 시각.
papers: ID, 입력 경로/해시, 직접/검색 동일성 상태, 품질, 문제, 페이지수,
산출물 상대경로/해시/크기, 전체 시간. runtime은 모델별 초기화·전환·추론 시간.
pages.json: 원본 페이지 번호, 추출 방식, bbox 또는 null, 블록, 경고와 원본 이미지.
모든 페이지를 PNG로 보존하므로 미검출 표·수식·그림도 원문 확인이 가능하다.
전역 OCR 경고만 있을 때 블록별 OCR 여부를 추정하지 않고 method=null로 남긴다.
PDF 안 링크 매핑과 읽기 순서에도 추출 오류가 가능하므로 원본과 확인해야 한다.
이미지 보존은 텍스트 추출 성공이 아니다. 본문이 없으면 failed다.
자동 결과는 needs_review이며 시각 검토 없는 passed는 생성하지 않는다.
현재 영역별 수식 복원·자동 완전성 판정은 제공하지 않는다.

## 공식 근거

- [kordoc](https://github.com/chrisryugj/kordoc)
- [고정 npm 버전 정보](https://registry.npmjs.org/kordoc/4.19.1)
- [ONNX Node 지원표](https://onnxruntime.ai/docs/get-started/with-javascript/node.html)
- [DirectML 요구조건](https://onnxruntime.ai/docs/execution-providers/DirectML-ExecutionProvider.html)

NVIDIA Windows 경로는 같은 DirectML 코드로 준비했으나 현재 실기기 미검증이다.
