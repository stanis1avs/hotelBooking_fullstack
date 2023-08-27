import { Controller, Post, Body, Get, Delete, Param, Request, Res, UseGuards, HttpStatus } from '@nestjs/common'
import { Response } from 'express';
import { RolesGuard } from '../Decorators/roles.decorator';
import { Role } from '../Decorators/setmetadata.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CreateReservation } from '../Interface/Reservations'
import { ReservationsProvider } from '../Providers/reservations.provider'

@Controller('/api/client/reservations')
@UseGuards(RolesGuard)
@UseGuards(AuthGuard('jwt'))
export class ClientReservationsController {
  constructor(private reservations: ReservationsProvider) {}

  @Role('client')
  @Post('/')
  async createReservation(@Body() data: CreateReservation, @Request() req, @Res() res: Response): Promise<void> {
    const reservation = await this.reservations.createReservation(data, req.user.id);
    res.status(HttpStatus.CREATED).send(reservation);
  }

  // @Role('client')
  // @UseGuards(RolesGuard)
  // @UseGuards(AuthGuard('jwt'))
  @Role('client')
  @Get('/')
  async getReservations(@Request() req, @Res() res: Response): Promise<void> {
    const reservations = await this.reservations.getReservationById(req.user.id);
    res.status(HttpStatus.OK).send(reservations);
  }

  @Role('client')
  @Delete(':id')
  async deleteReservations(@Param('id') id, @Request() req, @Res() res: Response): Promise<void> {
    await this.reservations.removeReservation(id, req.user.id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}