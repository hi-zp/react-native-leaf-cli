export interface Config {
  version: string;
  depend: {
    android: string;
    ios: string;
  };
  entry: string;
  output: string;
  modules: string[];
}

export interface ScreenConfig {
  prefix: string;
  path: string;
  preload?: boolean;
  deeplink?: string;
}

export interface ModuleConfig {
  name?: string;
  prefix: string;
  version: string;
  entry?: string;
  screens?: ScreenConfig[];
}

export interface BuildOptions {
  platform: 'android' | 'ios';
  basics: boolean;
  modules?: string[];
  hermes: boolean;
}

export interface ScreenBuildConfig extends ScreenConfig {
  __screenDir: string;
  __entry: string;
}

export interface ModuleBuildConfig extends Omit<ModuleConfig, 'screens'> {
  __moduleDir: string;
  screens: ScreenBuildConfig[];
}

export interface ScreenModel {
  preload: boolean;
}

export interface ModuleModel {
  version: string;
  pack: string;
  md5: string;
  useCommon: boolean;
  screens: Record<string, ScreenModel>;
}

export interface EngineModel {
  engine: string;
  depend: string;
  pack: string;
  md5: string;
  modules: Record<string, ModuleModel>;
  deeplink: Record<string, string>;
}
