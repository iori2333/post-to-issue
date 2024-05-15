import * as ioUtil from "@actions/io/lib/io-util";

import yaml from "yaml";

const IMAGE_REG = /!\[.*?\]\((.*?)\)/g;

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

function parseHeader(lines: string[]): PostHeader {
  const header = lines.map(it => it.substring(2)).join("\n");
  const head = yaml.parse(header);
  if (!head.title || !head.date) {
    throw new Error("Title and date are required");
  }

  return {
    title: head.title,
    date: head.date,
    tags: head.tags ?? []
  };
}

function parseBody(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of lines.map(it => it.trim())) {
    if (line.startsWith("# ") || line.startsWith("## ")) {
      paragraphs.push(current.join("\n"));
      current = [];
    }
    current.push(line);
  }
  paragraphs.push(current.join("\n"));

  return paragraphs.map(it => it.trim()).filter(it => it.length > 0);
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

  const lines = content.split("\n");
  const sep = lines.findIndex(it => !it.startsWith("> "));
  if (sep === -1) {
    throw new Error("Header and body are required");
  }

  const header = parseHeader(lines.slice(0, sep));
  const paragraphs = parseBody(lines.slice(sep));
  return {
    ...header,
    paragraphs
  };
}
