import path from 'path';
import fs from 'fs';
import { Strange } from './strange';
import { ModuleBuildConfig, ScreenBuildConfig } from './types';

const pathSep = path.sep;

type BuildType = 'basics' | 'modules' | 'screens';

export class Dependency {
  public env = Strange.getEnvironment();
  public rootDir = this.env.rootDir;
  public buildOptions = this.env.buildOptions;
  public modulesBuildConfig = this.env.modulesBuildConfig;

  public currentModuleBuildConfig: ModuleBuildConfig;
  public currentModuleIndex: number;
  public currentScreenBuildConfig: ScreenBuildConfig;
  public currentScreenIndex: number;

  private basicsDeps = new Map<string, number>();
  private modulesDeps = new Map<string, number>();

  constructor(public readonly buildType: BuildType) {}

  private get outputDir() {
    return `${this.rootDir}${pathSep}.strange`;
  }

  private get outputBasicsDeps() {
    return `${this.outputDir}${pathSep}basics.${this.buildOptions.platform}.txt`;
  }

  private get outputModulesDeps() {
    const { prefix } = this.currentModuleBuildConfig;
    return `${this.outputDir}${pathSep}modules.${prefix}.${this.buildOptions.platform}.txt`;
  }

  private get outputScreensDeps() {
    const { prefix } = this.currentModuleBuildConfig;
    const { prefix: screenPrefix } = this.currentScreenBuildConfig;
    return `${this.outputDir}${pathSep}modules.${prefix}_${screenPrefix}.${this.buildOptions.platform}.txt`;
  }

  public setCurrentByEntryFilePath(entryFilePath: string) {
    this.modulesBuildConfig.forEach((moduleBuildConfig, moduleIndex) => {
      if (this.buildType === 'screens') {
        moduleBuildConfig.screens.forEach((screenBuildConfig, screenIndex) => {
          const existPath = screenBuildConfig.__entry;
          if (
            existPath.length - entryFilePath.length ===
            existPath.lastIndexOf(entryFilePath)
          ) {
            this.currentModuleBuildConfig = moduleBuildConfig;
            this.currentModuleIndex = moduleIndex;
            this.currentScreenBuildConfig = screenBuildConfig;
            this.currentScreenIndex = screenIndex;
          }
        });
      } else {
        const existPath = path.join(
          moduleBuildConfig.__moduleDir,
          moduleBuildConfig.entry
        );
        if (
          existPath.length - entryFilePath.length ===
          existPath.lastIndexOf(entryFilePath)
        ) {
          this.currentModuleBuildConfig = moduleBuildConfig;
          this.currentModuleIndex = moduleIndex;
        }
      }
    });
  }

  /**
   * clean basics dependencies
   */
  public cleanBasicsDependencies() {
    if (fs.existsSync(this.outputBasicsDeps)) {
      fs.truncateSync(this.outputBasicsDeps);
    }
  }

  /**
   * clean modules dependencies
   */
  public cleanModulesDependencies() {
    if (fs.existsSync(this.outputModulesDeps)) {
      fs.truncateSync(this.outputModulesDeps);
    }
  }

  /**
   * clean screens dependencies
   */
  public cleanScreensDependencies() {
    if (fs.existsSync(this.outputScreensDeps)) {
      fs.truncateSync(this.outputScreensDeps);
    }
  }

  /**
   * create basics dependencies
   * @param modulePath module path
   */
  public makeBasicsDependencies(modulePath: string, moduleId: number) {
    if (fs.existsSync(this.outputDir)) {
      fs.appendFileSync(this.outputBasicsDeps, `${modulePath}|${moduleId}\n`);
    } else {
      fs.mkdirSync(this.outputDir);
      fs.writeFileSync(this.outputBasicsDeps, modulePath);
    }
  }

  /**
   * create modules dependencies
   * @param modulePath module path
   */
  public makeModulesDependencies(modulePath: string, moduleId: number) {
    if (fs.existsSync(this.outputModulesDeps)) {
      fs.appendFileSync(this.outputModulesDeps, `${modulePath}|${moduleId}\n`);
    } else {
      fs.writeFileSync(this.outputModulesDeps, modulePath);
    }
  }

  /**
   * create screens dependencies
   * @param modulePath module path
   */
  public makeScreensDependencies(modulePath: string, moduleId: number) {
    if (fs.existsSync(this.outputScreensDeps)) {
      fs.appendFileSync(this.outputScreensDeps, `${modulePath}|${moduleId}\n`);
    } else {
      fs.writeFileSync(this.outputScreensDeps, modulePath);
    }
  }

  /**
   * load from dependencies txt which saved
   */
  public hasInBasicsDependencies(modulePath: string): boolean {
    if (fs.existsSync(this.outputBasicsDeps) && this.basicsDeps.size === 0) {
      String(fs.readFileSync(this.outputBasicsDeps))
        .split('\n')
        .forEach((dep) => {
          if (dep.length > 0) {
            const [path, id] = dep.split('|');
            this.basicsDeps.set(path, Number(id));
          }
        });
    }
    return this.basicsDeps.has(modulePath);
  }

  public hasInModulesDependencies(modulePath: string): boolean {
    if (fs.existsSync(this.outputModulesDeps) && this.modulesDeps.size === 0) {
      String(fs.readFileSync(this.outputModulesDeps))
        .split('\n')
        .forEach((dep) => {
          if (dep.length > 0) {
            const [path, id] = dep.split('|');
            this.modulesDeps.set(path, Number(id));
          }
        });
    }
    return this.modulesDeps.has(modulePath);
  }

  public getModuleIdByModulePath(modulePath: string) {
    return this.basicsDeps.get(modulePath) ?? this.modulesDeps.get(modulePath);
  }
}
