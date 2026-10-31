import{describe,expect,it}from'vitest';
import{EventService}from'./EventService';
import{EventStore}from'./EventStore';

describe('SQLite event persistence',()=>{
 it('restores events and statistics after service restart',()=>{const store=new EventStore(':memory:',30);const first=new EventService(500,store);first.simulate({type:'LIKE',username:'u',nickname:'U',likeCount:10});const restarted=new EventService(500,store);expect(restarted.recent()).toHaveLength(1);expect(restarted.stats.snapshot().simulated.likes).toBe(10);store.close()});
 it('deletes persisted history by source',()=>{const store=new EventStore(':memory:',30);const events=new EventService(500,store);events.simulate({type:'LIKE',username:'u',nickname:'U'});events.clear('SIMULATOR');expect(store.count()).toBe(0);expect(events.recent()).toHaveLength(0);store.close()});
});
