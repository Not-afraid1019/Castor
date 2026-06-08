import * as path from "node:path";
import { config } from "../config.js";

/**
 * Check if a file path is within the allowed workspace.
 * Returns { allowed: true } if accessible, or { allowed: false, message: string }
 * with a message for the agent to relay to the user.
 */
export function checkPathAccess(targetPath: string): { allowed: true } | { allowed: false; message: string } {
  const workspaceDir = config.WORKSPACE_DIR;

  // If no workspace configured, allow all (backwards-compatible)
  if (!workspaceDir) {
    return { allowed: true };
  }

  const resolved = path.resolve(targetPath);
  const workspace = path.resolve(workspaceDir);

  // Also allow access to DATA_DIR (conversations, temp scripts)
  const dataDir = path.resolve(config.DATA_DIR);

  if (isSubPath(resolved, workspace) || isSubPath(resolved, dataDir)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message:
      `[访问受限] 路径 "${resolved}" 不在工作目录 "${workspace}" 内。` +
      `请告知用户：该操作需要访问工作目录之外的文件，请用户确认是否允许。` +
      `如果用户同意，请使用带 force: true 参数重新调用此工具。`,
  };
}

/**
 * Normalize and check if `child` is inside `parent` directory.
 * Handles both Unix and Windows paths.
 */
function isSubPath(child: string, parent: string): boolean {
  const normalizedChild = path.normalize(child) + path.sep;
  const normalizedParent = path.normalize(parent) + path.sep;

  // Case-insensitive on Windows
  if (process.platform === "win32") {
    return normalizedChild.toLowerCase().startsWith(normalizedParent.toLowerCase());
  }
  return normalizedChild.startsWith(normalizedParent) || path.normalize(child) === path.normalize(parent);
}
