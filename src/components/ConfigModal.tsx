import React, { useState } from 'react';
import { X, ShieldCheck, Github, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Key, FolderGit2 } from 'lucide-react';
import { taskService } from '../services/taskService';
import type { RepoHealth } from '../types/task';

interface ConfigModalProps {
  isOpen: boolean;
  health: RepoHealth | null;
  onClose: () => void;
  onRefreshHealth: () => Promise<void>;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  health,
  onClose,
  onRefreshHealth,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await onRefreshHealth();
      const latest = await taskService.checkHealth();
      if (latest.connected) {
        setTestResult({
          success: true,
          message: `Successfully connected to https://github.com/${latest.owner}/${latest.repo} on branch "${latest.branch}".`,
        });
      } else {
        setTestResult({
          success: false,
          message: latest.error || 'Connection failed. Please verify your token and repo settings.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Unable to contact local server.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2.5 text-[#f0f6fc]">
            <Github className="w-5 h-5 text-[#58a6ff]" />
            <h2 className="text-base sm:text-lg font-bold">GitHub Storage & Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border bg-[#0d1117] border-[#30363d] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#c9d1d9] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#58a6ff]" />
                Repository Backend Status
              </span>
              {health?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                  Connected & Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Not Connected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[#8b949e] block">Repository Owner:</span>
                <span className="font-mono text-[#f0f6fc]">{health?.owner || '(not set)'}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block">Repository Name:</span>
                <span className="font-mono text-[#f0f6fc]">{health?.repo || '(not set)'}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block">Target Branch:</span>
                <span className="font-mono text-[#f0f6fc]">{health?.branch || 'main'}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block">Folder Path:</span>
                <span className="font-mono text-[#f0f6fc]">{health?.tasksPath ? `${health.tasksPath}/` : 'tasks/'}</span>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs ${
                  testResult.success
                    ? 'bg-[#238636]/10 border-[#238636]/30 text-[#3fb950]'
                    : 'bg-[#f85149]/10 border-[#f85149]/30 text-[#f85149]'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing connection...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#f0f6fc] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#d29922]" />
              How to configure credentials (.env)
            </h4>
            <p className="text-[#8b949e] text-xs leading-relaxed">
              For security, the GitHub Personal Access Token is stored strictly on the backend inside your local <code className="text-[#58a6ff]">.env</code> file and is <strong>never exposed to the browser</strong>.
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs text-[#c9d1d9]">
              <li>
                Create a repository on GitHub (e.g. <code className="text-[#58a6ff]">daily-task-tracker</code>).
              </li>
              <li>
                Go to GitHub &gt; <strong>Settings</strong> &gt; <strong>Developer settings</strong> &gt; <strong>Personal access tokens</strong> &gt; <strong>Fine-grained tokens</strong> (or Classic).
              </li>
              <li>
                Generate a token with <strong>Contents: Read and write</strong> repository permission.
              </li>
              <li>
                Open the file <code className="text-[#58a6ff]">.env</code> in this project and configure:
                <pre className="mt-1.5 p-2.5 bg-[#0d1117] rounded-lg border border-[#30363d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto">
{`GITHUB_TOKEN=ghp_yourActualTokenHere
GITHUB_OWNER=yourGitHubUsername
GITHUB_REPO=yourRepositoryName
GITHUB_BRANCH=main
TASKS_PATH=tasks`}
                </pre>
              </li>
              <li>
                Restart the application or click <strong>Test Connection</strong> above.
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#30363d] bg-[#161b22] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
