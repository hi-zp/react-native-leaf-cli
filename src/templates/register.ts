import { replacePathSep } from '../helpers';

const ENTRY = '__ENTRY__';
const APPKEY = '__APPKEY__';

const TEMPLATE = `// Auto created By Strange CLI
import App from "${ENTRY}"
import { AppRegistry } from "react-native"
AppRegistry.registerComponent("${APPKEY}", () => App)
export default App
`;

interface Options {
  appKey: string;
  import: string;
}

export const createRegisterTmpl = (options: Options) => {
  return TEMPLATE.replace(ENTRY, replacePathSep(options.import)).replace(
    APPKEY,
    options.appKey
  );
};
