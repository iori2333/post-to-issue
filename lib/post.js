"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            }
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = void 0;
const ioUtil = __importStar(require("@actions/io/lib/io-util"));
const yaml_1 = __importDefault(require("yaml"));
const IMAGE_REG = /!\[.*?\]\((.*?)\)/g;
const SEP = "\n\n\n";
const HEADER_START = "------";
const HEADER_END = "------";
function parseHeader(content) {
  var _a;
  const start = content.indexOf(HEADER_START);
  const end = content.indexOf(HEADER_END, start + HEADER_START.length);
  if (start === -1 || end === -1) {
    throw new Error("Header not found");
  }
  const header = content.slice(start + HEADER_START.length, end).trim();
  const head = yaml_1.default.parse(header);
  if (!head.title || !head.date) {
    throw new Error("Title and date are required");
  }
  const body = content.slice(end + HEADER_END.length).trim();
  return [
    {
      title: head.title,
      date: head.date,
      tags: (_a = head.tags) !== null && _a !== void 0 ? _a : []
    },
    body
  ];
}
function replaceImage(content, blobUrl, assetsPrefix) {
  return content.replace(IMAGE_REG, (match, url) => {
    if (url.startsWith(assetsPrefix)) {
      return match.replace(url, blobUrl + url);
    }
    return match;
  });
}
function createPost(_a) {
  return __awaiter(
    this,
    arguments,
    void 0,
    function* ({ file, globURL, assetsPrefix }) {
      const handle = yield ioUtil.open(file, "r");
      const content = yield handle
        .readFile({ encoding: "utf8" })
        .then(it => replaceImage(it, globURL, assetsPrefix));
      const [header, body] = parseHeader(content);
      return Object.assign(Object.assign({}, header), {
        paragraphs: body.split(SEP).map(it => it.trim())
      });
    }
  );
}
exports.createPost = createPost;
