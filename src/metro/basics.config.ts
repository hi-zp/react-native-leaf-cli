import { Dependency } from '../dependency';
import { modulePathParser } from './utils';

/**
 * A filter function to discard specific modules from the output.
 */
const processModuleFilter = (module: any) => {
  const modulePath = module.path;
  if (modulePath.indexOf('__prelude__') >= 0) {
    return false;
  }
  return true;
};

/**
 * Used to generate the module id for require statements.
 */
const createModuleIdFactory = () => {
  const deps = new Map<string, number>();
  const dependency = new Dependency('basics');
  dependency.cleanBasicsDependencies();
  return (moduleFullPath: string) => {
    const modulePath = modulePathParser(moduleFullPath, dependency.rootDir);
    if (deps.has(modulePath)) {
      return deps.get(modulePath);
    } else {
      const moduleId = deps.size;
      deps.set(modulePath, moduleId);
      dependency.makeBasicsDependencies(modulePath, moduleId);
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
  },
  projectRoot: process.cwd(),
};
