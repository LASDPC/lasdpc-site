import { defaultUrlTransform } from "react-markdown";

export const urlTransform = (url: string) =>
  url.startsWith("data:") ? url : defaultUrlTransform(url);
