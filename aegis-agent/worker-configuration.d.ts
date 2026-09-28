declare interface Ai { run(model:string,input:unknown):Promise<unknown> } declare interface Env { AI:Ai; DB:D1Database; KV:KVNamespace; CONTENT_QUEUE:Queue; ASSETS:Fetcher }
