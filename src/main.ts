import * as core from "@actions/core";
import { postToIssue } from "./post-to-issue";

postToIssue()
  .then(() => process.exit(0))
  .catch(err => {
    core.setFailed(err);
    process.exit(1);
  });
