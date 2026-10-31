import{mkdirSync}from'node:fs';
import{dirname,resolve}from'node:path';
import{fileURLToPath}from'node:url';
import Database from'better-sqlite3';
import type{EventSource,LiveEvent}from'@live/shared';

interface EventRow{event_json:string}

export function getDefaultEventDatabasePath():string{return resolve(fileURLToPath(new URL('../../../../data/tiktok-live.db',import.meta.url)))}

export class EventStore{
 private readonly database:Database.Database;
 private readonly insertEvent:Database.Statement;
 constructor(databasePath=getDefaultEventDatabasePath(),retentionDays=30){
  if(databasePath!==':memory:')mkdirSync(dirname(databasePath),{recursive:true});
  this.database=new Database(databasePath);this.database.pragma('journal_mode = WAL');
  this.database.exec('CREATE TABLE IF NOT EXISTS live_events (id TEXT PRIMARY KEY, source TEXT NOT NULL, type TEXT NOT NULL, event_json TEXT NOT NULL, timestamp INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_live_events_timestamp ON live_events(timestamp DESC); CREATE INDEX IF NOT EXISTS idx_live_events_source ON live_events(source);');
  this.insertEvent=this.database.prepare('INSERT OR REPLACE INTO live_events (id,source,type,event_json,timestamp) VALUES (@id,@source,@type,@eventJson,@timestamp)');
  this.prune(retentionDays);
 }
 save(event:LiveEvent):void{this.insertEvent.run({id:event.id,source:event.source,type:event.type,eventJson:JSON.stringify(event),timestamp:event.timestamp})}
 loadRecent(limit:number):LiveEvent[]{const rows=this.database.prepare('SELECT event_json FROM live_events ORDER BY timestamp DESC LIMIT ?').all(limit)as EventRow[];return rows.flatMap(row=>{try{return[JSON.parse(row.event_json)as LiveEvent]}catch{return[]}})}
 clear(source?:EventSource):void{if(source)this.database.prepare('DELETE FROM live_events WHERE source = ?').run(source);else this.database.prepare('DELETE FROM live_events').run()}
 prune(retentionDays:number):void{const safeDays=Number.isFinite(retentionDays)&&retentionDays>0?retentionDays:30;this.database.prepare('DELETE FROM live_events WHERE timestamp < ?').run(Date.now()-safeDays*86400000)}
 count():number{return(this.database.prepare('SELECT COUNT(*) AS total FROM live_events').get()as{total:number}).total}
 close():void{this.database.close()}
}
