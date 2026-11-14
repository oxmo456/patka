import type * as nodeFileSystem from 'node:fs';

export type FileSystem = Pick<typeof nodeFileSystem, 'lstatSync' | 'realpathSync'> & {
  readonly promises: Pick<
    typeof nodeFileSystem.promises,
    'mkdir' | 'readdir' | 'readFile' | 'writeFile'
  >;
};
