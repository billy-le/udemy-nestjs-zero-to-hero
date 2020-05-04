import { Test } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { UnauthorizedException } from '@nestjs/common';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

describe('JwtStrategy:', () => {
  let jwtStrategy: JwtStrategy;
  let userRepository;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { useFactory: mockUserRepository, provide: UserRepository },
      ],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
    jwtStrategy = await module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate:', () => {
    it('should authenticate the user', async () => {
      const user = new User();
      user.username = 'Test User';

      userRepository.findOne.mockResolvedValue(user);
      const results = await jwtStrategy.validate({ username: 'Test User' });
      expect(userRepository.findOne).toBeCalledWith({
        username: user.username,
      });
      expect(results).toEqual(user);
    });
  });

  it('should throw an unauthorized exception if a user is not found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    expect(jwtStrategy.validate({ username: 'bad username' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRepository.findOne).toBeCalledWith({ username: 'bad username' });
  });
});
