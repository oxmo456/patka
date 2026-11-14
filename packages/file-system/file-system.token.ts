import type {InjectionToken} from 'tsyringe';
import type {FileSystem} from './file-system.ts';

export const FILE_SYSTEM: InjectionToken<FileSystem> = Symbol('FileSystem');
