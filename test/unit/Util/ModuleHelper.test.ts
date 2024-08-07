/**
 * @group unit
 */
import { HcAppModuleMeta, isModuleExists } from '@/Util/ModuleHelper';

describe('ModuleHelper', () => {
  describe('isModuleExists', () => {
    test('when exists', () => {
      expect(isModuleExists('@nestjs/common')).toBeTruthy();
    });

    test('when not exists', () => {
      expect(isModuleExists('jestaaa')).toBeFalsy();
    });
  });

  describe('HcAppModuleMeta', () => {
    test('when path contains valid Module path part', () => {
      const path = 'anypath/noise/src/Test/Infrastructure/somefile.ts';

      const current = HcAppModuleMeta.fromPath(path);

      expect(current).toEqual(new HcAppModuleMeta('Test', 'anypath/noise/src/Test'));

    });
  });

});
