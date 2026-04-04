export const normalizeImageForClient = (image: unknown): string => {
  if (!image) return "";

  if (Buffer.isBuffer(image)) {
    return `data:image/jpeg;base64,${image.toString("base64")}`;
  }

  if (typeof image === "string") {
    if (image.startsWith("data:")) return image;
    return `data:image/jpeg;base64,${image}`;
  }

  if (image && typeof image === "object" && "buffer" in image) {
    const buffer = (image as any).buffer;
    if (Buffer.isBuffer(buffer)) {
      return `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }
    if (buffer instanceof Uint8Array) {
      return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
    }
  }

  if (image && typeof image === "object" && "data" in image) {
    const data = (image as any).data;
    if (Buffer.isBuffer(data)) {
      return `data:image/jpeg;base64,${data.toString("base64")}`;
    }
    if (data instanceof Uint8Array) {
      return `data:image/jpeg;base64,${Buffer.from(data).toString("base64")}`;
    }
    if (typeof data === "string") {
      if (data.startsWith("data:")) return data;
      return `data:image/jpeg;base64,${data}`;
    }
  }

  if (image instanceof Uint8Array) {
    return `data:image/jpeg;base64,${Buffer.from(image).toString("base64")}`;
  }

  if (image && typeof image === "object") {
    for (const [, value] of Object.entries(image)) {
      if (Buffer.isBuffer(value)) {
        return `data:image/jpeg;base64,${value.toString("base64")}`;
      }
      if (value instanceof Uint8Array) {
        return `data:image/jpeg;base64,${Buffer.from(value).toString("base64")}`;
      }
      if (typeof value === "string" && value.trim()) {
        if (value.startsWith("data:")) return value;
        return `data:image/jpeg;base64,${value}`;
      }
    }
  }

  return "";
};
