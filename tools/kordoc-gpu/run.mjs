// Native inference can block the JS event loop. A separate process enforces timeout.
import {spawn} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const parser=join(dirname(fileURLToPath(import.meta.url)),'parse.mjs');
let args=process.argv.slice(2), timeout=300000;
const ti=args.indexOf('--timeout-ms');
if(ti>=0){timeout=Number(args[ti+1]);args.splice(ti,2);}
if(!Number.isFinite(timeout)||timeout<1000)throw Error('Invalid timeout');
async function run(a){
 return new Promise(resolve=>{
  const child=spawn(process.execPath,[parser,...a],{stdio:'inherit',windowsHide:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill();},timeout);
  child.on('error',e=>{clearTimeout(timer);resolve({code:1,error:String(e),timedOut});});
  child.on('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal,timedOut});});
 });
}
let result=await run(args);
if(result.timedOut){
 const bi=args.indexOf('--backend'), backend=bi<0?'auto':args[bi+1];
 if(backend!=='cpu'){
  const reason=`GPU worker timed out after ${timeout} ms; process terminated; whole document batch retried on CPU. Prior running folder is incomplete.`;
  console.error(reason);
  if(bi>=0)args[bi+1]='cpu';else args.push('--backend','cpu');
  args.push('--supervisor-note',reason);result=await run(args);
 }
}
process.exitCode=result.timedOut?2:result.code??1;
