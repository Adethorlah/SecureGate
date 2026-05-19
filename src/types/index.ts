export type ActionResult = {
  success?: boolean
  error?: string
  message?: string
}

export type ApiResponse<T = undefined> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  token: string
  password: string
}

export type VerifyEmailInput = {
  token: string
}
