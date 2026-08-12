import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Reservation, ReservationDocument } from "../Models/Reservations";

export interface Metric {
  /** Значение за текущий период */
  value: number;
  /** Изменение к предыдущему периоду в процентах */
  delta: number;
  /** Ряд по дням для спарклайна */
  series: number[];
}

export interface ManagerStats {
  revenue: Metric;
  bookings: Metric;
  upcoming: Metric;
  staying: Metric;
  days: number;
}

const DAY_MS = 86_400_000;

/**
 * Агрегаты для дашборда менеджера.
 *
 * Раньше плитки показывали только текущее значение — без ряда и без сравнения
 * с прошлым периодом «8 броней» не несёт управленческого смысла.
 */
@Injectable()
export class StatsProvider {
  constructor(@InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>) {}

  async managerStats(days = 30): Promise<ManagerStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = new Date(startOfToday.getTime() - (days - 1) * DAY_MS);
    const prevFrom = new Date(from.getTime() - days * DAY_MS);

    // Стоимость брони считается как цена номера × количество ночей:
    // отдельного поля с суммой в модели нет.
    const rows = await this.reservationModel.aggregate<{
      day: string;
      period: "current" | "previous";
      count: number;
      revenue: number;
    }>([
      { $match: { dateStart: { $gte: prevFrom, $lt: new Date(startOfToday.getTime() + DAY_MS) } } },
      {
        $lookup: { from: "rooms", localField: "roomId", foreignField: "_id", as: "room" },
      },
      { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          nights: {
            $max: [1, { $ceil: { $divide: [{ $subtract: ["$dateEnd", "$dateStart"] }, DAY_MS] } }],
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$dateStart" } },
            period: { $cond: [{ $gte: ["$dateStart", from] }, "current", "previous"] },
          },
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: [{ $ifNull: ["$room.price", 0] }, "$nights"] } },
        },
      },
      { $project: { _id: 0, day: "$_id.day", period: "$_id.period", count: 1, revenue: 1 } },
    ]);

    const current = rows.filter((r) => r.period === "current");
    const previous = rows.filter((r) => r.period === "previous");

    const byDay = new Map(current.map((r) => [r.day, r]));
    const revenueSeries: number[] = [];
    const bookingSeries: number[] = [];
    for (let i = 0; i < days; i++) {
      const key = new Date(from.getTime() + i * DAY_MS).toISOString().slice(0, 10);
      revenueSeries.push(byDay.get(key)?.revenue ?? 0);
      bookingSeries.push(byDay.get(key)?.count ?? 0);
    }

    const sum = (list: typeof rows, field: "count" | "revenue") => list.reduce((s, r) => s + r[field], 0);

    const [upcoming, staying] = await Promise.all([
      this.reservationModel.countDocuments({ dateStart: { $gt: now } }),
      this.reservationModel.countDocuments({ dateStart: { $lte: now }, dateEnd: { $gte: now } }),
    ]);

    return {
      days,
      revenue: {
        value: sum(current, "revenue"),
        delta: this.delta(sum(current, "revenue"), sum(previous, "revenue")),
        series: revenueSeries,
      },
      bookings: {
        value: sum(current, "count"),
        delta: this.delta(sum(current, "count"), sum(previous, "count")),
        series: bookingSeries,
      },
      // Предстоящие и текущие заезды — снимок на сейчас, ряд показывает
      // распределение броней по дням, чтобы плитка не оставалась пустой.
      upcoming: { value: upcoming, delta: 0, series: bookingSeries },
      staying: { value: staying, delta: 0, series: bookingSeries },
    };
  }

  private delta(current: number, previous: number): number {
    if (!previous) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
}
