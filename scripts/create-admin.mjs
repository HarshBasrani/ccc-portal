import { spawnSync } from "node:child_process";

const email = process.argv[2] || "admin@ccc.local";
const fullName = process.argv[3] || "Portal Admin";

const payload = `{email:'${email.replace(/'/g, "\\'")}',fullName:'${fullName.replace(/'/g, "\\'")}'} `;

const result = spawnSync(
  "cmd.exe",
  ["/c", "npm.cmd", "exec", "convex", "--", "run", "--push", "admin:seedAdminProfile", payload],
  {
    stdio: "inherit",
    shell: false,
  }
);

if (result.error) {
  console.error("Failed to run Convex seed:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
