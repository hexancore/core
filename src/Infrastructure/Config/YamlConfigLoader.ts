import fs from 'fs';
import yaml from 'js-yaml';

export default (configFilePath: string): Record<string, any> => {
  if (!fs.existsSync(configFilePath)) {
    throw Error('Config file is not exists: ' + configFilePath);
  }
  return yaml.load(fs.readFileSync(configFilePath, 'utf8')) as Record<string, any>;
};
