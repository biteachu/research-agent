// Only kordoc PP-OCR sessions are intercepted; source/model processing stays intact.
import * as ort from 'onnxruntime-node';
import {basename, join} from 'node:path';
import {performance} from 'node:perf_hooks';
export async function installOcrRuntime({backend='auto',deviceId=0,profileDir,injectFailure=false,injectInferenceFailure=false}) {
  if (!['auto','directml','cpu'].includes(backend)) throw Error('Unknown backend');
  if (!Number.isInteger(deviceId)||deviceId<0) throw Error('Invalid device ID');
  const original=ort.InferenceSession.create.bind(ort.InferenceSession);
  const records=[], cache=new Map();
  ort.InferenceSession.create=async (model,options={})=>{
    if(typeof model!=='string'||!['det.onnx','rec_korean.onnx'].includes(basename(model))) return original(model,options);
    if(cache.has(model)) return cache.get(model);
    const record={record_id:records.length+1,model,requested:backend,device_id:deviceId,events:[],inference_ms:0,runs:0,actual_provider_evidence:'unconfirmed'};
    records.push(record);
    let session, provider;
    const create=async p=>{
      const start=performance.now();
      if(p==='dml'&&injectFailure) throw Error('TEST: injected GPU initialization failure');
      const s=await original(model,{...options,executionProviders:p==='cpu'?['cpu']:[{name:'dml',deviceId},'cpu'],enableMemPattern:false,executionMode:'sequential',enableProfiling:true,profileFilePrefix:join(profileDir,`${record.record_id}-${p}`),logSeverityLevel:0,logVerbosityLevel:1,logId:`ocr-${basename(model)}-${p}`});
      record.events.push({event:'initialized',provider:p,duration_ms:performance.now()-start});
      provider=p; return s;
    };
    try{session=await create(backend==='cpu'?'cpu':'dml');}
    catch(e){record.events.push({event:'cpu_fallback',phase:'initialization',reason:String(e)});session=await create('cpu');}
    const proxy={
      get inputNames(){return session.inputNames;},get outputNames(){return session.outputNames;},
      async run(...args){
        const start=performance.now();
        try {if(provider==='dml'&&injectInferenceFailure)throw Error('TEST: injected GPU inference failure');const result=await session.run(...args);record.runs++;record.events.push({event:'inference',provider,duration_ms:performance.now()-start});return result;}
        catch(e){
          if(provider==='cpu') throw e;
          record.events.push({event:'cpu_fallback',phase:'inference',reason:String(e)});
          try{session.endProfiling();}catch{} await session.release();session=await create('cpu');
          const retry=performance.now(), result=await session.run(...args);record.runs++;record.events.push({event:'inference',provider,duration_ms:performance.now()-retry});return result;
        }finally{record.inference_ms+=performance.now()-start;}
      },
      // kordoc destroys its engine after a document; retain models for this sequential run.
      async release(){},
      async close(){try{session.endProfiling();}catch(e){record.events.push({event:'profile_unavailable',reason:String(e)});}await session.release();}
    };
    cache.set(model,proxy);return proxy;
  };
  return {records,async close(){for(const s of cache.values())await s.close();ort.InferenceSession.create=original;}};
}
