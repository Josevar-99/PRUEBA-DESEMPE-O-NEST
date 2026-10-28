import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * User registration. Only an ADMIN can execute it (see AuthController).
   * Does not return a token: the created user gets their own token with their own login,
   * so the admin never receives another person's credentials.
   */
  async register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  /**
   * Login: validates credentials and generates the JWT (requirement 1.4).
   */
  async login(loginDto: LoginDto) {
    // findByEmail includes the hash on purpose (password has select: false)
    const user = await this.usersService.findByEmail(loginDto.email);

    // Same message whether the email does not exist or the password is wrong,
    // to avoid revealing which emails are registered
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Checked after the password: without it you cannot know if the account is inactive
    if (!user.isActive) {
      throw new UnauthorizedException('The account is inactive');
    }

    const token = await this.generateToken(user.id, user.email, user.role);
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  /**
   * Signs the JWT with JWT_SECRET and JWT_EXPIRES_IN (configured in AuthModule).
   * The payload is what JwtAuthGuard puts in request.user and @CurrentUser() delivers:
   * sub = user id, used to find the mechanic for the TECHNICIAN.
   */
  private async generateToken(sub: string, email: string, role: string) {
    const payload = { sub, email, role };
    return this.jwtService.signAsync(payload);
  }
}