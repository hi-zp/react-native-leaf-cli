#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { checkPlatform } from './helpers';
import { Strange } from './strange';
import { BuildOptions } from './types';

const program = new Command();

program.description('🔥 leaf-react-native-cli');

// program.version('0.0.1', '-v, --version')

program
  .command('build')
  .option('-p, --platform [platform]')
  .option('-b, --basics [build basics]')
  .option('-m, --modules [module prefix]')
  .option('-h, --hermes [generate hermes bundle]')
  .action(async (opts) => {
    const platform = checkPlatform(opts.platform);
    if (!platform) {
      console.error('--platform Missing');
      process.exit(1);
    }

    const buildOptions: BuildOptions = {
      basics: !!opts.basics,
      modules: opts.modules,
      platform: opts.platform,
      hermes: !!opts.hermes,
    };

    if (buildOptions.modules) {
      buildOptions.modules =
        typeof buildOptions.modules === 'string' ? opts.modules.split(',') : [];
    }

    const strange = new Strange(buildOptions);

    buildOptions.basics && (await strange.buildBasics());
    if (buildOptions.modules) {
      await strange.buildModules();
      await strange.buildScreens();
      await strange.pack();
    }
  });

program
  .command('debug')
  .option('-m, --modules [module prefix]')
  .option('-p, --port [port]')
  .action(async (opts = {}) => {
    const strange = new Strange({
      basics: false,
      modules: typeof opts.modules === 'string' ? opts.modules.split(',') : [],
      platform: 'android',
      hermes: false,
    });

    await strange.debug();
  });

program.on('--help', () => {
  console.log('');
  console.log(chalk.green('Examples: pack android'));
});

program.parse(process.argv);
