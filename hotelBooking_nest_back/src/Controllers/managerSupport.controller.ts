import { Controller, Post, Get, Query, Res, HttpStatus, UseGuards } from '@nestjs/common'
import { Response } from 'express';
import { RolesGuard } from '../Decorators/roles.decorator';
import { Role } from '../Decorators/setmetadata.decorator';
import { AuthGuard } from '@nestjs/passport';
import { SupportProvider } from '../Providers/support.provider'

@Controller('/api/manager/support-requests')
@UseGuards(RolesGuard)
@UseGuards(AuthGuard('jwt'))
export class ManagerSupportController {
  constructor(private support: SupportProvider) {}

  @Role('manager')
  @Get('/')
  async getRequests(@Res() res: Response): Promise<void> {
    const requests = await this.support.getRequestsforManager();
    res.status(HttpStatus.OK).send(requests);
  }
}