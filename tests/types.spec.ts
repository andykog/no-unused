import * as path from 'path';
import {getFiles, testUnusedProperties} from './utils';

describe('Types', () => {
  getFiles('types').forEach((fileName) =>
    it(path.basename(fileName), () => {
      const {actual, expected} = testUnusedProperties(fileName)
      expect(actual).toEqual(expected);
    }),
  );
});

