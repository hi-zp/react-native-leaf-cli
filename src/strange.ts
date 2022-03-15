import fs from 'fs';
import path from 'path';
import { createBundle } from './commands';
import { createRegisterTmpl } from './templates/register';
import {
  BuildOptions,
  Config,
  EngineModel,
  ModuleBuildConfig,
  ModuleConfig,
  ModuleModel,
  ScreenBuildConfig,
  ScreenModel,
} from './types';
import { exec, readJsonFileSync, rmdir } from './utils';
import ora from 'ora';
import chalk from 'chalk';
import child_process from 'child_process';
import { usedSecond } from './helpers';
import { createDebuggerTmpl } from './templates/debugger';

const spinner = ora();
const pathPosixSep = path.posix.sep;

export class Strange {
  public static setEnvironment(strange: Strange) {
    process.env[this.name] = JSON.stringify(strange);
  }

  public static getEnvironment() {
    return JSON.parse(process.env[this.name]) as Strange;
  }

  public readonly rootDir = process.cwd();
  public readonly strangeDir = path.join(this.rootDir, '.strange');

  public config: Config;
  // <module prefix, module config>
  public modulesBuildConfig: ModuleBuildConfig[] = [];

  private loadConfig() {
    this.config = readJsonFileSync<Config>(
      path.join(this.rootDir, 'strange.config.json')
    );
  }

  private makeStrangeDir() {
    if (!fs.existsSync(this.strangeDir)) {
      fs.mkdirSync(this.strangeDir);
    }
  }

  private get outputDir() {
    return path.join(
      this.rootDir,
      this.config.output,
      this.buildOptions.platform
    );
  }

