"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Folder, Plus, Loader2, AlertCircle } from "lucide-react";
import { useActionState } from "react";

import { createProject, type CreateProjectResult } from "@/actions/projects";
import { projectHref } from "@/lib/project-href";

export type ProjectOption = {
  id: string;
  name: string;
};

/**
 * M16A — Sidebar project selector + inline New Project form.
 *
 * - Url is the source of truth (the native `<select>` uses defaultValue).
 * - Changing the select navigates to the current path with `?projectId=…`.
 * - Creating a project submits via `useActionState`; on success it navigates to
 *   the new project on the current path.
 * - Selector and form render server-provided `projects`/`currentProjectId`.
 *   No client-only state beyond a small toggle for showing the create form.
 */
export function ProjectSelector({
  projects,
  currentProjectId,
}: {
  projects: ProjectOption[];
  currentProjectId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [showCreate, setShowCreate] = React.useState(false);
  const queryProjectId = search.get("projectId");
  const selectedProjectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;

  function navigateToProject(projectId: string) {
    router.push(projectHref(`${pathname}?${search.toString()}`, projectId));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <Folder className="h-3 w-3" />
        Project
      </div>

      <select
        key={selectedProjectId}
        aria-label="Select project"
        defaultValue={selectedProjectId}
        onChange={(e) => navigateToProject(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[var(--color-primary)] focus-visible:outline focus-visible:[outline-offset:2px] focus-visible:[outline-color:var(--color-primary)]"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {showCreate ? (
        <NewProjectForm
          onCancel={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            navigateToProject(id);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
        >
          <Plus className="h-3.5 w-3.5" /> New project
        </button>
      )}
    </div>
  );
}

function NewProjectForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (projectId: string) => void;
}) {
  const [state, formAction, pending] = useActionState<
    CreateProjectResult | null,
    FormData
  >(createProject, null);

  // Once a project is created, surface it to the parent. Use a ref guard so
  // this fires only once per success.
  const reportedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (state && state.ok && reportedRef.current !== state.project.id) {
      reportedRef.current = state.project.id;
      onCreated(state.project.id);
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} className="space-y-2">
      <input
        name="name"
        type="text"
        required
        maxLength={80}
        placeholder="e.g. Dog groomers"
        autoFocus
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Cancel
        </button>
      </div>
      {state && !state.ok && (
        <p className="flex items-start gap-1 text-[11px] text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {state.error}
        </p>
      )}
    </form>
  );
}
