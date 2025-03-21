import axios from "axios";

export const handleRequestError = (msg: string, error: any) => {
  if (axios.isAxiosError(error))
    console.error(msg, error.response?.data || error.message);
  else console.error(msg, error.message);

  return null;
};
