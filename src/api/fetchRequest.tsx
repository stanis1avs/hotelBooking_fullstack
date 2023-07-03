export const fetchRequestGet = async (url: string, accessToken: string | null = null, query: string | null = null, id: number | null = null) => {
  const headers: Record<string, string> = {}
  if(accessToken){
    headers.Authorization = `Bearer ${accessToken}`
  }
  const response = await fetch(`${process.env.REACT_APP_HOST}${url}${query ? `/${query}` : ""}${id ? `/${id}` : ""}`, {
    method: 'GET',
    headers,
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
};

export const fetchRequestPost = async (url: string, accessToken: string | null = null, data: any | null = null, header: any | null = null) => {
  const headers = {...header};
  if(accessToken){
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(`${process.env.REACT_APP_HOST}${url}`, {
    method: 'POST',
    headers,
    body: data,
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
}

export const fetchRequestPut = async (url: string, accessToken: string, data: any, id: string) => {
const response = await fetch(`${process.env.REACT_APP_HOST}${url}${`/${id}`}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: data,
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
};

export const fetchRequestDelete = async (url: string, accessToken: string, id: string) => {
const response = await fetch(`${process.env.REACT_APP_HOST}${url}${`/${id}`}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
};

export const sendEvent = async (socket: any, accessToken: string, event: string, data: any) => {
  socket.emit(event, data)
};