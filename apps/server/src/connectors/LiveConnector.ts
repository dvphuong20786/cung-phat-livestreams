import type {EventEmitter} from 'node:events';
import type {ConnectionStatus} from '@live/shared';

export interface LiveConnector extends EventEmitter {
  status: ConnectionStatus;
  connect(username:string,autoReconnect?:boolean):Promise<void>;
  disconnect(explicit?:boolean):Promise<void>;
}
