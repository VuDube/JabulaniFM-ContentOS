#!/usr/bin/env python3
import argparse,json,os
from pathlib import Path
def main():
 p=argparse.ArgumentParser();p.add_argument('--show',required=True);p.add_argument('--topic',required=True);p.add_argument('--output',required=True);a=p.parse_args(); data={'show_slug':a.show,'title':f'{a.topic} | JabulaniFM','hook':f'What South Africans should know about {a.topic}.','body':f'We break down {a.topic} with practical context for Mzansi.','cta':'Follow JabulaniFM for the next briefing.','full_script':f'What South Africans should know about {a.topic}. We break down the facts with practical context for Mzansi. Follow JabulaniFM for the next briefing.','affiliate_keywords':['South Africa',a.topic],'scene_descriptions':[f'Editorial visual for {a.topic}, South African context, vertical documentary photography' for _ in range(8)],'target_platforms':['youtube','tiktok','instagram']};Path(a.output).write_text(json.dumps(data,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
