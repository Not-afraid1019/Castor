import * as os from "node:os";

export function getShell(): string {
  return os.platform() === "win32" ? "powershell.exe" : "/bin/bash";
}

export function getScriptRunner(language: string): string {
  switch (language) {
    case "python":
      return os.platform() === "win32" ? "python" : "python3";
    case "node":
      return "node";
    case "bash":
      return "bash";
    case "powershell":
      return os.platform() === "win32" ? "powershell.exe" : "pwsh";
    default:
      return "bash";
  }
}
