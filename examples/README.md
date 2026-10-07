# 개인정보 없는 시험 예시

research_plan.md는 합성 계획서이며 실제 학생·연구 결과·논문 인용이 없습니다.
create_demo_pdf.mjs는 표·위첨자 수식·벡터 도형이 있는 합성 PDF를 직접 생성합니다.
학생 정보·논문 원문·외부 이미지·비밀키를 사용하지 않습니다.

```powershell
node examples/create_demo_pdf.mjs
node tools/kordoc-gpu/run.mjs --pdf examples/demo.pdf --backend cpu --output examples/parsed
```

demo.pdf와 parsed/는 .gitignore로 제외됩니다. 정상 텍스트층 시험용이며 GPU OCR 성능 시험은 아닙니다.
OCR 시험은 별도의 직접 만든 스캔 PDF로 CPU/GPU를 비교하고 실제 제공자 프로파일을 확인하세요.
