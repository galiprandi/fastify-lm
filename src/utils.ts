import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleRequestError = (msg: string, error: any) => {
  if (axios.isAxiosError(error)) {
    console.error(msg, error.response?.data || error.message)
  } else console.error(msg, error.message)

  return null
}
