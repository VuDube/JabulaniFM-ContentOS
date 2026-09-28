#!/usr/bin/env python3
import argparse,json,os,requests
def main():
 p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--script',required=True);p.add_argument('--webhook',required=True);a=p.parse_args();s=json.load(open(a.script));h={'Content-Type':'application/json','x-pd-upload-body':'1'};reg=requests.post(a.webhook,json={'action':'register_upload','filename':os.path.basename(a.video),'size':os.path.getsize(a.video),'show_slug':s['show_slug'],'title':s['title'],'description':s['cta'],'tags':s['affiliate_keywords']},headers=h,timeout=30);reg.raise_for_status();d=reg.json();put=requests.put(d['upload_url'],data=open(a.video,'rb'),headers={'Content-Type':'video/mp4'},timeout=300);put.raise_for_status();requests.post(a.webhook,json={'action':'confirm_upload','upload_id':d['upload_id']},headers=h,timeout=30).raise_for_status()
if __name__=='__main__':main()
