import fs from 'fs';
import crypto from 'crypto';
import util from 'util';
import path from 'path';
import child_process from 'child_process';
import os from 'os';
import archiver from 'archiver';

export const isVersion = (val: unknown) => {
  if (typeof val !== 'string') {
    return false;
  }
  return val.split('.').length === 3 && /^v/.test(val);
};

export const checkPlatform = (val: unknown): 'android' | 'ios' | undefined => {
  if (val === 'android' || val === 'ios') {
    return val;
  } else {
    return undefined;
  }
};

export const md5 = (file: fs.PathLike): Promise<string> =>
  new Promise((resolve) => {
    const stream = fs.createReadStream(file);
    const fsHash = crypto.createHash('md5');
    stream.on('data', (d) => fsHash.update(d));
    stream.on('end', () => resolve(fsHash.digest('hex')));
  });

export const syncMd5 = (text: string) =>
  crypto.createHash('md5').update(text).digest('hex').toString();

export const asyncExec = util.promisify(child_process.exec);

export const replacePathSep = (pathString: string) =>
  pathString.split(path.sep).join('/');

export const getOS = (): 'mac' | 'win' | 'linux' => {
  const p = os.platform();
  if (p === 'darwin') {
    return 'mac';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } else if (p === 'win32' || p === 'cygwin' || p === 'win64') {
    return 'win';
  } else {
    return 'linux';
  }
};

export const rmdir = (dir: string) => {
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
};

export const buildExec = (cmd: string) =>
  asyncExec(cmd, {
    maxBuffer: 1024 * 10000,
    encoding: 'utf8',
    env: process.env,
  });

export const compress = (inputPath: string, outputPath: string) =>
  new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 },
      forceZip64: false,
    });

    const output = fs.createWriteStream(outputPath);

    if (fs.statSync(inputPath).isFile()) {
      archive.file(inputPath, {
        name: inputPath.split(path.sep).pop(),
        date: '2022-01-01T08:08:083Z',
      });
    } else {
      archive.directory(inputPath, inputPath.split(path.sep).pop(), {
        date: '2022-01-01T08:08:083Z',
      });
    }

    output.on('close', resolve);

    output.on('end', reject);

    archive.pipe(output);

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);

    archive.finalize();
  });

export const usedSecond = (start: number) => {
  return Math.floor((Date.now() - start) / 100) / 10 + 's';
};
