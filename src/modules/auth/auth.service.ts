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
   * Registro de usuario. Solo un ADMIN puede ejecutarlo (ver AuthController).
   * No devuelve token: el usuario creado obtiene el suyo con su propio login,
   * así el admin nunca recibe credenciales de otra persona.
   */
  async register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  /**
   * Inicio de sesión: valida credenciales y genera el JWT (requisito 1.4).
   */
  async login(loginDto: LoginDto) {
    // findByEmail incluye el hash a propósito (password tiene select: false)
    const user = await this.usersService.findByEmail(loginDto.email);

    // Mismo mensaje si el email no existe o la contraseña es incorrecta,
    // para no revelar qué correos están registrados
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Se revisa después de la contraseña: sin ella no se puede saber si la cuenta está inactiva
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta se encuentra inactiva');
    }

    const token = await this.generateToken(user.id, user.email, user.role);
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  /**
   * Firma el JWT con JWT_SECRET y JWT_EXPIRES_IN (configurados en AuthModule).
   * El payload es lo que JwtAuthGuard pone en request.user y @CurrentUser() entrega:
   * sub = id del usuario, usado para encontrar el mecánico del TECHNICIAN.
   */
  private async generateToken(sub: string, email: string, role: string) {
    const payload = { sub, email, role };
    return this.jwtService.signAsync(payload);
  }
}