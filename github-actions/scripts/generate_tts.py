#!/usr/bin/env python3
import argparse,json,subprocess
def main():
 p=argparse.ArgumentParser();p.add_argument('--script',required=True);p.add_argument('--output',required=True);p.add_argument('--voice',default='en-ZA-LeahNeural');a=p.parse_args(); data=json.load(open(a.script)); subprocess.run(['edge-tts','--voice',a.voice,'--text',data['full_script'],'--write-media',a.output],check=True)
if __name__=='__main__':main()
