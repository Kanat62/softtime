import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Roles, CurrentUser, ApiStandardErrors } from '../../common/decorators';
import { TenantPayload } from '../../common/tenant/tenant.context';

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
}
