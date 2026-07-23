import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { ModpackProject } from '@shared/types'

function projectsDir(): string {
  return join(app.getPath('userData'), 'projects')
}

function projectPath(id: string): string {
  return join(projectsDir(), `${id}.json`)
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(projectsDir(), { recursive: true })
}

export async function listProjects(): Promise<ModpackProject[]> {
  await ensureDir()
  const files = await fs.readdir(projectsDir())
  const projects = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => JSON.parse(await fs.readFile(join(projectsDir(), f), 'utf-8')) as ModpackProject)
  )
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveProject(project: ModpackProject): Promise<void> {
  await ensureDir()
  const updated: ModpackProject = { ...project, updatedAt: new Date().toISOString() }
  await fs.writeFile(projectPath(project.id), JSON.stringify(updated, null, 2), 'utf-8')
}

export async function deleteProject(id: string): Promise<void> {
  await fs.rm(projectPath(id), { force: true })
}
