#!/usr/bin/env python3
import argparse,glob,subprocess
def main():
 p=argparse.ArgumentParser();p.add_argument('--audio',required=True);p.add_argument('--images',required=True);p.add_argument('--output',required=True);p.add_argument('--resolution',default='1080x1920');a=p.parse_args(); images=sorted(glob.glob(a.images+'/*.jpg'));
 if not images: raise RuntimeError('No generated images found')
 concat='/tmp/jabulanifm-images.txt';open(concat,'w').write(''.join(f"file '{x}'\nduration 3\n" for x in images));subprocess.run(['ffmpeg','-y','-f','concat','-safe','0','-i',concat,'-i',a.audio,'-vf',f'scale={a.resolution}:force_original_aspect_ratio=decrease,pad={a.resolution}:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-c:a','aac','-shortest',a.output],check=True)
if __name__=='__main__':main()
