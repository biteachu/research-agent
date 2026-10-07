import {readFile,writeFile,mkdir,readdir,copyFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname,join,relative,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {PDFiumLibrary} from '@hyzyla/pdfium';
import sharp from 'sharp';
import {installOcrRuntime} from './gpu-runtime.mjs';
const here=dirname(fileURLToPath(import.meta.url));
export const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async(p,x)=>writeFile(p,JSON.stringify(x,null,2));
const rel=(base,p)=>relative(base,p).replaceAll('\\','/');
const args=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith('--')?[x.slice(2),a[i+1]?.startsWith('--')?'true':a[i+1]||'true']:null).filter(Boolean));
// PDFium 2.1.0 WASI environment serializes argv[1] as ASCII; avoid Unicode path assertion.
// This changes only the process display name, never file paths or system settings.
process.argv[1]='kordoc-gpu';
if(!args.manifest&&!args.pdf)throw Error('Use --manifest PATH or --pdf PATH');
if(args.manifest&&args.pdf)throw Error('Choose one input type');
process.env.KORDOC_MODEL_CACHE=join(here,'models');
let inputs=[],source=null;
if(args.manifest){
  const p=resolve(args.manifest),bytes=await readFile(p),m=JSON.parse(bytes.toString().replace(/^\uFEFF/,''));
  if(!['1.0','1.1'].includes(m.schema_version))throw Error('Unsupported manifest version');
  if(m.schema_version==='1.1'){
    if(!m.handoff_gate||!['ready','conditional_ready'].includes(m.handoff_gate.decision))throw Error('Invalid handoff gate');
    const gp=resolve(dirname(p),m.handoff_gate.path),gb=await readFile(gp),g=JSON.parse(gb.toString().replace(/^\uFEFF/,''));
    if(hash(gb)!==m.handoff_gate.sha256||g.source?.sha256!==m.handoff_gate.source_sha256||g.decision!==m.handoff_gate.decision)throw Error('Gate mismatch');
    const plan=resolve(dirname(p),m.handoff_gate.source_base,g.source.path);
    if(m.input_plan?.sha256!==g.source.sha256||resolve(dirname(p),m.input_plan.path)!==plan)throw Error('Manifest plan and gate plan mismatch');
    if(hash(await readFile(plan))!==g.source.sha256)throw Error('Plan changed since gate');
  }
  source={type:'literature_manifest',path:p,sha256:hash(bytes),schema_version:m.schema_version,gate:m.handoff_gate??null};
  inputs=m.papers.filter(x=>x.selected_core===true&&x.download_status==='downloaded_verified'&&x.validation?.identity_match===true).map(x=>({id:x.paper_id,path:resolve(dirname(p),x.local_path),expected_hash:x.sha256,identity_verified:true,title:x.title,doi:x.doi}));
}else {inputs=[{id:'pdf_'+hash(resolve(args.pdf)).slice(0,12),path:resolve(args.pdf),expected_hash:null,identity_verified:false}];source={type:'direct_pdf',gate:null};}
if(!inputs.length)throw Error('No eligible PDFs');
const runid=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Seoul'}).replaceAll(/[- :]/g,'')+'_'+createHash('sha256').update(String(performance.now())).digest('hex').slice(0,6);
const out=resolve(args.output||join(dirname(resolve(args.manifest||args.pdf)),'parsed'),runid);await mkdir(out,{recursive:true});
const profileDir=join(out,'profiles');await mkdir(profileDir);
const settings={backend:args.backend||'auto',device_id:Number(args.device||0),pages:args.pages??null,formula_ocr:false,page_images:true,supervisor_fallback:args['supervisor-note']??null};
const runtime=await installOcrRuntime({backend:settings.backend,deviceId:settings.device_id,profileDir,injectFailure:args['test-gpu-failure']==='true',injectInferenceFailure:args['test-gpu-inference-failure']==='true'});
const kordoc=await import('kordoc'),library=await PDFiumLibrary.init();
if(kordoc.VERSION!=='4.19.1')throw Error('Pinned kordoc version mismatch');
const tool={kordoc:'4.19.1',git_commit:'73e2066d2653b162fbea9234fa664632a5a14166',onnxruntime:'1.24.3',wrapper_sha256:hash(await readFile(fileURLToPath(import.meta.url))),gpu_adapter_sha256:hash(await readFile(join(here,'gpu-runtime.mjs'))),lock_sha256:hash(await readFile(join(here,'pnpm-lock.yaml')))};
const manifest={schema_version:'1.0',run_id:runid,started_at:new Date().toISOString(),source,tool,settings,run_status:'running',papers:[],runtime:runtime.records};
await json(join(out,'parsing_manifest.json'),manifest);
try{
 for(const input of inputs){
  const start=performance.now(),entry={paper_id:input.id,input_path:input.path,input_sha256:null,identity_verified:input.identity_verified,quality_status:'failed',issues:[],outputs:[]};manifest.papers.push(entry);
  let doc;
  try{
   if(!/^[A-Za-z0-9_-]+$/.test(input.id))throw Error('Unsafe paper ID');
   const bytes=await readFile(input.path);entry.input_sha256=hash(bytes);
   if(input.expected_hash&&input.expected_hash!==entry.input_sha256)throw Error('Input SHA256 mismatch');
   if(source.type==='literature_manifest'&&!input.expected_hash)throw Error('Missing expected hash');
   if(!bytes.subarray(0,1024).includes(Buffer.from('%PDF-')))throw Error('Not PDF');
   doc=await library.loadDocument(bytes);const count=doc.getPageCount();if(!count)throw Error('No pages');
   const folder=join(out,input.id),assets=join(folder,'assets');await mkdir(assets,{recursive:true});
   const result=await kordoc.parse(bytes,{ocr:true,pages:settings.pages??undefined,scriptTags:true,removeHeaderFooter:false,images:true,tables:true,layoutTables:'keep',keepTrailingEmptyCols:true});
   if(!result.success)throw Error(result.error);
   const pages=[],md=[];
   for(const p of result.pages??[]){
    const n=p.pageNumber;if(n<1||n>count)throw Error('Invalid page mapping');
    const image=await doc.getPage(n-1).render({scale:2,render:async o=>sharp(o.data,{raw:{width:o.width,height:o.height,channels:4}}).png().toBuffer()});
    const asset=`assets/page_${n}.png`;await writeFile(join(folder,asset),image.data);
    const warnings=(result.warnings??[]).filter(w=>w.page===n||w.page==null);
    const needsOcr=result.pageQuality?.find(q=>q.page===n)?.needsOcr;
    const applied=warnings.some(w=>w.code==='OCR_APPLIED');
    const method=needsOcr?(applied?'ocr':'unresolved'):applied?'text_layer_with_possible_image_ocr':'text_layer';
    const blocks=result.blocks.filter(b=>b.pageNumber===n).map((b,i)=>({id:`p${n}_b${i+1}`,page_number:n,bbox:b.bbox??null,coordinate_system:b.bbox?'kordoc PDF points (72/inch); orientation not independently verified':null,type:b.type,text:b.text??null,table:b.table??null,method:method==='text_layer_with_possible_image_ocr'?null:method,confidence:null,asset:b.type==='image'?asset:null,suspicions:applied?['OCR may contribute; upstream does not expose exact per-block provenance']:[]}));
    if(!p.markdown.trim())entry.issues.push(`Empty page ${n}`);
    pages.push({page_number:n,method,quality:result.pageQuality?.find(q=>q.page===n)??null,warnings,source_image:asset,blocks});
    md.push(`<!-- PDF page ${n} -->\n\n${p.markdown}\n\n[원본 페이지 ${n}](assets/page_${n}.png)\n`);
   }
   if(!settings.pages&&pages.length!==count)entry.issues.push('Page coverage mismatch');
   if(settings.pages)entry.issues.push('Partial page selection');
   for(const im of result.images??[]){const name=basename(im.filename);await writeFile(join(assets,name),im.data);for(let i=0;i<md.length;i++)md[i]=md[i].replaceAll(`](${im.filename})`,`](assets/${name})`);}
   entry.issues.push(...(result.warnings??[]).map(w=>`${w.code}: ${w.message}`));
   // Page render preserves undetected equations/tables/figures without claiming semantic recovery.
   entry.issues.push('Equation/figure completeness and reading order need visual review; original pages preserved.');
   const hasBody=result.blocks.some(b=>(['paragraph','heading','list'].includes(b.type)&&Boolean(b.text?.trim()))||(b.type==='table'&&b.table?.cells.some(row=>row.some(cell=>cell.text?.trim()))));
   entry.quality_status=hasBody?'needs_review':'failed';
   if(!settings.pages&&pages.length!==count)entry.quality_status='failed';
   if(!hasBody)entry.issues.push('No extracted body text; image preservation alone is not parsing success');
   entry.page_count=count;entry.parsed_pages=pages.length;
   await writeFile(join(folder,'document.md'),md.join('\n'));
   await json(join(folder,'pages.json'),{schema_version:'1.0',input_sha256:entry.input_sha256,pages,unlocated_blocks:result.blocks.filter(b=>!b.pageNumber).map(({imageData,...b})=>b),metadata:result.metadata,warnings:result.warnings??[]});
   const files=['document.md','pages.json',...(await readdir(assets)).map(n=>'assets/'+n)];
   for(const f of files){const p=join(folder,f);entry.outputs.push({path:rel(out,p),sha256:hash(await readFile(p)),bytes:(await stat(p)).size});}
  }catch(e){entry.issues.push(String(e));}finally{doc?.destroy();entry.total_ms=performance.now()-start;await json(join(out,'parsing_manifest.json'),manifest);}
 }
}finally{
 await runtime.close();library.destroy();
 // Provider events from native ORT profiles are stronger evidence than configuration.
 const profiles=(await readdir(profileDir)).filter(n=>n.endsWith('.json'));
 manifest.profiles=[];const providers=new Set();
 for(const n of profiles){try{const p=join(profileDir,n),events=JSON.parse(await readFile(p,'utf8')),counts={};for(const e of events)if(e.args?.provider){providers.add(e.args.provider);counts[e.args.provider]=(counts[e.args.provider]??0)+1;}
  const record=runtime.records.find(r=>n.startsWith(`${r.record_id}-`));if(record){record.observed_provider_counts={...record.observed_provider_counts,...counts};record.actual_provider_evidence=Object.keys(counts).length?'native_kernel_profile':'unconfirmed';}
  manifest.profiles.push({path:rel(out,p),sha256:hash(await readFile(p)),provider_kernel_counts:counts});}catch{}}
 for(const r of runtime.records){r.model_sha256=hash(await readFile(r.model));}
 manifest.provider_evidence={observed:[...providers],gpu_confirmed:providers.has('DmlExecutionProvider'),scope:'OCR kernels only; absence of profiles means unconfirmed'};
 manifest.run_status=manifest.papers.every(p=>p.quality_status==='failed')?'failed':manifest.papers.some(p=>p.quality_status==='failed')?'partial':'completed';manifest.completed_at=new Date().toISOString();
 await json(join(out,'parsing_manifest.json'),manifest);
 await writeFile(join(out,'parsing_report.md'),`# PDF 파싱 실행\n\n상태: ${manifest.run_status}\n\nGPU 추론 확인: ${manifest.provider_evidence.gpu_confirmed}\n\n실제 제공자: ${[...providers].join(', ')||'미확인'}\n\n${manifest.papers.map(p=>`## ${p.paper_id}\n\n품질: ${p.quality_status}\n\n${p.issues.map(s=>'- '+s).join('\n')}`).join('\n\n')}\n`);
 console.log(JSON.stringify({output:out,status:manifest.run_status,gpu_confirmed:manifest.provider_evidence.gpu_confirmed}));
 if(manifest.run_status==='failed')process.exitCode=1;
}
