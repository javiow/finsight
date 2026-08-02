export interface DecodedCsv {
  text: string;
  encoding: "utf-8" | "cp949";
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function decodeCsvBuffer(buffer: ArrayBuffer): DecodedCsv {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { text: stripBom(text), encoding: "utf-8" };
  } catch {
    const text = new TextDecoder("euc-kr").decode(buffer);
    return { text: stripBom(text), encoding: "cp949" };
  }
}
