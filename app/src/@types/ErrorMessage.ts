export const badRequestError: string =
  'The server could not handle your request, it has been reported to the developers for ' +
  'further investigation, please try again later. We are sorry for any inconvenience caused.';
export const connectionError: string =
  'Could not connect to the server. Please check your internet connection or try again later. ' +
  'We are sorry for any inconvenience caused.';


export const didFailToFetch = (error: string) => error === 'TypeError: Failed to fetch';
