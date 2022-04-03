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

const toMatrix = <T>(array: Array<T>, length: number) => {
  const matrix: Array<Array<T>> = [];

  for (let i = 0, len = array.length; i < len; i++) {
    const index = Math.floor(i / length);
    if (!matrix[index]) {
      matrix[index] = [];
    }
    matrix[index].push(array[i]);
  }

  return matrix;
};

export async function promiseAll<T>(
  values: Array<PromiseLike<T>>,
  thread: number
): Promise<T[]> {
  let results: T[] = [];
  const matrixPromises = toMatrix(values, thread);

  for (let i = 0, len = matrixPromises.length; i < len; i++) {
    const result = await Promise.all(matrixPromises[i]);
    results = results.concat(result);
  }

  return results;
}
