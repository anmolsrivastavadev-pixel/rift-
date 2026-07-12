"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Folder,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { useActionState } from "react";

import {
  createProject,
  renameProject,
  archiveProject,
  unarchiveProject,
  deleteArchivedProject,
  type CreateProjectResult,
  type RenameProjectResult,
  type ArchiveActionResult,
} from "@/actions/projects";
import { projectHref } from "@/lib/project-href";
import { Button } from "@/components/ui/button";

export type ProjectOption = {
  id: string;
  name: string;
};

/**
 * M16A/M16B1/M16B2/M34 — Sidebar project list + inline forms.
 *
 * - Url is the source of truth; the current project is derived from it.
 * - Projects render as a visible vertical list (M34 — replaced the old
 *   dropdown so switching projects is a deliberate, visible action). Clicking
 *   a row navigates to the current path with `?projectId=…`.
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
  onNavigate,
}: {
  projects: ProjectOption[];
  archivedProjects: ProjectOption[];
  currentProjectId: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [mode, setMode] = React.useState<"idle" | "create" | "rename" | "archive">("idle");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const queryProjectId = search.get("projectId");
  const selectedProjectId = queryProjectId && projects.some((project) => project.id === queryProjectId)
    ? queryProjectId
    : currentProjectId;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const canArchive = projects.length > 1;

  function navigateToProject(projectId: string) {
    // Drop the current query string: switching projects resets page-local
    // state (filters/sort/tab). projectHref re-adds the projectId param.
    router.push(projectHref(pathname, projectId));
    onNavigate?.();
  }

  function openForm(next: "create" | "rename" | "archive") {
    setNotice(null);
    setMode(next);
  }

  // Auto-clear success notices after 4 seconds.
  React.useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <Folder className="h-3 w-3" />
        <span className="flex-1">Project</span>
        <button
          type="button"
          onClick={() => setManageOpen((v) => !v)}
          title="Manage projects"
          aria-label="Manage projects"
          aria-expanded={manageOpen}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        role="list"
        aria-label="Your projects"
        className="max-h-48 space-y-0.5 overflow-y-auto pr-1"
      >
        {projects.map((p) => {
          const isCurrent = p.id === selectedProjectId;
          return (
            <button
              key={p.id}
              type="button"
              role="listitem"
              onClick={() => {
                if (!isCurrent) navigateToProject(p.id);
              }}
              aria-current={isCurrent ? "true" : undefined}
              title={p.name}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors duration-150 ease-out ${
                isCurrent
                  ? "bg-[var(--color-primary-soft)] font-medium text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <Folder
                className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? "text-[var(--color-primary)]" : ""}`}
              />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {isCurrent && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
              )}
            </button>
          );
        })}
      </div>

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
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </button>
          {notice && (
            <p className="flex items-start gap-1 px-2 text-xs text-[var(--color-primary)]">
              <Check className="mt-0.5 h-3 w-3 shrink-0" /> {notice}
            </p>
          )}

          {manageOpen && (
            <div className="space-y-1 border-t border-[var(--color-border)] pt-2">
              <button
                type="button"
                onClick={() => openForm("rename")}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename project
              </button>
              {canArchive && (
                <button
                  type="button"
                  onClick={() => openForm("archive")}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive project
                </button>
              )}

              {archivedProjects.length > 0 && (
                <div className="space-y-1 border-t border-[var(--color-border)] pt-2">
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
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
                      <p className="px-2 text-xs leading-snug text-[var(--color-muted-foreground)]/80">
                        Archived projects are hidden, not deleted.
                      </p>
                      {archivedProjects.map((p) => (
                        <ArchivedProjectRow key={p.id} projectId={p.id} projectName={p.name} />
                      ))}
                    </div>
                  )}
                </div>
              )}
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
      <div className="flex items-center gap-1.5">
        <input
          name="name"
          type="text"
          required
          maxLength={60}
          placeholder="e.g. Dog groomers"
          autoFocus
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none focus:border-[var(--color-primary)]"
        />
        <span
          title="Use separate projects for different niches."
          aria-label="Use separate projects for different niches."
          tabIndex={0}
          className="shrink-0 text-[var(--color-muted-foreground)]"
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Cancel
        </button>
      </div>
      {state && !state.ok && (
        <p className="flex items-start gap-1 text-xs text-[var(--color-danger)]">
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
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
          Save name
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Cancel
        </button>
      </div>
      {state && !state.ok && (
        <p className="flex items-start gap-1 text-xs text-[var(--color-danger)]">
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
      <p className="text-xs leading-snug text-[var(--color-muted-foreground)]">
        Archiving hides this project. It does not delete your data.
      </p>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
          Archive project
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Cancel
        </button>
      </div>
      {state && !state.ok && (
        <p className="flex items-start gap-1 text-xs text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {state.error}
        </p>
      )}
    </form>
  );
}

function ArchivedProjectRow({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  // On success the restore action redirects into the restored project.
  const [restoreState, restoreAction, restorePending] = useActionState<
    ArchiveActionResult | null,
    FormData
  >(unarchiveProject, null);

  // On success the delete action redirects to /dashboard, so this form only
  // ever renders errors (wrong confirmation text, project already gone, …).
  const [deleteState, deleteAction, deletePending] = useActionState<
    ArchiveActionResult | null,
    FormData
  >(deleteArchivedProject, null);

  return (
    <div className="space-y-1 px-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-[var(--color-muted-foreground)]">
          {projectName}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <form action={restoreAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              disabled={restorePending}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-50"
            >
              {restorePending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArchiveRestore className="h-3 w-3" />
              )}
              Restore
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmingDelete((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Delete permanently
          </button>
        </div>
      </div>
      {restoreState && !restoreState.ok && (
        <p className="flex items-start gap-1 text-xs text-[var(--color-danger)]">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {restoreState.error}
        </p>
      )}
      {confirmingDelete && (
        <form
          action={deleteAction}
          className="space-y-2 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-card)] p-2"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <p className="text-xs leading-snug text-[var(--color-muted-foreground)]">
            This removes the project, complaints, ideas, and saved ideas. This
            cannot be undone.
          </p>
          <label className="block text-xs text-[var(--color-muted-foreground)]">
            Type the project name to confirm.
            <input
              name="confirmName"
              type="text"
              required
              autoComplete="off"
              placeholder={projectName}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/60 outline-none focus:border-[var(--color-danger)]"
            />
          </label>
          <div className="flex items-center gap-2">
            <Button variant="danger" type="submit" size="sm" disabled={deletePending}>
              {deletePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete permanently
            </Button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancel
            </button>
          </div>
          {deleteState && !deleteState.ok && (
            <p className="flex items-start gap-1 text-xs text-[var(--color-danger)]">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {deleteState.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}