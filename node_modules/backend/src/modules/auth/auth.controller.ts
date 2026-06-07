import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardErrors } from '../../common/decorators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  registerCompanySchema,
  registerWorkerSchema,
  loginSchema,
} from '@softtime/shared';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';

class RegisterCompanyDto extends createZodDto(registerCompanySchema) {}
class RegisterWorkerDto extends createZodDto(registerWorkerSchema) {}
class LoginDto extends createZodDto(loginSchema) {}

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken обязателен'),
});
class RefreshDto extends createZodDto(refreshSchema) {}

const logoutSchema = z.object({
  fcmToken: z.string().optional(),
});
class LogoutDto extends createZodDto(logoutSchema) {}

@ApiTags('Auth')
@ApiStandardErrors()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register/company')
  @ApiOperation({ summary: 'Регистрация ADMIN + компании' })
  registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  @Public()
  @Post('register/worker')
  @ApiOperation({ summary: 'Регистрация WORKER по коду компании' })
  registerWorker(@Body() dto: RegisterWorkerDto) {
    return this.authService.registerWorker(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход (email + пароль)' })
  login(@Body() dto: LoginDto, @Req() req: any) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      '0.0.0.0';
    return this.authService.login(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить токены по refresh-токену' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Инвалидация refresh-токена и FCM' })
  async logout(
    @CurrentUser() user: { userId: string },
    @Body() dto: LogoutDto,
  ) {
    await this.authService.logout(user.userId, dto.fcmToken);
  }
}
