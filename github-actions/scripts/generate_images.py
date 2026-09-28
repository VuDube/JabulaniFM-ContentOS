#!/usr/bin/env python3
import argparse,base64,json,os,requests
from pathlib import Path
def main():
 p=argparse.ArgumentParser();p.add_argument('--script',required=True);p.add_argument('--output-dir',required=True);a=p.parse_args();out=Path(a.output_dir);out.mkdir(parents=True,exist_ok=True); data=json.load(open(a.script)); token=os.getenv('CLOUDFLARE_API_TOKEN'); account=os.getenv('CLOUDFLARE_ACCOUNT_ID');
 if not token or not account: raise RuntimeError('Cloudflare image generation credentials are required')
 for i,scene in enumerate(data['scene_descriptions'][:8]):
  r=requests.post(f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/black-forest-labs/flux-2-klein-9b',headers={'Authorization':f'Bearer {token}'},files={'prompt':(None,scene),'width':(None,'1080'),'height':(None,'1920')},timeout=120);r.raise_for_status(); image=r.json().get('result',{}).get('image');
  if not image: raise RuntimeError(f'No image returned for scene {i+1}')
  (out/f'scene_{i:02d}.jpg').write_bytes(base64.b64decode(image))
if __name__=='__main__':main()
