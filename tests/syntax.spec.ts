import * as path from 'path';
import {getFiles, testUnusedProperties} from './utils';

describe('Syntax', () => {
  getFiles('syntax').forEach((fileName) =>
    it(path.basename(fileName), () => {
      const {actual, expected} = testUnusedProperties(fileName)
      expect(actual).toEqual(expected);
    }),
  );
});

