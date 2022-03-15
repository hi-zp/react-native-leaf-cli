import fs from 'fs';
import util from 'util';
import path from 'path';
import child_process from 'child_process';

export function readJsonFileSync<T = any>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export const exec = util.promisify(child_process.exec);

export const rmdir = (dir: string) => {
  if (fs.existsSync(dir)) {
    const list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      const filename = path.join(dir, list[i]);
      if (fs.statSync(filename).isDirectory()) {
        rmdir(filename);
      } else {
        fs.unlinkSync(filename);
      }
    }
    fs.rmdirSync(dir);
  }
};