  private makeOutputDir() {
    const outputDir = path.join(this.rootDir, this.config.output);
    const platformOutputDir = path.join(outputDir, this.buildOptions.platform);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
      fs.mkdirSync(platformOutputDir);
    } else if (!fs.existsSync(platformOutputDir)) {
      fs.mkdirSync(platformOutputDir);
    }
  }

  /**
   * handle configs and prepare for building
   * @param buildModules --modules values, default is []
   */
  private makeModulesRequirements(buildModules: BuildOptions['modules']) {
    for (let i = 0, len = this.config.modules.length; i < len; i++) {
      // read module config
      const moduleDir = path.join(this.rootDir, this.config.modules[i]);
      const moduleConfigFile = path.join(moduleDir, 'module.config.json');
      const moduleConfig = readJsonFileSync<ModuleConfig>(moduleConfigFile);

      // filter module when is not in building
      if (
        buildModules.length &&
        buildModules.indexOf(moduleConfig.prefix) === -1
      ) {
        continue;
      }

      // handle screen config and make screen entry file
      const screensBuildConfig = (moduleConfig.screens || []).map(
        (screenConfig) => {
          // make screen entry file
          const appKey = `${moduleConfig.prefix}_${screenConfig.prefix}`;
          const registerTmpl = createRegisterTmpl({
            appKey,
            import: path.relative(
              this.strangeDir,
              path.join(moduleDir, screenConfig.path)
            ),
          });
          const entryFile = path.join(this.strangeDir, `${appKey}.js`);
          fs.writeFileSync(entryFile, registerTmpl);

          return {
            ...screenConfig,
            __screenDir: moduleDir,
            __entry: entryFile,
          } as ScreenBuildConfig;
        }
      );

      // save config
      this.modulesBuildConfig.push({
        ...moduleConfig,
        __moduleDir: moduleDir,
        screens: screensBuildConfig,
      });
    }
  }

  constructor(public readonly buildOptions: BuildOptions) {
    this.makeStrangeDir();
    this.loadConfig();
    if (Array.isArray(buildOptions.modules)) {
      this.makeModulesRequirements(buildOptions.modules);
    }
    // for metro build
    Strange.setEnvironment(this);
  }

  public async buildBasics() {
    const { platform } = this.buildOptions;
    const { version } = this.config;

    const startTime = Date.now();
    let spinnerText = `${chalk.blue('Basics')} - <${version}>`;
    spinner.start(spinnerText);

    try {
      this.makeOutputDir();
      const command = createBundle({
        platform,
        entry: path.join(this.rootDir, this.config.entry),
        output: path.join(this.outputDir, `basics.${platform}.bundle`),
        assets: path.join(this.outputDir, 'res/'),
        config: path.join(__dirname, './metro/basics.config.js'),
      });
      await exec(command, {
        maxBuffer: 1024 * 10000,
        encoding: 'utf8',
        env: process.env,
      });

      spinner.succeed(spinnerText);
      console.log(
        chalk.green(
          `=== Pack ${chalk.cyan(
            `${platform} basics`
          )} success (used ${usedSecond(startTime)}) ===`
        )
      );
    } catch (err) {
      spinner.fail(spinnerText);
      console.log(
        chalk.red(`=== Pack ${chalk.cyan(`${platform} basics`)} fail ===`)
      );
      console.error(err);
    } finally {
      spinner.stop();
    }
  }

  public async buildModules() {
    const { platform } = this.buildOptions;

    const startTime = Date.now();
    let spinnerText = `${chalk.blue('Modules')}`;
    spinner.start(spinnerText);

    try {
      this.makeOutputDir();

      const commands: string[] = [];
      this.modulesBuildConfig.forEach((moduleBuildConfig) => {
        const { entry, __moduleDir, prefix } = moduleBuildConfig;
        if (entry) {
          // clean and make output dir
          const outputDir = path.join(this.outputDir, prefix);
          rmdir(outputDir);
          fs.mkdirSync(outputDir);

          // create command
          commands.push(
            createBundle({
              platform,
              entry: path.join(__moduleDir, entry),
              output: path.join(
                outputDir,
                `modules.${prefix}.${platform}.bundle`
              ),
              assets: path.join(outputDir, 'res/'),
              config: path.join(__dirname, './metro/modules.config.js'),
            })
          );
        }
      });

      await Promise.all(
        commands.map((command) =>
          exec(command, {
            maxBuffer: 1024 * 10000,
            encoding: 'utf8',
            env: process.env,
          })
        )
      );

      spinner.succeed(spinnerText);
      console.log(
        chalk.green(
          `=== Pack ${chalk.cyan(
            `${platform} modules`
          )} success (used ${usedSecond(startTime)}) ===`
        )
      );
    } catch (err) {
      spinner.fail(spinnerText);
      console.log(
        chalk.red(`=== Pack ${chalk.cyan(`${platform} modules`)} fail ===`)
      );
      console.error(err);
    } finally {
      spinner.stop();
    }
  }

  public async buildScreens() {
    const { platform } = this.buildOptions;

    const startTime = Date.now();
    let spinnerText = `${chalk.blue('Screens')}`;
    spinner.start(spinnerText);

    try {
      this.makeOutputDir();

      const commands: string[] = [];
      this.modulesBuildConfig.forEach(({ prefix: modulePrefix, screens }) => {
        screens.forEach((screenBuildConfig) => {
          // make output dir
          const outputDir = path.join(this.outputDir, modulePrefix);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }

          // create command
          commands.push(
            createBundle({
              platform,
              entry: screenBuildConfig.__entry,
              output: path.join(
                outputDir,
                `screens.${modulePrefix}_${screenBuildConfig.prefix}.${platform}.bundle`
              ),
              assets: path.join(outputDir, 'res/'),
              config: path.join(__dirname, './metro/screens.config.js'),
            })
          );
        });
      });

      await Promise.all(
        commands.map((command) => {
          return exec(command, {
            maxBuffer: 1024 * 10000,
            encoding: 'utf8',
            env: process.env,
          });
        })
      );

      spinner.succeed(spinnerText);
      console.log(
        chalk.green(
          `=== Pack ${chalk.cyan(
            `${platform} business`
          )} success (used ${usedSecond(startTime)}) ===`
        )
      );
    } catch (err) {
      spinner.fail(spinnerText);
      console.log(
        chalk.red(`=== Pack ${chalk.cyan(`${platform} business`)} fail ===`)
      );
      console.error(err);
    } finally {
      spinner.stop();
    }
  }

  public async pack() {
    const model: EngineModel = {
      engine: this.config.version,
      depend: this.config.depend[this.buildOptions.platform],
      pack: '',
      md5: '',
      modules: {},
      deeplink: {},
    };

    this.modulesBuildConfig.forEach((moduleBuildConfig) => {
      const moduleModel = {
        version: moduleBuildConfig.version,
        pack: '',
        md5: '',
        useCommon: !!moduleBuildConfig.entry,
        screens: {},
      } as ModuleModel;

      moduleBuildConfig.screens.forEach((screenBuildConfig) => {
        moduleModel.screens[screenBuildConfig.prefix] = {
          preload: !!screenBuildConfig.preload,
        } as ScreenModel;
        model.deeplink[
          screenBuildConfig.deeplink
        ] = `${moduleBuildConfig.prefix}_${screenBuildConfig.prefix}`;
      });

      model.modules[moduleBuildConfig.prefix] = moduleModel;
    });

    fs.writeFileSync(
      path.join(this.outputDir, 'version.json'),
      JSON.stringify(model, null, 2)
    );
  }

  public async debug(port = 8081) {
    const debuggerEntry = path.join(this.strangeDir, 'Debugger.tsx');

    fs.writeFileSync(
      debuggerEntry,
      createDebuggerTmpl({ modules: this.modulesBuildConfig })
    );

    let template = '';
    template += '// required entry\n';
    template += `import './${path.relative(this.rootDir, debuggerEntry)}'\n`;
    template += `import './${path.relative(
      this.rootDir,
      path.join(this.rootDir, this.config.entry)
    )}'\n`;

    this.modulesBuildConfig.forEach((moduleBuildConfig) => {
      if (moduleBuildConfig.entry) {
        template += `import './${path.relative(
          this.rootDir,
          path.join(moduleBuildConfig.__moduleDir, moduleBuildConfig.entry)
        )}'\n`;
      }
      moduleBuildConfig.screens.forEach((screenBuildConfig) => {
        if (screenBuildConfig.path) {
          template += `import './${path.relative(
            this.rootDir,
            screenBuildConfig.__entry
          )}'\n`;
        }
      });
    });

    fs.writeFileSync(path.join(this.rootDir, 'index.js'), template);

    console.log(
      chalk.green(`Strange Debug Serve will listening the PORT: ${port}`)
    );
    child_process.execSync(
      `node node_modules${pathPosixSep}react-native${pathPosixSep}local-cli${pathPosixSep}cli.js start --port ${port}`,
      { stdio: [0, 1, 2] }
    );
  }
}
