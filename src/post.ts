import * as ioUtil from "@actions/io/lib/io-util";

import yaml from "yaml";

const IMAGE_REG = /!\[.*?\]\((.*?)\)/g;

const SEP = "\n\n\n";
const HEADER_START = "------";
const HEADER_END = "------";

export interface PostOptions {
  file: string;
  globURL: string;
  assetsPrefix: string;
}

export interface PostHeader {
  title: string;
  date: string;
  tags: string[];
}

export interface Post extends PostHeader {
  paragraphs: string[];
}

function parseHeader(content: string): [PostHeader, string] {
  const start = content.indexOf(HEADER_START);
  const end = content.indexOf(HEADER_END, start + HEADER_START.length);
  if (start === -1 || end === -1) {
    throw new Error("Header not found");
  }

  const header = content.slice(start + HEADER_START.length, end).trim();
  const head = yaml.parse(header);
  if (!head.title || !head.date) {
    throw new Error("Title and date are required");
  }
  const body = content.slice(end + HEADER_END.length).trim();

  return [
    {
      title: head.title,
      date: head.date,
      tags: head.tags ?? []
    },
    body
  ];
}

function replaceImage(
  content: string,
  blobUrl: string,
  assetsPrefix: string
): string {
  return content.replace(IMAGE_REG, (match, url: string) => {
    if (url.startsWith(assetsPrefix)) {
      return match.replace(url, blobUrl + url);
    }
    return match;
  });
}

export async function createPost({
  file,
  globURL,
  assetsPrefix
}: PostOptions): Promise<Post> {
  const handle = await ioUtil.open(file, "r");
  const content = await handle
    .readFile({ encoding: "utf8" })
    .then(it => replaceImage(it, globURL, assetsPrefix));
  const [header, body] = parseHeader(content);
  return {
    ...header,
    paragraphs: body.split(SEP).map(it => it.trim())
  };
}
