import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

describe('UserEntity:', () => {
  describe('validatePassword:', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
      user.salt = 'test salt';
      user.password = 'test password';
      (bcrypt as any).hash = jest.fn();
    });

    it('should return true if password is valid', async () => {
      (bcrypt as any).hash.mockReturnValue('test password');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      const results = await user.validatePassword('test password');
      expect(bcrypt.hash).toBeCalledWith('test password', 'test salt');
      expect(results).toEqual(true);
    });

    it('should return false is password is invalid', async () => {
      (bcrypt as any).hash.mockReturnValue('wrong password');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      const results = await user.validatePassword('test password');
      expect(bcrypt.hash).toBeCalledWith('test password', 'test salt');
      expect(results).toEqual(false);
    });
  });
});
