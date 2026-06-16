import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { companyRequisitesSchema } from '@softtime/shared';
import { CompaniesService } from './companies.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

class CompanyRequisitesDto extends createZodDto(companyRequisitesSchema) {}

@ApiTags('Companies')
@ApiStandardErrors()
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Своя компания + companyCode + статус подписки' })
  getMyCompany(@CurrentUser() user: TenantPayload) {
    return this.companiesService.getMyCompany(user.companyId!);
  }

  @Get('me/requisites')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Реквизиты компании для СТИ-161' })
  getRequisites(@CurrentUser() user: TenantPayload) {
    return this.companiesService.getRequisites(user.companyId!);
  }

  @Patch('me/requisites')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Обновить реквизиты компании для СТИ-161' })
  updateRequisites(
    @CurrentUser() user: TenantPayload,
    @Body() body: CompanyRequisitesDto,
  ) {
    return this.companiesService.updateRequisites(user.companyId!, user.userId, body);
  }
}
