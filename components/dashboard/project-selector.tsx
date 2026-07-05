"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Folder,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useActionState } from "react";

import {
  createProject,
  renameProject,
  archiveProject,
  unarchiveProject,
  type CreateProjectResult,
  type RenameProjectResult,
  type ArchiveActionResult,
} from "@/actions/projects";
import { projectHref } from "@/lib/project-href";

export type ProjectOption = {
  id: string;
  name: string;
};

/**
 * M16A/M16B1/M16B2 — Sidebar project selector + inline forms.
 *
 * - Url is the source of truth (the native `<select>` uses defaultValue).
 * - Changing the select navigates to the current path with `?projectId=…`.
 * - Creating a project submits via `useActionState`; on success it navigates to
 *   the new project on the current path.
 * - Renaming keeps the same project id, so the URL and all project-scoped data
 *   stay attached; the sidebar just shows the new name after revalidation.
 * - Archiving hides a project without deleting anything; the server action
 *   redirects to the oldest remaining active project. Restore brings it back
 *   and redirects into it. Both only appear when applicable: archive is hidden
 *   for the last active project, the archived area is hidden when empty.
 * - Selector and forms render server-provided `projects` (active only),
 *   `archivedProjects`, and `currentProjectId`.
 */
export function ProjectSelector({
  projects,
  archivedProjects,
  currentProjectId,
}: {
  projects: ProjectOption[];
  archivedProjects: ProjectOption[];
  currentProjectId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [mode, setMode] = React.useState<"idle" | "create" | "rename" | "archive">("idle");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const queryProjectId = search.get("projectId");
  const selectedProjectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const canArchive = projects.length > 1;

  function navigateToProject(projectId: string) {
    router.push(projectHref(`${pathname}?${search.toString()}`, projectId));
  }

  function openForm(next: "create" | "rename" | "archive") {
    setNotice(null);
    setMode(next);
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

      {mode === "create" && (
        <NewProjectForm
          onCancel={() => setMode("idle")}
          onCreated={(id) => {
            setMode("idle");
            setNotice("Project created.");
            navigateToProject(id);
          }}
        />
      )}

      {mode === "rename" && selectedProject && (
        <RenameProjectForm
          projectId={selectedProject.id}
          currentName={selectedProject.name}
          onCancel={() => setMode("idle")}
          onRenamed={() => {
            setMode("idle");
            setNotice("Project renamed.");
            router.refresh();
          }}
        />
      )}

      {mode === "archive" && selectedProject && (
        <ArchiveProjectForm
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onCancel={() => setMode("idle")}
        />
      )}

      {mode === "idle" && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => openForm("create")}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
          >
            <Plus className="h-3.5 w-3.5" /> Create project
          </button>
          <button
            type="button"
            onClick={() => openForm("rename")}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
          >
            <Pencil className="h-3.5 w-3.5" /> Rename project
          </button>
          {canArchive && (
            <button
              type="button"
              onClick={() => openForm("archive")}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
            >
              <Archive className="h-3.5 w-3.5" /> Archive project
            </button>
          )}
          {notice && (
            <p className="flex items-start gap-1 px-2 text-[11px] text-[var(--color-primary)]">
              <Check className="mt-0.5 h-3 w-3 shrink-0" /> {notice}
            </p>
          )}
          <p className="px-2 text-[10px] leading-snug text-[var(--color-muted-foreground)]/80">
            Use separate projects for different niches.
          </p>
        </div>
      )}

      {archivedProjects.length > 0 && (
        <div className="space-y-1 border-t border-[var(--color-border)] pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-card)]/60 hover:text-[var(--color-foreground)]"
          >
            {showArchived ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Archived projects ({archivedProjects.length})
          </button>
          {showArchived && (
            <div className="space-y-1">
              <p className="px-2 text-[10px] leading-snug text-[var(--color-muted-foreground)]/80">
                Archived projects are hidden, not deleted.
              </p>
              {archivedProjects.map((p) => (
                <RestoreProjectRow key={p.id} projectId={p.id} projectName={p.name} />
              ))}
            </div>
          )}
        </div>
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
        maxLength={60}
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

function RenameProjectForm({
  projectId,
  currentName,
  onCancel,
  onRenamed,
}: {
  projectId: string;
  currentName: string;
  onCancel: () => void;
  onRenamed: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    RenameProjectResult | null,
    FormData
  >(renameProject, null);

  // Report success to the parent exactly once (same ref-guard pattern as
  // NewProjectForm) so the form closes and the sidebar refreshes.
  const reportedRef = React.useRef(false);
  React.useEffect(() => {
    if (state && state.ok && !reportedRef.current) {
      reportedRef.current = true;
      onRenamed();
    }
  }, [state, onRenamed]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="name"
        type="text"
        required
        maxLength={60}
        defaultValue={currentName}
        aria-label="New project name"
        autoFocus
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
          Save name
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

function ArchiveProjectForm({
  projectId,
  projectName,
  onCancel,
}: {
  projectId: string;
  projectName: string;
  onCancel: () => void;
}) {
  // On success the server action redirects to another active project, so this
  // form only ever renders errors (e.g. last-active-project protection).
  const [state, formAction, pending] = useActionState<
    ArchiveActionResult | null,
    FormData
  >(archiveProject, null);

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2">
      <input type="hidden" name="projectId" value={projectId} />
      <p className="text-xs text-[var(--color-foreground)]">
        Archive <span className="font-medium">{projectName}</span>?
      </p>
      <p className="text-[10px] leading-snug text-[var(--color-muted-foreground)]">
        Archiving hides this project. It does not delete your data.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
          Archive project
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

function RestoreProjectRow({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  // On success the server action redirects into the restored project.
  const [state, formAction, pending] = useActionState<
    ArchiveActionResult | null,
    FormData
  >(unarchiveProject, null);

  return (
    <form action={formAction} className="space-y-1 px-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-[var(--color-muted-foreground)]">
          {projectName}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-card)]/60 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArchiveRestore className="h-3 w-3" />
          )}
          Restore
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
