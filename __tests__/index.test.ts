import * as github from "@actions/github";
import * as core from "@actions/core";
import * as io from "@actions/io";
import * as path from "path";
import { TOKEN } from "./secret";
import { postToIssue } from "../src/post-to-issue";
import { Console } from "console";

const originalContext = { ...github.context };
const originalGitHubWorkspace = process.env["GITHUB_WORKSPACE"];
const gitHubWorkspace = path.resolve("/checkout-tests/workspace");
const processConsole = new Console(process.stdout, process.stderr);

type InputsMock = {
  [name: string]: string;
};

let inputs: InputsMock = {};

beforeAll(() => {
  jest.spyOn(io, "cp").mockImplementation(jest.fn());

  jest.spyOn(core, "info").mockImplementation((message: string) => {
    processConsole.log(message);
  });

  jest.spyOn(core, "getInput").mockImplementation((name: string) => {
    return inputs[name]!;
  });

  jest.spyOn(github.context, "repo", "get").mockImplementation(() => {
    return {
      owner: "iori2333",
      repo: "posts-test"
    };
  });

  github.context.actor = "iori2333";
  github.context.ref = "refs/heads/main";
  github.context.sha = "c147e141707d02a2b4211f70265fe2ca2d6aca05";

  process.env["GITHUB_WORKSPACE"] = gitHubWorkspace;
});

afterAll(() => {
  delete process.env["GITHUB_WORKSPACE"];
  if (originalGitHubWorkspace) {
    process.env["GITHUB_WORKSPACE"] = originalGitHubWorkspace;
  }

  github.context.ref = originalContext.ref;
  github.context.sha = originalContext.sha;

  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.resetModules();
  inputs = {
    token: TOKEN,
    "doc-dir": "__tests__/docs",
    branch: "main"
  };
});

describe("Gatsby Publish action", () => {
  it("should post to issue", async () => {
    await postToIssue();
  });
});
