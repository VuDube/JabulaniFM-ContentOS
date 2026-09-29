#!/usr/bin/env python3
import argparse,base64,json,os,requests,time
from pathlib import Path

def cloudflare(scene, index, out):
 token=os.getenv('CLOUDFLARE_API_TOKEN'); account=os.getenv('CLOUDFLARE_ACCOUNT_ID')
 if not token or not account:return False
 r=requests.post(f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/black-forest-labs/flux-2-klein-9b',headers={'Authorization':f'Bearer {token}'},files={'prompt':(None,scene),'width':(None,'1080'),'height':(None,'1920')},timeout=120)
 if r.ok:
  image=r.json().get('result',{}).get('image')
  if image:(out/f'scene_{index:02d}.jpg').write_bytes(base64.b64decode(image));return True
 return False

def public_fallback(scene,index,out):
 prompt=requests.utils.quote(f'{scene}, cinematic South African editorial photography, vertical 9:16')
 r=requests.get(f'https://image.pollinations.ai/prompt/{prompt}?width=1080&height=1920&model=flux&nologo=true',timeout=120)
 if r.ok and r.content:(out/f'scene_{index:02d}.jpg').write_bytes(r.content);return True
 return False

def main():
 p=argparse.ArgumentParser();p.add_argument('--script',required=True);p.add_argument('--output-dir',required=True);a=p.parse_args();out=Path(a.output_dir);out.mkdir(parents=True,exist_ok=True);data=json.load(open(a.script))
 for i,scene in enumerate(data['scene_descriptions'][:8]):
  if not cloudflare(scene,i,out):
   if not public_fallback(scene,i,out): raise RuntimeError(f'Image generation failed for scene {i+1}')
   if i<7:time.sleep(3)
if __name__=='__main__':main()
