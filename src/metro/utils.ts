import path from 'path';

const pathSep = path.sep;

type ProcessModuleFilter = (module: any) => boolean;

export const processModuleFilterWrapper = (
  processModuleFilter: ProcessModuleFilter
): ProcessModuleFilter => {
  return (module: any) => {
    const modulePath = module.path;
    // 过滤掉path为__prelude__的一些模块（基础包内已有）
    if (
      modulePath.indexOf('__prelude__') >= 0 ||
      modulePath.indexOf(
        `${pathSep}node_modules${pathSep}react-native${pathSep}Libraries${pathSep}polyfills`
      ) >= 0 ||
      modulePath.indexOf('source-map') >= 0 ||
      modulePath.indexOf(
        `${pathSep}node_modules${pathSep}metro${pathSep}src${pathSep}lib${pathSep}polyfills${pathSep}`
      ) >= 0
    ) {
      return false;
    }
    // 过滤掉node_modules内的模块（基础包内已有）
    if (modulePath.indexOf(`${pathSep}node_modules${pathSep}`) > 0) {
      /*
        但输出类型为js/script/virtual的模块不能过滤，一般此类型的文件为核心文件，
        如InitializeCore.js。每次加载bundle文件时都需要用到。
      */
      if (`js${pathSep}script${pathSep}virtual` === module.output[0].type) {
        return true;
      }

      // 添加这个判断，让@babel/runtime打进包去
      if (
        modulePath.indexOf(
          `${pathSep}node_modules${pathSep}@babel${pathSep}runtime${pathSep}helpers`
        ) > 0
      ) {
        return true;
      }
    }

    return processModuleFilter(module);
  };
};

export const modulePathParser = (moduleFullPath: string, rootPath: string) => {
  const basename = path.basename(rootPath);
  return moduleFullPath.substring(moduleFullPath.indexOf(basename));
};
