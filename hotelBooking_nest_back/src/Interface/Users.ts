export class CreateUser {
  email: string
  password: string
  name: string
  contactPhone: string
  role?: string
}

export class UserToJWTPayload {
  id: string
  email: string
  role: string
}

export class SendUser {
  id: string
  email: string
  name: string
  contactPhone: string
  role?: string
}

export class ValidatedToken {
  token: string
  userData: SendUser
}

export class SearchUserParams {
  limit: number
  offset: number
  email: string
  name: string
  contactPhone: string
}