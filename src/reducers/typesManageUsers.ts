export interface SendUser {
  id: string
  email: string
  name: string
  contactPhone: string
  role: string
}

export interface changeUserSearchParams {
  email?: string
  name?: string
  contactPhone?: string
  offset?: number
}

export interface NewUser {
  name: string,
  email: string,
  contactPhone: string,
  password: string,
  role: string
}

export interface NewClient {
  name: string,
  email: string,
  contactPhone: string,
  password: string
}

export interface UserAuth {
  email: string,
  password: string
}