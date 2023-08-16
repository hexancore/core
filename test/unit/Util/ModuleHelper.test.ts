import { isModuleExists } from '@/Util/ModuleHelper';

describe('ModuleHelper', () => {
  describe('isModuleExists', () => {
    test('when exists', () => {
      expect(isModuleExists('jest')).toBeTruthy();
    });

    test('when not exists', () => {
      expect(isModuleExists('jestaaa')).toBeFalsy();
    });
  });
});
