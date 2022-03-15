import path from 'path';
import { getOS } from './helpers';

interface BundleOptions {
  platform: string;
  dev?: boolean;
  entry: string;
  output: string;
  assets: string;
  config: string;
}

export const createBundle = (options: BundleOptions) => {
  const { platform, dev = false, entry, output, assets, config } = options;

  const cmd = [
    `react-native bundle`,
    `--platform ${platform}`,
    `--dev ${dev}`,
    `--entry-file ${entry}`,
    `--bundle-output ${output}`,
    `--assets-dest ${assets}`,
    `--config ${config}`,
  ];
  return cmd.join(' ');
};

interface HermesOptions {
  entry: string;
  output: string;
}

export const createHermes = (options: HermesOptions) => {
  const os = getOS();
  const binDir =
    os === 'mac' ? 'osx-bin' : os === 'win' ? 'win64-bin' : 'linux64-bin';
  const bin = path.join(
    process.cwd(),
    'node_modules',
    'hermes-engine',
    binDir,
    'hermesc'
  );
  return `${bin} ${options.entry} -emit-binary -out ${options.output}`;
};
