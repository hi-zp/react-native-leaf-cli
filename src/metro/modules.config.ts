import { Dependency } from '../dependency';
import { processModuleFilterWrapper, modulePathParser } from './utils';

let dependency: Dependency;

/**
 * A filter function to discard specific modules from the output.
 */
const processModuleFilter = processModuleFilterWrapper((module: any) => {
  const modulePath = modulePathParser(module.path, dependency.rootDir);
  return !dependency.hasInBasicsDependencies(modulePath);
});

/**
 * init current build information
 */
const getModulesRunBeforeMainModule = (entryFilePath: string) => {
  dependency = new Dependency('modules');
  dependency.setCurrentByEntryFilePath(entryFilePath);
  dependency.cleanModulesDependencies();
  return [];
};

/**
 * Used to generate the module id for require statements.
 */
const createModuleIdFactory = () => {
  const deps = new Map<string, number>();
  return (moduleFullPath: string) => {
    const modulePath = modulePathParser(moduleFullPath, dependency.rootDir);
    if (deps.has(modulePath)) {
      return deps.get(modulePath);
    } else if (dependency.hasInBasicsDependencies(modulePath)) {
      return dependency.getModuleIdByModulePath(modulePath);
    } else {
      const moduleId = (1 + dependency.currentModuleIndex) * 100000 + deps.size;
      deps.set(modulePath, moduleId);
      dependency.makeModulesDependencies(modulePath, moduleId);
      return moduleId;
    }
  };
};

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: false,
      },
    }),
  },
  serializer: {
    createModuleIdFactory,
    processModuleFilter,
    getModulesRunBeforeMainModule,
  },
  projectRoot: process.cwd(),
};
