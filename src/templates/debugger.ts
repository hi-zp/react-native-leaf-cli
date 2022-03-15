import fs from 'fs';
import { ModuleBuildConfig } from '../types';

const MODULES = '__MODULESS__';

const TEMPLATE = `// Auto created By Strange CLI
import React from "react"
import { View, Text, Button, Navigation } from "@react-native-strange/core"
import { AppRegistry, ScrollView } from "react-native"
const modules = ${MODULES}
const App = () => {
  return (
    <View useSafeView>
      <ScrollView>
        {modules.map(({ prefix, name, screens }) => (
          <View style={{ padding: 12 }} key={prefix}>
            <Text h6>{name}</Text>
            {screens.map((screen) => (
              <Button key={screen} onPress={() => Navigation.push(\`\${prefix}_\${screen}\`)}>
                <Text>{screen}</Text>
              </Button>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
AppRegistry.registerComponent("StrangeDebugger", () => App)
export default App
`;

interface Options {
  modules: ModuleBuildConfig[];
}

export const createDebuggerTmpl = (options: Options) => {
  const tmplStr = JSON.stringify(
    options.modules.map(({ prefix, name, screens }) => ({
      prefix,
      name,
      screens: screens.map((s) => s.prefix),
    }))
  );
  return TEMPLATE.replace(MODULES, tmplStr);
};
