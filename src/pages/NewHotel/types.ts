export interface ImagesRooms {
  standart: [Blob | string | null, Blob | string | null];
  lux: [Blob | string | null, Blob | string | null];
  [key: string]: [Blob | string | null, Blob | string | null];
}

export interface NewHotel {
  nameHotel: string;
  descriptionHotel: string;
  imageHotel: string | Blob | null
}