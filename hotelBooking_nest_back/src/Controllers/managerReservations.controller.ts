import { Controller, Get, Delete, Param, Query, Res, UseGuards, HttpStatus } from '@nestjs/common'
import { Response } from 'express';
import { RolesGuard } from '../Decorators/roles.decorator';
import { Role } from '../Decorators/setmetadata.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsProvider } from '../Providers/reservations.provider'
import { ReservationParams } from '../Interface/Reservations'

@Controller('/api/manager/reservations')
@UseGuards(RolesGuard)
@UseGuards(AuthGuard('jwt'))
export class ManagerReservationsController {
  constructor(private reservations: ReservationsProvider) {}

  @Role('manager')
  @Get('/')
  async getReservations(@Query() query: ReservationParams, @Res() res: Response): Promise<void> {
    const reservations = await this.reservations.getReservations(query);
    res.status(HttpStatus.OK).send(reservations);
  }

  @Role('manager')
  @Delete(':id')
  async deleteIdReservation(@Param('id') id, @Res() res: Response): Promise<void> {
    await this.reservations.removeReservation(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}