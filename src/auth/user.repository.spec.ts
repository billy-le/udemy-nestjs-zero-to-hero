import { Test } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

const mockCredentialsDto: AuthCredentialsDto = {
  username: 'Test User',
  password: '123',
};

describe('UserRepository', () => {
  let userRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('signUp:', () => {
    let save;

    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({
        save,
      });
    });

    it('should sign up a new user', async () => {
      save.mockResolvedValue(undefined);
      await expect(
        userRepository.signUp(mockCredentialsDto),
      ).resolves.not.toThrow();
    });

    it('should throw conflict exception because username already exists', async () => {
      save.mockRejectedValue({ code: '23505' });
      await expect(userRepository.signUp(mockCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw internal server error if something went wrong', async () => {
      save.mockRejectedValue({ code: '12341' });
      await expect(userRepository.signUp(mockCredentialsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateUserPassword:', () => {
    let user;

    beforeEach(() => {
      user = new User();
      user.username = 'Test User';
      user.validatePassword = jest.fn();
      userRepository.findOne = jest.fn();
    });

    it('returns the username as validation is successful', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(true);

      await expect(
        userRepository.validateUserPassword('password'),
      ).resolves.toBe(user.username);
    });

    it('returns null is a username is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      user.validatePassword.mockResolvedValue();

      await expect(
        userRepository.validateUserPassword('password'),
      ).resolves.toBe(null);
      expect(user.validatePassword).not.toHaveBeenCalled();
    });

    it('returns null if password is incorrect', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(false);

      await expect(
        userRepository.validateUserPassword('password'),
      ).resolves.toBe(null);
    });
  });

  describe('hashPassword:', () => {
    it('should call bcrypt.hash() to generate a hash', async () => {
      (bcrypt as any).hash = jest.fn().mockResolvedValue('someHash');

      expect(bcrypt.hash).not.toHaveBeenCalled;
      const results = await userRepository.hashPassword(
        'test password',
        'salt',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('test password', 'salt');
      expect(results).toBe('someHash');
    });
  });
});
