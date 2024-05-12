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
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToIssue = void 0;
const core = __importStar(require("@actions/core"));
const ioUtil = __importStar(require("@actions/io/lib/io-util"));
const github = __importStar(require("@actions/github"));
const post_1 = require("./post");
// title: 2023-05-12_TITLE.md
const POST_REG = /^(\d{4}-\d{2}-\d{2})_(.+)\.md$/;
const DEFAULT_BRANCH = "master";
const DEFAULT_ASSETS_PREFIX = "assets/";
function postToIssue() {
  return __awaiter(this, void 0, void 0, function* () {
    const token = core.getInput("token");
    const branch = core.getInput("branch") || DEFAULT_BRANCH;
    const assetsPrefix =
      core.getInput("assets-prefix") || DEFAULT_ASSETS_PREFIX;
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const docDir = core.getInput("doc-dir");
    if (!docDir) {
      core.setFailed("doc-dir not set");
      return;
    }
    const repoGlobURL = `https://github.com/${owner}/${repo}/blob/${branch}/${docDir}/`;
    const existingIssues = yield octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      labels: "post"
    });
    const files = yield ioUtil.readdir(docDir);
    const posts = yield Promise.all(
      files
        .filter(file => POST_REG.test(file))
        .map(file => {
          return (0, post_1.createPost)({
            file: `${docDir}/${file}`,
            globURL: repoGlobURL,
            assetsPrefix
          });
        })
    );
    if (posts.length === 0) {
      core.info("No posts found");
      return;
    }
    const publishPost = post =>
      __awaiter(this, void 0, void 0, function* () {
        if (existingIssues.data.some(it => it.title === post.title)) {
          core.info(`Post already exists: ${post.title}`);
          return;
        }
        core.info(`Publishing post: ${post.title}`);
        const issue = yield octokit.rest.issues.create({
          owner,
          repo,
          title: post.title,
          body: post.paragraphs[0],
          labels: post.tags
        });
        for (const p of post.paragraphs.slice(1)) {
          yield octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issue.data.number,
            body: p
          });
        }
      });
    for (const post of posts) {
      core.info(`Post: ${post.title}, Date: ${post.date}, Tags: ${post.tags}`);
      for (const p of post.paragraphs) {
        core.info(p);
      }
      yield publishPost(post);
    }
    core.info("Post to issue done");
  });
}
exports.postToIssue = postToIssue;
